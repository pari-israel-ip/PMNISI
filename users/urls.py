# Archivo: users/urls.py (VERSIÓN FINAL - FUSIONADA)

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# --- Vistas importadas (hemos fusionado ambas listas) ---
from .views import (
    # Las nuevas vistas de login 2FA
    CustomTokenObtainPairView, 
    Verify2FAView, 
    
    # El resto de nuestras vistas
    UserRegisterView, 
    AllUsersListView, 
    ApproveUserView,
    RejectUserView, 
    SetNewPasswordView,
    IniciarRelevoView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AcceptHandoverView,
    RejectHandoverView,
    
    # --- ¡VISTAS RECUPERADAS DE TU CÓDIGO OFICIAL! ---
    ToggleUserActiveView,
    ReassignRoleView,
)

urlpatterns = [
    # --- RUTAS DE AUTENTICACIÓN (Actualizadas a 2FA) ---
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/verify-2fa/', Verify2FAView.as_view(), name='token_verify_2fa'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- RUTAS DE CICLO DE VIDA DE USUARIO ---
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # --- RUTAS DE ADMINISTRADOR ---
    path('admin/all-users/', AllUsersListView.as_view(), name='all-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
    path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),
    path('admin/iniciar-relevo/<int:pk>/', IniciarRelevoView.as_view(), name='iniciar-relevo'),
    
    # --- ¡RUTAS RECUPERADAS DE TU CÓDIGO OFICIAL! ---
    path('admin/toggle-active/<int:pk>/', ToggleUserActiveView.as_view(), name='toggle-user-active'),
    path('admin/reassign-role/<int:pk>/', ReassignRoleView.as_view(), name='reassign-role'),
    
    # --- RUTAS DE RELEVO ---
    path('accept-handover/', AcceptHandoverView.as_view(), name='accept-handover'),
    path('reject-handover/', RejectHandoverView.as_view(), name='reject-handover'),
]