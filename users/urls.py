# Archivo: users/urls.py (VERSIÓN FINAL: 2FA + ADMIN + PERFIL DE USUARIO)

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Importamos TODAS las vistas necesarias
from .views import (
    # 1. Autenticación (Sistema 2FA)
    CustomTokenObtainPairView, 
    Verify2FAView, 
    
    # 2. Gestión de Cuenta y Perfil (¡AQUÍ ESTÁ LA NUEVA!)
    UserRegisterView, 
    UserProfileView,  # <--- Agregado del código nuevo
    SetNewPasswordView,
    PasswordResetRequestView, 
    PasswordResetConfirmView,

    # 3. Administración de Usuarios
    AllUsersListView, 
    ApproveUserView,
    RejectUserView, 
    ToggleUserActiveView,
    ReassignRoleView,

    # 4. Sistema de Relevos (Handover)
    IniciarRelevoView,
    AcceptHandoverView,
    RejectHandoverView,
)

urlpatterns = [
    # --- RUTAS DE AUTENTICACIÓN (Login con 2FA) ---
    # Usamos CustomTokenObtainPairView para mantener la seguridad
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/verify-2fa/', Verify2FAView.as_view(), name='token_verify_2fa'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- RUTAS DE CICLO DE VIDA DE USUARIO ---
    path('register/', UserRegisterView.as_view(), name='user-register'),
    
    # --- ¡NUEVA RUTA DE PERFIL! ---
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    # ------------------------------

    # --- RUTAS DE CONTRASEÑA ---
    path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # --- RUTAS DE ADMINISTRADOR ---
    path('admin/all-users/', AllUsersListView.as_view(), name='all-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
    path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),
    
    # Herramientas de gestión extra
    path('admin/toggle-active/<int:pk>/', ToggleUserActiveView.as_view(), name='toggle-user-active'),
    path('admin/reassign-role/<int:pk>/', ReassignRoleView.as_view(), name='reassign-role'),
    
    # --- RUTAS DE RELEVO (Comandante saliente/entrante) ---
    path('admin/iniciar-relevo/<int:pk>/', IniciarRelevoView.as_view(), name='iniciar-relevo'),
    path('accept-handover/', AcceptHandoverView.as_view(), name='accept-handover'),
    path('reject-handover/', RejectHandoverView.as_view(), name='reject-handover'),
]