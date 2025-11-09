# Archivo: users/permissions.py (VERSIÓN FINAL Y SIN IMPORTACIONES CIRCULARES)

from rest_framework import permissions

class IsComandante(permissions.BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios
    que pertenezcan al grupo 'Comandante'.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 'request.user.groups' es una forma de ver todos los grupos de un usuario.
        return request.user.groups.filter(name='Comandante').exists()


class PuedeCargarDatos(permissions.BasePermission):
    """
    Permiso para usuarios que pueden subir archivos de datos.
    (Subordinados y Secretarias).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Comprueba si el usuario pertenece a CUALQUIERA de estos grupos
        roles_permitidos = ['Subordinado', 'Secretaria', 'Comandante']
        return request.user.groups.filter(name__in=roles_permitidos).exists()