# Archivo: users/urls.py

from django.urls import path
from .views import UserRegisterView
from .views import UserRegisterView, PendingUsersListView, ApproveUserView # Añadimos las nuevas vistas

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),

    # Nuevas rutas para el administrador
    path('admin/pending-users/', PendingUsersListView.as_view(), name='pending-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
]