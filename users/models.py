from django.db import models
from django.contrib.auth.models import AbstractUser,Group
from django.utils.translation import gettext_lazy as _

class EstadoAprobacion(models.TextChoices):
    PENDIENTE = 'PENDIENTE', _('Pendiente')
    APROBADO = 'APROBADO', _('Aprobado')
    RECHAZADO = 'RECHAZADO', _('Rechazado')

class CustomUser(AbstractUser):
    email = models.EmailField(
        _('Dirección de correo electrónico'),
        unique=True
    )

    estado_aprobacion = models.CharField(
        max_length=10,
        choices=EstadoAprobacion.choices,
        default=EstadoAprobacion.PENDIENTE,
        help_text=_('Estado de la solicitud de registro del usuario.')
    )
    
    # --- ¡EL CAMBIO MÁS IMPORTANTE! ---
    # Añadimos una relación directa con el modelo Group de Django.
    rol = models.ForeignKey(
        Group, 
        on_delete=models.SET_NULL, # Si se borra un rol, el usuario no se borra.
        null=True, 
        blank=True,
        verbose_name=_('Rol'),
        help_text=_('El rol principal del usuario en el sistema.')
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email