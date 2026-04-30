"""
URL patterns for accounts app.
"""
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('users/', UserListView.as_view(), name='auth-users'),
]
