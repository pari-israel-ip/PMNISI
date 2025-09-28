# Archivo: users/serializers.py

from rest_framework import serializers
from .models import CustomUser

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