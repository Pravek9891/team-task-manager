"""
Serializers for the projects app.
"""
from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Project, ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner',
            'members', 'member_count', 'task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_task_count(self, obj):
        return obj.tasks.count()


class ProjectCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list,
    )

    class Meta:
        model = Project
        fields = ['name', 'description', 'member_ids']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        project = Project.objects.create(**validated_data)
        if member_ids:
            from accounts.models import User
            users = User.objects.filter(id__in=member_ids)
            for user in users:
                ProjectMember.objects.get_or_create(project=project, user=user)
        return project

    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update memberships if provided
        if member_ids is not None:
            from accounts.models import User
            # Remove all existing members
            instance.memberships.all().delete()
            # Add new members
            users = User.objects.filter(id__in=member_ids)
            for user in users:
                ProjectMember.objects.create(project=instance, user=user)
                
        return instance


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        from accounts.models import User
        if not User.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('User not found.')
        return value
