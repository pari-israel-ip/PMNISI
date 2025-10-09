# Archivo: gestor_datos/urls.py
from django.urls import path
from .views import CargarDatosView,EstadisticasView
urlpatterns = [
        path('upload/', CargarDatosView.as_view(), name='cargar-datos'),
        path('statistics/', EstadisticasView.as_view(), name='ver-estadisticas'), # <-- 2. Añadir

]