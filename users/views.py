# Archivo: users/views.py

from rest_framework import generics, permissions
from .models import CustomUser
from .serializers import UserRegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import AdminUserListSerializer # Importamos el nuevo serializer

# Esta vista permite que cualquier persona (permission_classes) pueda enviar una
# solicitud POST para crear un nuevo usuario.
class UserRegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny] # Cualquiera puede registrarse
    serializer_class = UserRegisterSerializer

# Vista para que el Admin liste los usuarios pendientes
class PendingUsersListView(generics.ListAPIView):
    # Solo los administradores (is_staff=True) pueden acceder a esta vista
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        # Filtramos para devolver solo los usuarios con estado 'PENDIENTE'
        return CustomUser.objects.filter(estado_aprobacion='PENDIENTE')

# Vista para que el Admin apruebe un usuario
class ApproveUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Cambiamos el estado y activamos la cuenta
        user.estado_aprobacion = 'APROBADO'
        user.is_active = True
        user.save()
        
        # AQUÍ IRÁ LA LÓGICA PARA ENVIAR EL EMAIL DE ACTIVACIÓN (siguiente paso incremental)

        return Response({'status': f'Usuario {user.email} aprobado exitosamente'}, status=status.HTTP_200_OK)
