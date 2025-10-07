# Archivo: users/urls.py

# from django.urls import path
# from .views import UserRegisterView
# from .views import UserRegisterView, PendingUsersListView, ApproveUserView # Añadimos las nuevas vistas
# from .views import SetNewPasswordView # Añade este import
# from .views import RejectUserView
# from .views import (
#     UserRegisterView, 
#     PendingUsersListView, 
#     ApproveUserView, 
#     RejectUserView, 
#     SetNewPasswordView)


# urlpatterns = [
#     path('register/', UserRegisterView.as_view(), name='user-register'),

#     # Nuevas rutas para el administrador
#     path('admin/pending-users/', PendingUsersListView.as_view(), name='pending-users-list'),
#     path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
#     path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),
#     path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),

# ]

# Archivo: users/urls.py
# Archivo: users/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserRegisterView, PendingUsersListView, ApproveUserView,
    RejectUserView, SetNewPasswordView
)

urlpatterns = [
    # --- RUTAS DE AUTENTICACIÓN ---
    # La ruta completa será: /api/auth/token/
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- RUTAS DE REGISTRO Y ACTIVACIÓN ---
    # La ruta completa será: /api/register/
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),

    # --- RUTAS DE ADMINISTRADOR ---
    # La ruta completa será: /api/admin/pending-users/
    path('admin/pending-users/', PendingUsersListView.as_view(), name='pending-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
    path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),
]