# users/views.py
from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction # <-- ¡IMPORTAMOS LA HERRAMIENTA MÁS PODEROSA!

from .models import CustomUser
from .serializers import (
    AdminUserListSerializer,
    SetNewPasswordSerializer,
    UserApprovalSerializer,
    UserRegisterSerializer,
)
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
    
class ApproveUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        approval_serializer = UserApprovalSerializer(data=request.data)
        if not approval_serializer.is_valid():
            return Response(approval_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        rol_id = approval_serializer.validated_data['rol_id']

        try:
            # Envolvemos toda la operación en un bloque de "todo o nada"
            with transaction.atomic():
                # Buscamos al usuario PENDIENTE dentro de la transacción
                user = CustomUser.objects.select_for_update().get(pk=pk, estado_aprobacion='PENDIENTE')
                rol_a_asignar = Group.objects.get(id=rol_id)

                # Cambiamos el estado del usuario
                user.estado_aprobacion = 'APROBADO'
                user.rol = rol_a_asignar
                user.groups.add(rol_a_asignar)
                
                # Intentamos enviar el correo
                token = PasswordResetTokenGenerator().make_token(user)
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                activation_link = f"http://localhost:5173/activate/{uidb64}/{token}"
                subject = 'Tu cuenta ha sido aprobada - Configura tu contraseña'
                message = f"¡Hola {user.first_name}! Haz clic aquí para activar tu cuenta: {activation_link}"
                
                send_mail(
                    subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False
                )

                # ¡SOLO SI EL CORREO SE ENVÍA CON ÉXITO, guardamos los cambios!
                user.save()

        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o ya fue procesado.'}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({'error': f'El rol con id={rol_id} no existe.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Si CUALQUIER COSA falla (envío de correo, etc.), la transacción se revierte
            # y devolvemos el error real.
            return Response({'error': f'La aprobación falló. Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Si llegamos aquí, todo el bloque de la transacción tuvo éxito.
        return Response({'status': f'Usuario {user.email} aprobado y correo enviado.'}, status=status.HTTP_200_OK)
    
# --- VERSIÓN FINAL Y AUTORITARIA DE LA VISTA ---
# --- LA VERSIÓN FINAL CON EL MARTILLO ---
class SetNewPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SetNewPasswordSerializer
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        try:
            user_id = force_str(urlsafe_base64_decode(data['uidb64']))
            user = CustomUser.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({'error': 'Enlace de activación inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not PasswordResetTokenGenerator().check_token(user, data['token']):
            return Response({'error': 'Token inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(data['password'])
        user.is_active = True
        user.save()
        
        return Response({'status': 'Cuenta activada exitosamente.'}, status=status.HTTP_200_OK)
    
class RejectUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk, estado_aprobacion='PENDIENTE')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o ya fue procesado'}, status=status.HTTP_404_NOT_FOUND)
        
        # Eliminación física, como acordamos
        user.delete()
        
        return Response({'status': 'Usuario rechazado y eliminado exitosamente.'}, status=status.HTTP_200_OK)