# Archivo: gestor_datos/urls.py (VERSIÓN FINAL Y ESTABLE)

from django.urls import path

# Importamos solo las vistas que SÍ existen en tu views.py actual
from .views import (
    CargarDatosRealesView, 
    EstadisticasRealesView, 
    ExportarPDFView,
    PrediccionFuturaView,
    RetrainSimulationView,
    ExportarExcelView, 
    
    ExportarPrediccionExcelView, ExportarPrediccionPDFView ,# <-- Importar     # <--- ¡IMPORTANTE: AGREGA ESTO!
    # --- NOTA IMPORTANTE ---
    # Si estas vistas (CargarDatosView, EstadisticasView) ya no están en views.py,
    # debemos comentarlas aquí para evitar el error "ImportError".
    # CargarDatosView, 
    # EstadisticasView,
)


urlpatterns = [
    # --- SISTEMA REAL (PRODUCCIÓN - EL DASHBOARD USA ESTO) ---
    path('upload-real/', CargarDatosRealesView.as_view(), name='cargar-datos-reales'),
    
    # ESTA ES LA RUTA QUE USA EL DASHBOARD INTERACTIVO (statistics-real)
    path('statistics-real/', EstadisticasRealesView.as_view(), name='ver-estadisticas-reales'),
    path('export-excel/', ExportarExcelView.as_view(), name='exportar-excel'),
    path('export-pdf/', ExportarPDFView.as_view(), name='exportar-pdf'),
    path('prediccion-futura/', PrediccionFuturaView.as_view(), name='prediccion-futura'),
    path('retrain-simulation/', RetrainSimulationView.as_view(), name='retrain-simulation'),
    path('prediccion-export-excel/', ExportarPrediccionExcelView.as_view(), name='prediccion-excel'),
    path('prediccion-export-pdf/', ExportarPrediccionPDFView.as_view(), name='prediccion-pdf'),
    # --- RUTAS DE PRUEBA (DESACTIVADAS PARA QUE NO FALLE) ---
    # path('upload/', CargarDatosView.as_view(), name='cargar-datos-prueba'),
    # path('statistics/', EstadisticasView.as_view(), name='ver-estadisticas-prueba'),
]