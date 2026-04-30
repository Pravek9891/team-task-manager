"""
Task filters using django-filter.
"""
import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Task.Status.choices)
    priority = django_filters.ChoiceFilter(choices=Task.Priority.choices)
    project = django_filters.NumberFilter(field_name='project__id')
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    class Meta:
        model = Task
        fields = ['status', 'priority', 'project', 'assigned_to']

    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        today = timezone.now().date()
        if value:
            return queryset.filter(due_date__lt=today).exclude(status=Task.Status.DONE)
        return queryset.exclude(due_date__lt=today).filter(status=Task.Status.DONE)
