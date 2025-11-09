# Archivo: users/serializers.py

from rest_framework import serializers
from .models import CustomUser
from django.utils.text import slugify
import random
import string
from django.contrib.auth.models import Group
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # El aspirante solo da los datos que conoce: su nombre y su correo.
        fields = ['email', 'first_name', 'last_name']

    def create(self, validated_data):
        # --- LÓGICA FINAL Y PROFESIONAL PARA GENERAR USERNAME ---
        # A partir del nombre y apellido, para que sea limpio.
        
        first_name = validated_data.get('first_name', '').split()[0]  # "Juan Carlos" -> "Juan"
        last_name = validated_data.get('last_name', '').split()[0]    # "García López" -> "García"
        base_username = f"{slugify(first_name[0])}{slugify(last_name)}"  # "Juan García" -> "jgarcia"

        # Bucle para asegurar que el username sea 100% único
        while True:
            unique_id = ''.join(random.choices(string.digits, k=4))
            username = f"{base_username}-{unique_id}"
            if not CustomUser.objects.filter(username=username).exists():
                break
        
        # Creamos el usuario con el username generado automáticamente.
        # El aspirante NUNCA lo ve ni interactúa con él.
        user = CustomUser.objects.create(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            username=username, # Asignamos el username único y limpio
            is_active=False
        )
        return user
# --- 1. CREAMOS UN MINI-SERIALIZER PARA LOS GRUPOS ---
class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']


class AdminUserListSerializer(serializers.ModelSerializer):
    # Le decimos explícitamente que use nuestro nuevo GroupSerializer para el campo 'rol'
    rol = GroupSerializer(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'estado_aprobacion', 'rol', 'is_active', 'date_joined']




class UserApprovalSerializer(serializers.Serializer):
    rol_id = serializers.IntegerField()

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=8, write_only=True, required=True)
    password2 = serializers.CharField(min_length=8, write_only=True, required=True, label="Confirm Password")
    token = serializers.CharField(write_only=True)
    uidb64 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Su única misión es validar que las contraseñas coincidan
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

# --- AÑADE ESTAS DOS CLASES AL FINAL DEL ARCHIVO ---

# --- ¡LA PIEZA QUE FALTABA! ---
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['rol'] = user.rol.name if user.rol else None
        token['is_nominated'] = (user.estado_aprobacion == 'NOMINADO')
        return token