# users/views.py
from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser
from .permissions import IsComandante, PuedeCargarDatos
from .serializers import (
    AdminUserListSerializer, MyTokenObtainPairSerializer, SetNewPasswordSerializer,
    UserApprovalSerializer, UserRegisterSerializer
)
from .serializers import PasswordResetConfirmSerializer # <-- 1. Importar el nuevo serializer
from django.core.cache import cache # ¡La herramienta para guardar códigos temporales!
import random
from rest_framework_simplejwt.tokens import RefreshToken

# Archivo: users/views.py
# ... (imports y otras vistas)
from rest_framework_simplejwt.tokens import AccessToken

# Esta vista permite que cualquier persona (permission_classes) pueda enviar una
# solicitud POST para crear un nuevo usuario.
class IniciarRelevoView(APIView):
    permission_classes = [IsComandante] # <-- CORREGIDO (sin el prefijo)

    def post(self, request, pk):
        try:
            # Buscamos al usuario que será el sucesor
            sucesor = CustomUser.objects.get(pk=pk)
            
            # Verificación de seguridad: solo se puede nominar a un Subordinado activo
            if not sucesor.rol or sucesor.rol.name != 'Subordinado' or not sucesor.is_active:
                return Response({'error': 'Solo se puede nominar a un Subordinado activo.'}, status=status.HTTP_400_BAD_REQUEST)

            # Cambiamos su estado a 'NOMINADO'
            sucesor.estado_aprobacion = 'NOMINADO'
            sucesor.save()

            return Response({'status': f'{sucesor.get_full_name()} ha sido nominado como sucesor.'}, status=status.HTTP_200_OK)
        
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        

class UserRegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny] # Cualquiera puede registrarse
    serializer_class = UserRegisterSerializer

class AllUsersListView(generics.ListAPIView):
    # ¡Usamos el permiso correcto! Solo el Comandante puede ver a todos.
    permission_classes = [IsComandante] # <-- CORREGIDO (sin el prefijo)
    
    # Usamos el serializer que ya teníamos para la lista de admin.
    serializer_class = AdminUserListSerializer
    
    # Devolvemos TODOS los usuarios, ordenados por fecha de registro.
    queryset = CustomUser.objects.all().order_by('-date_joined')
# Vista para que el Admin liste los usuarios pendientes
class PendingUsersListView(generics.ListAPIView):
    # Solo los administradores (is_staff=True) pueden acceder a esta vista
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        # Filtramos para devolver solo los usuarios con estado 'PENDIENTE'
        return CustomUser.objects.filter(estado_aprobacion='PENDIENTE')
    
class ApproveUserView(APIView):
    permission_classes = [IsComandante] # <-- CORREGIDO (sin el prefijo)

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
    
# Archivo: users/views.py (AÑADE ESTO AL FINAL)

# ... (tus otras vistas)

