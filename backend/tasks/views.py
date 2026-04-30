"""
Task views with role-based access and filtering.
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminUser
from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, TaskStatusUpdateSerializer
from .filters import TaskFilter


class TaskViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tasks.

    - Admins see all tasks; members see tasks in their projects only.
    - Members can update status of tasks assigned to them.
    - Only admins/project-members can create tasks.
    """
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Task.objects.select_related(
                'project', 'assigned_to', 'created_by'
            ).all()
        # Members see tasks in their projects + tasks assigned to them
        return Task.objects.select_related(
            'project', 'assigned_to', 'created_by'
        ).filter(
            Q(project__members=user) | Q(assigned_to=user) | Q(project__owner=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return TaskCreateSerializer
        if self.action == 'update_status':
            return TaskStatusUpdateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """PATCH /api/tasks/{id}/status/ — Update task status."""
        task = self.get_object()
        user = request.user

        # Members can only update status of their own assigned tasks
        if not user.is_admin and task.assigned_to != user:
            return Response(
                {'error': 'You can only update tasks assigned to you.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TaskSerializer(task).data)

    @action(detail=False, methods=['get'], url_path='my-tasks')
    def my_tasks(self, request):
        """GET /api/tasks/my-tasks/ — All tasks assigned to the current user."""
        tasks = Task.objects.filter(assigned_to=request.user).select_related(
            'project', 'assigned_to', 'created_by'
        )
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
