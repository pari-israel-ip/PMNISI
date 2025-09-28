# Archivo: users/views.py

from rest_framework import generics, permissions
from .models import CustomUser
from .serializers import UserRegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import AdminUserListSerializer # Importamos el nuevo serializer
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings
from .serializers import SetNewPasswordSerializer # Añade este import

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


# class ApproveUserView(APIView):
#     permission_classes = [permissions.IsAdminUser]

#     def post(self, request, pk):
#         try:
#             user = CustomUser.objects.get(pk=pk, estado_aprobacion='PENDIENTE')
#         except CustomUser.DoesNotExist:
#             return Response({'error': 'Usuario no encontrado o ya fue procesado'}, status=status.HTTP_404_NOT_FOUND)

#         # Cambiamos el estado y activamos la cuenta
#         user.estado_aprobacion = 'APROBADO'
#         user.is_active = True
#         user.save()
        
#         # --- LÓGICA PARA ENVIAR EL EMAIL DE ACTIVACIÓN ---
#         # 1. Generar un token seguro y un ID de usuario codificado
#         token_generator = PasswordResetTokenGenerator()
#         token = token_generator.make_token(user)
#         uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

#         # 2. Construir la URL de activación (apuntará a tu frontend en el futuro)
#         activation_link = f"http://localhost:3000/activate/{uidb64}/{token}" # Usamos 3000 para el futuro frontend de React

#         # 3. Preparar y enviar el correo
#         subject = 'Tu cuenta ha sido aprobada - Configura tu contraseña'
#         message = f"""
#         ¡Hola {user.first_name}!

#         Tu cuenta para el sistema ha sido aprobada.
#         Por favor, haz clic en el siguiente enlace para configurar tu contraseña final:
#         {activation_link}

#         Si no solicitaste esta cuenta, por favor ignora este correo.
#         """
#         send_mail(
#             subject,
#             message,
#             settings.DEFAULT_FROM_EMAIL, # Email del remitente
#             [user.email], # Email del destinatario
#             fail_silently=False,
#         )

#         return Response({'status': f'Usuario {user.email} aprobado y correo de activación enviado.'}, status=status.HTTP_200_OK)
    
class ApproveUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk, estado_aprobacion='PENDIENTE')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o ya fue procesado'}, status=status.HTTP_404_NOT_FOUND)

        # --- AQUÍ ESTÁ LA LÓGICA CORRECTA Y COMPLETA ---
        user.estado_aprobacion = 'APROBADO'
        user.is_active = True  # <-- LA LÍNEA CLAVE QUE SOLUCIONA EL "RUIDO"
        user.save()
        
        # ... (el resto del código que genera y envía el email se queda igual) ...
        # 1. Generar un token seguro y un ID de usuario codificado
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        # 2. Construir la URL de activación
        # EN EL FUTURO, CAMBIARÁS 'localhost:3000' POR EL DOMINIO REAL DE TU FRONTEND
        activation_link = f"http://localhost:3000/activate/{uidb64}/{token}"

        # 3. Preparar y enviar el correo
        subject = 'Tu cuenta ha sido aprobada - Configura tu contraseña'
        message = f"¡Hola {user.first_name}! Tu cuenta para el sistema ha sido aprobada..." # (El mensaje completo)
        send_mail(
            subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False,
        )

        return Response({'status': f'Usuario {user.email} aprobado y correo de activación enviado.'}, status=status.HTTP_200_OK)
    
class SetNewPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SetNewPasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'status': 'Contraseña configurada exitosamente. Ahora puedes iniciar sesión.'}, status=status.HTTP_200_OK)