# --- ¡LA VISTA QUE FALTABA! ---
class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Solo usuarios logueados

    def get(self, request):
        # Reutilizamos el serializer que ya tenemos para mostrar los datos
        serializer = AdminUserListSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        data = request.data
        
        # Actualizamos solo nombre y apellido, forzando mayúsculas
        if 'first_name' in data:
            user.first_name = data['first_name'].upper()
        if 'last_name' in data:
            user.last_name = data['last_name'].upper()
            
        user.save()
        
        return Response({'status': 'Perfil actualizado correctamente.'}, status=status.HTTP_200_OK)
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
# --- VISTA PARA ACEPTAR EL RELEVO DE MANDO ---
class AcceptHandoverView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        new_comandante = request.user
        
        if new_comandante.estado_aprobacion != 'NOMINADO':
            return Response({'error': 'No tienes una nominación pendiente.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            with transaction.atomic():
                # Buscamos al Comandante actual. Usamos .get() para asegurar que solo hay uno.
                # Si hay más de uno, esto fallará, lo cual es una buena medida de seguridad.
                current_comandante = CustomUser.objects.select_for_update().get(rol__name='Comandante')
                
                # 1. ¡LA DEGRADACIÓN! Le quitamos el rol y lo desactivamos.
                current_comandante.is_active = False
                current_comandante.rol = None
                current_comandante.groups.clear()
                current_comandante.save()

                # 2. ¡LA PROMOCIÓN! Ascendemos al nuevo Comandante.
                rol_comandante = Group.objects.get(name='Comandante')
                new_comandante.rol = rol_comandante
                new_comandante.groups.clear()
                new_comandante.groups.add(rol_comandante)
                new_comandante.estado_aprobacion = 'APROBADO'
                new_comandante.save()

        except CustomUser.DoesNotExist:
            return Response({'error': 'No se encontró un Comandante activo para realizar el relevo.'}, status=status.HTTP_404_NOT_FOUND)
        except CustomUser.MultipleObjectsReturned:
            return Response({'error': 'Error crítico: Múltiples Comandantes detectados. Contacte al administrador.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': f'Ocurrió un error inesperado: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'status': 'Relevo de mando completado.'}, status=status.HTTP_200_OK)


# --- VISTA PARA RECHAZAR EL RELEVO DE MANDO ---
class RejectHandoverView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.estado_aprobacion != 'NOMINADO':
            return Response({'error': 'No tienes una nominación pendiente.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Simplemente revertimos el estado a APROBADO
        user.estado_aprobacion = 'APROBADO'
        user.save()

        return Response({'status': 'Nominación rechazada.'}, status=status.HTTP_200_OK)
# --- ¡LA VISTA PERSONALIZADA DE LOGIN, AHORA EN SU SITIO! ---
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
class RejectUserView(APIView):
    permission_classes = [IsComandante] # <-- CORREGIDO (sin el prefijo)

    def post(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk, estado_aprobacion='PENDIENTE')
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado o ya fue procesado'}, status=status.HTTP_404_NOT_FOUND)
        
        # Eliminación física, como acordamos
        user.delete()
        
        return Response({'status': 'Usuario rechazado y eliminado exitosamente.'}, status=status.HTTP_200_OK)
    
class ToggleUserActiveView(APIView):
    permission_classes = [IsComandante]

    def post(self, request, pk):
        try:
            user_to_toggle = CustomUser.objects.get(pk=pk)
            
            # Medida de seguridad: un Comandante no puede desactivarse a sí mismo.
            if request.user == user_to_toggle:
                return Response({'error': 'Un Comandante no puede desactivarse a sí mismo.'}, status=status.HTTP_403_FORBIDDEN)

            # El "interruptor": si está activo, lo desactiva, y viceversa.
            user_to_toggle.is_active = not user_to_toggle.is_active
            user_to_toggle.save()
            
            new_status = "activado" if user_to_toggle.is_active else "desactivado"
            return Response({'status': f'Usuario {user_to_toggle.email} ha sido {new_status}.'}, status=status.HTTP_200_OK)
        
        except CustomUser.DoesNotExist:
            return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
class ReassignRoleView(APIView):
    permission_classes = [IsComandante]

    def post(self, request, pk):
        try:
            user_to_reassign = CustomUser.objects.get(pk=pk)
            rol_id = request.data.get('rol_id')
            new_rol = Group.objects.get(id=rol_id)
            
            # Seguridad: No se puede reasignar a Comandante por esta vía
            if new_rol.name == 'Comandante':
                return Response({'error': 'El rol de Comandante solo puede ser asignado mediante el protocolo de relevo.'}, status=status.HTTP_403_FORBIDDEN)

            user_to_reassign.rol = new_rol
            user_to_reassign.groups.set([new_rol]) # .set() reemplaza todos los grupos anteriores
            user_to_reassign.save()
            
            return Response({'status': f'Rol de {user_to_reassign.email} actualizado a {new_rol.name}.'}, status=status.HTTP_200_OK)
        
        except (CustomUser.DoesNotExist, Group.DoesNotExist):
            return Response({'error': 'Usuario o Rol no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(email=email)
            
            # Generamos el enlace (misma lógica que la activación)
            token = PasswordResetTokenGenerator().make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            reset_link = f"http://localhost:5173/reset-password/{uidb64}/{token}"

            # Enviamos el correo
            subject = 'Solicitud de Reseteo de Contraseña'
            message = f"Hola {user.first_name}, haz clic en el siguiente enlace para resetear tu contraseña: {reset_link}"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        except CustomUser.DoesNotExist:
            # ¡IMPORTANTE! No revelamos si el correo existe o no por seguridad.
            # Siempre devolvemos un mensaje de éxito genérico.
            pass

        return Response(
            {'status': 'Si existe una cuenta con ese correo, se ha enviado un enlace de reseteo.'},
            status=status.HTTP_200_OK
        )

# --- VISTA PARA CONFIRMAR Y ESTABLECER LA NUEVA CONTRASEÑA ---
# Archivo: users/views.py (AÑADIR AL FINAL)

# --- VISTA 1: SOLICITAR RESETEO (Envía el correo) ---
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny] # Cualquiera puede pedirlo

    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(email=email)
            
            # Generamos el token y el link (igual que en la activación)
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Este link apunta a la página de React que acabamos de crear
            reset_link = f"http://localhost:5173/reset-password/{uidb64}/{token}"
            
            subject = 'Recuperación de Contraseña - Sistema Policial'
            message = f"Hola {user.first_name},\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:\n{reset_link}\n\nSi no fuiste tú, ignora este correo."
            
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
            
        except CustomUser.DoesNotExist:
            # Por seguridad, NO decimos si el correo existe o no.
            pass 
            
        return Response({'status': 'Si el correo existe, se ha enviado un enlace.'}, status=status.HTTP_200_OK)


# --- VISTA 2: CONFIRMAR RESETEO (Cambia la contraseña) ---
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        password = request.data.get('password')
        password2 = request.data.get('password2')

        if password != password2:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=user_id)

            token_generator = PasswordResetTokenGenerator()
            if not token_generator.check_token(user, token):
                return Response({'error': 'El enlace es inválido o ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

            # --- ¡AQUÍ ESTÁ LA REGLA DE NO REPETIR! ---
            if user.check_password(password):
                return Response({'error': 'No puedes usar la misma contraseña anterior. Por favor, elige una nueva.'}, status=status.HTTP_400_BAD_REQUEST)
            # -------------------------------------------

            user.set_password(password)
            user.save()

            return Response({'status': 'Contraseña restablecida con éxito.'}, status=status.HTTP_200_OK)

        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({'error': 'Enlace inválido.'}, status=status.HTTP_400_BAD_REQUEST)
# --- ¡LA NUEVA VISTA DE LOGIN, PARTE 1! ---

class CustomTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = CustomUser.objects.get(email=email)
            if not user.check_password(password) or not user.is_active:
                raise CustomUser.DoesNotExist
        except CustomUser.DoesNotExist:
            return Response({'error': 'Credenciales inválidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        # 1. Generar y guardar el código 2FA
        two_factor_code = f"{random.randint(10000, 99999)}"
        # Guardamos el código en la caché de Django por 5 minutos
        cache.set(f'2fa_code_{user.id}', two_factor_code, timeout=300)

        # 2. Enviar el correo con el código
        subject = 'Tu Código de Verificación'
        message = f"Tu código de autenticación de dos factores es: {two_factor_code}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        # 3. Generar un token temporal que solo sirve para el siguiente paso
        refresh = RefreshToken.for_user(user)
        # Le añadimos una marca especial y una vida corta
        refresh['is_pre_auth_token'] = True
        refresh.set_exp(lifetime=timedelta(minutes=5))
        
        return Response({
            'status': '2FA_required',
            'temp_token': str(refresh.access_token)
        }, status=status.HTTP_200_OK)
    
# --- ¡LA NUEVA VISTA DE LOGIN, PARTE 2! ---
class Verify2FAView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        temp_token = request.data.get('temp_token')
        code = request.data.get('code')

        try:
            # Validamos el token temporal
            decoded_token = AccessToken(temp_token)
            if not decoded_token.get('is_pre_auth_token'):
                raise Exception() # No es un token de pre-autenticación
            
            user_id = decoded_token['user_id']
            user = CustomUser.objects.get(id=user_id)

            # Validamos el código
            cached_code = cache.get(f'2fa_code_{user.id}')
            if not cached_code or cached_code != code:
                return Response({'error': 'Código inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # ¡Éxito! Generamos los tokens finales
            refresh = RefreshToken.for_user(user)
            # (Opcional) Podemos añadir los datos extra que ya teníamos
            refresh['rol'] = user.rol.name if user.rol else None
            refresh['is_nominated'] = (user.estado_aprobacion == 'NOMINADO')

            # Limpiamos el código usado
            cache.delete(f'2fa_code_{user.id}')

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception:
            return Response({'error': 'Token temporal inválido o expirado.'}, status=status.HTTP_401_UNAUTHORIZED)