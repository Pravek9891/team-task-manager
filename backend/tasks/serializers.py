"""
Serializers for the tasks app.
"""
from rest_framework import serializers
from django.utils import timezone
from accounts.serializers import UserSerializer
from projects.serializers import ProjectSerializer
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'project', 'project_name',
            'assigned_to', 'created_by', 'status', 'priority',
            'due_date', 'is_overdue', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['title', 'description', 'project', 'assigned_to_id', 'status', 'priority', 'due_date']

    def validate_assigned_to_id(self, value):
        if value is not None:
            from accounts.models import User
            if not User.objects.filter(id=value, is_active=True).exists():
                raise serializers.ValidationError('Assigned user not found.')
        return value

    def validate_project(self, value):
        user = self.context['request'].user
        if not user.is_admin:
            # Members can only create tasks in their assigned projects
            if not value.members.filter(id=user.id).exists() and value.owner != user:
                raise serializers.ValidationError('You are not a member of this project.')
        return value

    def create(self, validated_data):
        assigned_to_id = validated_data.pop('assigned_to_id', None)
        task = Task.objects.create(**validated_data)
        if assigned_to_id:
            from accounts.models import User
            task.assigned_to = User.objects.get(id=assigned_to_id)
            task.save()
        return task


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status']

    def validate_status(self, value):
        valid = [choice[0] for choice in Task.Status.choices]
        if value not in valid:
            raise serializers.ValidationError(f'Invalid status. Valid values: {valid}')
        return value
