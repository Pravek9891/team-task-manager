"""
Core app — Dashboard and health-check endpoints.
"""
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from tasks.models import Task
from projects.models import Project


class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns aggregated stats for the current user.
    Admins get global stats; members get their own stats.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        if user.is_admin:
            all_tasks = Task.objects.all()
            all_projects = Project.objects.all()
            assigned_tasks = Task.objects.filter(assigned_to=user)
        else:
            all_tasks = Task.objects.filter(
                assigned_to=user
            )
            all_projects = Project.objects.filter(members=user)
            assigned_tasks = all_tasks

        total_tasks = all_tasks.count()
        completed_tasks = all_tasks.filter(status=Task.Status.DONE).count()
        in_progress_tasks = all_tasks.filter(status=Task.Status.IN_PROGRESS).count()
        todo_tasks = all_tasks.filter(status=Task.Status.TODO).count()
        overdue_tasks = all_tasks.exclude(status=Task.Status.DONE).filter(
            due_date__lt=today
        ).count()

        # Recent tasks for the current user
        my_tasks = assigned_tasks.select_related('project').order_by('-created_at')[:10]

        from tasks.serializers import TaskSerializer
        return Response({
            'stats': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'todo_tasks': todo_tasks,
                'overdue_tasks': overdue_tasks,
                'total_projects': all_projects.count(),
            },
            'my_tasks': TaskSerializer(my_tasks, many=True).data,
        })


class HealthCheckView(APIView):
    """GET /api/health/ — Service health check (no auth required)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'Team Task Manager API'})
