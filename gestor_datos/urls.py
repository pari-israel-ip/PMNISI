# Archivo: gestor_datos/urls.py (LA VERSIÓN FINAL Y COMPLETA)

from django.urls import path
# --- ¡ASEGÚRATE DE IMPORTAR LAS 4 VISTAS! ---
from .views import CargarDatosView, EstadisticasView, CargarDatosRealesView, EstadisticasRealesView
from .views import ExportarPDFView
from .views import PrediccionFuturaView # <-- Importamos la nueva vista
from .views import RetrainSimulationView # <-- Importar

urlpatterns = [
    # Rutas de prueba (las dejamos por si las necesitamos)
    path('upload/', CargarDatosView.as_view(), name='cargar-datos-prueba'),
    path('statistics/', EstadisticasView.as_view(), name='ver-estadisticas-prueba'),
    
    # --- ¡LAS RUTAS REALES QUE FALTABAN! ---
    path('upload-real/', CargarDatosRealesView.as_view(), name='cargar-datos-reales'),
    path('statistics-real/', EstadisticasRealesView.as_view(), name='ver-estadisticas-reales'),
    path('export-pdf/', ExportarPDFView.as_view(), name='exportar-pdf'),
    path('prediccion-futura/', PrediccionFuturaView.as_view(), name='prediccion-futura'),
    path('retrain-simulation/', RetrainSimulationView.as_view(), name='retrain-simulation'),


]