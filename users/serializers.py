# Archivo: users/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que el usuario enviará al registrarse
        fields = ['email', 'username', 'first_name', 'last_name', 'password']
        # Aseguramos que la contraseña no sea legible en las respuestas de la API
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Usamos el método create_user para hashear la contraseña correctamente
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            # Forzamos que el usuario se cree inactivo por defecto,
            # aunque el modelo ya lo haría, esto es una doble seguridad.
            is_active=False 
        )
        return user
    # ... (la clase UserRegisterSerializer ya está aquí arriba) ...

class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Campos que el admin verá en la lista de pendientes
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'estado_aprobacion', 'date_joined']

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, write_only=True)
    token = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            password = attrs.get('password')
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')

            user_id = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(id=user_id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise serializers.ValidationError('El token de activación no es válido o ha expirado.', code='authorization')
            
            user.set_password(password)
            user.save()

            return user
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist) as e:
            raise serializers.ValidationError('El enlace de activación no es válido.', code='authorization')