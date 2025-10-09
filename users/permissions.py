# Archivo: users/permissions.py

from rest_framework import permissions

class PuedeCargarDatos(permissions.BasePermission):
    """
    Permiso para usuarios que pueden subir archivos de datos.
    (Subordinados y Secretarias).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        roles_permitidos = ['Subordinado', 'Secretaria', 'Comandante']
        
        # --- EL MICRÓFONO DE DEPURACIÓN ---
        print("---------- CHEQUEO DE PERMISO 'PuedeCargarDatos' ----------")
        print(f"Usuario que intenta acceder: {request.user.email}")
        print(f"Grupos a los que pertenece el usuario (según Django): {list(request.user.groups.all())}")
        print(f"Roles permitidos: {roles_permitidos}")
        # --- FIN DEL MICRÓFONO ---

        permission_granted = request.user.groups.filter(name__in=roles_permitidos).exists()
        
        print(f"¿Permiso concedido?: {permission_granted}")
        print("---------------------------------------------------------")

        return permission_granted