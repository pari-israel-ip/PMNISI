# Archivo: gestor_datos/models.py (VERSIÓN FINAL)

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

class RegistroDelitoReal(models.Model):
    cod_form_01 = models.CharField(max_length=50, primary_key=True)
    cod_n = models.CharField(max_length=50, null=True, blank=True)
    gestion = models.IntegerField(null=True, blank=True)
    mes_registro = models.CharField(max_length=50, null=True, blank=True)
    fecha_denuncia = models.DateField(null=True, blank=True)
    dias = models.CharField(max_length=50, null=True, blank=True)
    hora = models.TimeField(null=True, blank=True)
    departamento = models.CharField(max_length=100, null=True, blank=True)
    municipios = models.CharField(max_length=100, null=True, blank=True)
    macro_distrito = models.CharField(max_length=100, null=True, blank=True)
    zona_del_hecho = models.CharField(max_length=255, null=True, blank=True)
    avenida_calle = models.CharField(max_length=255, null=True, blank=True)
    naturaleza_delito = models.CharField(max_length=255, null=True, blank=True)
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.cod_form_01} - {self.naturaleza_delito}"