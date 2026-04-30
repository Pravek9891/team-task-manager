"""
Project model — supports team membership and admin ownership.
"""
from django.db import models
from django.conf import settings


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='member_projects',
        blank=True,
        through='ProjectMember',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """Explicit join table for Project <-> User membership."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_memberships',
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_members'
        unique_together = ('project', 'user')

    def __str__(self):
        return f'{self.user.email} in {self.project.name}'
