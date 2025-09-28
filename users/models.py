from django.db import models
from django.contrib.auth.models import AbstractUser
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
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email