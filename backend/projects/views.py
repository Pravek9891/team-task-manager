"""
Project views with role-based access control.
"""
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import IsAdminUser
from .models import Project, ProjectMember
from .serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    AddMemberSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for Projects.

    - Admins see all projects; members see only their assigned projects.
    - Only admins can create, update, delete projects.
    - Only admins can add/remove members.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Project.objects.all().prefetch_related('members', 'tasks')
        # Members only see projects they belong to
        return Project.objects.filter(
            Q(members=user) | Q(owner=user)
        ).distinct().prefetch_related('members', 'tasks')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdminUser])
    def add_member(self, request, pk=None):
        """POST /api/projects/{id}/add_member/ — Add a user to the project."""
        project = self.get_object()
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(id=serializer.validated_data['user_id'])
        membership, created = ProjectMember.objects.get_or_create(project=project, user=user)
        if not created:
            return Response({'message': 'User is already a member.'}, status=status.HTTP_200_OK)
        return Response({'message': f'{user.email} added to {project.name}.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsAdminUser],
            url_path='remove_member/(?P<user_id>[^/.]+)')
    def remove_member(self, request, pk=None, user_id=None):
        """DELETE /api/projects/{id}/remove_member/{user_id}/ — Remove a user from the project."""
        project = self.get_object()
        try:
            membership = ProjectMember.objects.get(project=project, user_id=user_id)
            membership.delete()
            return Response({'message': 'Member removed.'}, status=status.HTTP_204_NO_CONTENT)
        except ProjectMember.DoesNotExist:
            return Response({'error': 'Member not found in this project.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """GET /api/projects/{id}/members/ — List all members of a project."""
        project = self.get_object()
        from accounts.serializers import UserSerializer
        serializer = UserSerializer(project.members.all(), many=True)
        return Response(serializer.data)
