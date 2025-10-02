# Archivo: users/urls.py

from django.urls import path
from .views import UserRegisterView
from .views import UserRegisterView, PendingUsersListView, ApproveUserView # Añadimos las nuevas vistas
from .views import SetNewPasswordView # Añade este import
from .views import RejectUserView
from .views import (
    UserRegisterView, 
    PendingUsersListView, 
    ApproveUserView, 
    RejectUserView, 
    SetNewPasswordView)


urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),

    # Nuevas rutas para el administrador
    path('admin/pending-users/', PendingUsersListView.as_view(), name='pending-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
    path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),
    path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),

]