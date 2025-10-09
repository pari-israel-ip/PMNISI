# Archivo: gestor_datos/models.py

from django.db import models

class RegistroDelito(models.Model):
    numero_id = models.CharField(max_length=50, unique=True, primary_key=True)
    codigo_delito = models.IntegerField(null=True, blank=True)
    tipo_delito = models.CharField(max_length=100, null=True, blank=True)
    descripcion_delito = models.CharField(max_length=255, null=True, blank=True)
    distrito = models.CharField(max_length=50, null=True, blank=True)
    fecha = models.DateField(null=True, blank=True)
    hora = models.IntegerField(null=True, blank=True)
    clasificacion = models.CharField(max_length=100, null=True, blank=True)
    calle = models.CharField(max_length=255, null=True, blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.numero_id} - {self.tipo_delito}"