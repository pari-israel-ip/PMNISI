from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AcceptHandoverView, RejectHandoverView # <-- 1. Importar
from .views import ToggleUserActiveView # <-- Importar
from .views import ReassignRoleView

from .views import (
    AllUsersListView, ApproveUserView, IniciarRelevoView,
    MyTokenObtainPairView, RejectUserView, SetNewPasswordView,
    UserRegisterView
)

urlpatterns = [
    # Rutas de autenticación
    path('auth/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Rutas de ciclo de vida del usuario
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('password-set-complete/', SetNewPasswordView.as_view(), name='password-set-complete'),

    # Rutas de administrador
    path('admin/all-users/', AllUsersListView.as_view(), name='all-users-list'),
    path('admin/approve-user/<int:pk>/', ApproveUserView.as_view(), name='approve-user'),
    path('admin/reject-user/<int:pk>/', RejectUserView.as_view(), name='reject-user'),
    path('admin/iniciar-relevo/<int:pk>/', IniciarRelevoView.as_view(), name='iniciar-relevo'),
    path('accept-handover/', AcceptHandoverView.as_view(), name='accept-handover'),
    path('reject-handover/', RejectHandoverView.as_view(), name='reject-handover'),
    path('admin/toggle-active/<int:pk>/', ToggleUserActiveView.as_view(), name='toggle-user-active'),
    path('admin/reassign-role/<int:pk>/', ReassignRoleView.as_view(), name='reassign-role'),

]