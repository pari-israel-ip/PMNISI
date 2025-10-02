from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
        model = CustomUser
        # Añade aquí los campos que quieres ver en la lista de usuarios del admin
        list_display = ['email', 'username', 'is_active', 'is_staff', 'estado_aprobacion', 'rol']
        # Añade campos al formulario de edición del admin
        fieldsets = UserAdmin.fieldsets + (
            (None, {'fields': ('estado_aprobacion',)}),
        )
        add_fieldsets = UserAdmin.add_fieldsets + (
            (None, {'fields': ('estado_aprobacion',)}),
        )
    
admin.site.register(CustomUser, CustomUserAdmin)