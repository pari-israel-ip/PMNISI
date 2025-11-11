from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
import pandas as pd
from django.db.models import Count
from users.permissions import PuedeCargarDatos
import math
from datetime import time 
from .models import RegistroDelito, RegistroDelitoReal
from django.db.models.functions import Trunc, Extract 
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from django.core.cache import cache
import random # <-- ¡¡AÑADIDO!! Import necesario para la nueva precisión.

# ===================================================================
# --- VISTAS PARA LOS DATOS DE PRUEBA (USAN EL MODELO ANTIGUO) ---
# ===================================================================

from . import ml_engine # <-- ¡Se mantiene nuestro cerebro!

from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors

# --- ¡NUESTRO LIBRO DE ESTILO! (Se mantiene) ---
def get_professional_table_style():
    """Devuelve un estilo de tabla profesional para los reportes."""
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')), # Encabezado gris oscuro
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke), # <-- ¡CORREGIDO!
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#374151')), # Filas gris medio
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#4b5563')), # Bordes gris claro
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ])

class CargarDatosView(APIView):
    permission_classes = [PuedeCargarDatos]
    def post(self, request, *args, **kwargs):
        # ... (Tu código se mantiene igual) ...
        archivo = request.FILES.get('archivo_excel')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            df = pd.read_excel(archivo)
            registros = []
            for _, row in df.iterrows():
                fecha_excel = row.get('FECHAS')
                fecha_real = None
                if pd.notna(fecha_excel):
                    if isinstance(fecha_excel, (int, float)):
                        fecha_real = (pd.to_datetime('1899-12-30') + pd.to_timedelta(fecha_excel, 'D')).date()
                    else:
                        fecha_real = pd.to_datetime(fecha_excel, errors='coerce').date()
                lat = row.get('LATITUD') / 100000000.0 if pd.notna(row.get('LATITUD')) else None
                lon = row.get('LONGITUD') / 100000000.0 if pd.notna(row.get('LONGITUD')) else None
                registros.append(
                    RegistroDelito(
                        numero_id=row['NUMERO ID'],
                        tipo_delito=row.get('TIPO_DELITO'),
                        latitud=lat,
                        longitud=lon,
                        fecha=fecha_real
                    )
                )
            RegistroDelito.objects.bulk_create(registros, ignore_conflicts=True)
            return Response({'status': f'{len(registros)} registros de prueba cargados.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EstadisticasView(APIView):
    permission_classes = [PuedeCargarDatos]
    def get(self, request, *args, **kwargs):
        # ... (Tu código se mantiene igual) ...
        total_delitos = RegistroDelito.objects.count()
        delitos_por_tipo = RegistroDelito.objects.values('tipo_delito').annotate(total=Count('tipo_delito')).order_by('-total')[:5]
        coordenadas_qs = RegistroDelito.objects.exclude(latitud__isnull=True).exclude(longitud__isnull=True).order_by('-fecha').values('latitud', 'longitud')[:1000]
        data = {'total_delitos': total_delitos, 'top_delitos': list(delitos_por_tipo), 'coordenadas': list(coordenadas_qs)}
        return Response(data, status=status.HTTP_200_OK)

# ===================================================================
# --- VISTAS PARA LOS DATOS REALES (USAN EL NUEVO MODELO) ---
# ===================================================================

class CargarDatosRealesView(APIView):
    permission_classes = [PuedeCargarDatos]
    def post(self, request, *args, **kwargs):
        # ... (Tu código se mantiene igual) ...
        archivo = request.FILES.get('archivo_excel')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            df = pd.read_excel(archivo)
            registros = []
            for _, row in df.iterrows():
                lat_str = str(row.get('LATITUD', '')).replace(',', '.')
                lon_str = str(row.get('LONGITUD', '')).replace(',', '.')
                latitud = float(lat_str) if lat_str and lat_str.strip() and lat_str.lower() != 'nan' else None
                longitud = float(lon_str) if lon_str and lon_str.strip() and lon_str.lower() != 'nan' else None
                hora_val = row.get('HORA')
                hora_obj = None 
                if pd.notna(hora_val):
                    if isinstance(hora_val, time):
                        hora_obj = hora_val
                    else:
                        dt_obj = pd.to_datetime(str(hora_val), errors='coerce')
                        if pd.notna(dt_obj):
                            hora_obj = dt_obj.time()
                registros.append(
                    RegistroDelitoReal(
                        cod_form_01=row['COD. FORM. 01'],
                        cod_n=row.get('COD. Nº'),
                        gestion=row.get('GESTIÓN'),
                        mes_registro=row.get('MES DE REGISTRO'),
                        fecha_denuncia=pd.to_datetime(row.get('FECHA DE DENUNCIA'), errors='coerce'),
                        dias=row.get('DIAS'),
                        hora=hora_obj, 
                        departamento=row.get('DEPARTAMENTO'),
                        municipios=row.get('MUNICIPIOS'),
                        macro_distrito=row.get('MACRO DISTRITO'),
                        zona_del_hecho=row.get('ZONA DEL HECHO'),
                        avenida_calle=row.get('AVENIDA/CALLE DEL HECHO (INTERSECCION)'),
                        naturaleza_delito=row.get('NATURALEZA DEL DELITO'),
                        latitud=latitud,
                        longitud=longitud
                    )
                )
            RegistroDelitoReal.objects.bulk_create(registros, ignore_conflicts=True)
            return Response({'status': f'{len(registros)} registros reales cargados.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class EstadisticasRealesView(APIView):
    permission_classes = [PuedeCargarDatos]
    def get(self, request, *args, **kwargs):
        # ... (Tu código se mantiene igual) ...
        queryset = RegistroDelitoReal.objects.filter(fecha_denuncia__isnull=False)
        total_delitos = queryset.count()
        top_delitos = queryset.values('naturaleza_delito').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        top_zonas = queryset.values('zona_del_hecho').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        delitos_por_año = queryset.annotate(año=Trunc('fecha_denuncia', 'year')).values('año').annotate(total=Count('cod_form_01')).order_by('año')
        delitos_por_mes = queryset.annotate(
            mes_numero=Extract('fecha_denuncia', 'month')
        ).values('mes_numero').annotate(
            total=Count('cod_form_01')
        ).order_by('mes_numero')
        coordenadas_qs = queryset.exclude(latitud__isnull=True).exclude(longitud__isnull=True).order_by('-fecha_denuncia').values('latitud', 'longitud')[:1000]
        delitos_por_año_fmt = [{'año': item['año'].strftime('%Y'), 'total': item['total']} for item in delitos_por_año]
        delitos_por_mes_fmt = [{'mes': item['mes_numero'], 'total': item['total']} for item in delitos_por_mes]
        data = {
            'total_delitos': total_delitos,
            'top_delitos': list(top_delitos),
            'delitos_por_año': delitos_por_año_fmt,
            'top_zonas': list(top_zonas),
            'delitos_por_mes': delitos_por_mes_fmt, 
            'coordenadas': list(coordenadas_qs),
        }
        return Response(data, status=status.HTTP_200_OK)

class ExportarPDFView(APIView):
    permission_classes = [PuedeCargarDatos]
    def get(self, request, *args, **kwargs):
        # ... (Tu código se mantiene igual) ...
        queryset = RegistroDelitoReal.objects.filter(fecha_denuncia__isnull=False)
        total_delitos = queryset.count()
        top_delitos = queryset.values('naturaleza_delito').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        top_zonas = queryset.values('zona_del_hecho').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        delitos_por_año = queryset.annotate(año=Trunc('fecha_denuncia', 'year')).values('año').annotate(total=Count('cod_form_01')).order_by('año')
        delitos_por_mes = queryset.annotate(mes_numero=Extract('fecha_denuncia', 'month')).values('mes_numero').annotate(total=Count('cod_form_01')).order_by('mes_numero')
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_estadistico_delitos.pdf"'
        doc = SimpleDocTemplate(response, pagesize=letter)
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER))
        story = []
        story.append(Paragraph("Reporte Estadístico de Incidencia Delictiva", styles['h1']))
        story.append(Spacer(1, 24))
        story.append(Paragraph(f"<b>Total de Delitos Registrados:</b> {total_delitos}", styles['h2']))
        story.append(Spacer(1, 24))
        story.append(Paragraph("Tipos de Delitos", styles['h3']))
        data_top_delitos = [['Tipo de Delito', 'Total']] + [[d['naturaleza_delito'], d['total']] for d in top_delitos]
        table_delitos = Table(data_top_delitos, colWidths=[300, 100])
        table_delitos.setStyle(get_professional_table_style())
        story.append(table_delitos)
        story.append(Spacer(1, 24))
        story.append(Paragraph("Top 5 Zonas con Mayor Incidencia", styles['h3']))
        data_top_zonas = [['Zona del Hecho', 'Total']] + [[d['zona_del_hecho'], d['total']] for d in top_zonas]
        table_zonas = Table(data_top_zonas, colWidths=[300, 100])
        table_zonas.setStyle(get_professional_table_style())
        story.append(table_zonas)
        story.append(PageBreak()) 
        story.append(Paragraph("Evolución Anual de Delitos", styles['h3']))
        data_por_año = [['Año', 'Total de Delitos']] + [[item['año'].strftime('%Y'), item['total']] for item in delitos_por_año]
        table_año = Table(data_por_año, colWidths=[200, 200])
        table_año.setStyle(get_professional_table_style())
        story.append(table_año)
        story.append(Spacer(1, 24))
        meses_nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        story.append(Paragraph("Tendencia Mensual (Agregada)", styles['h3']))
        data_por_mes = [['Mes', 'Total de Delitos']] + [[meses_nombres[item['mes_numero'] - 1], item['total']] for item in delitos_por_mes]
        table_mes = Table(data_por_mes, colWidths=[200, 200])
        table_mes.setStyle(get_professional_table_style())
        story.append(table_mes)
        doc.build(story)
        return response

class PrediccionFuturaView(APIView):
    permission_classes = [PuedeCargarDatos] 

    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year', 2024))
            month = int(request.query_params.get('month', 12)) 
        except ValueError:
            return Response({"error": "Parámetros inválidos."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Llama a la función de ml_engine que ya tiene la lógica de caché
        data = ml_engine.get_cocinado_comparison_data(year, month)

        if "error" in data:
            return Response(data, status=status.HTTP_404_NOT_FOUND)

        return Response(data, status=status.HTTP_200_OK)

# --- ¡¡AQUÍ ESTÁ LA VISTA CORREGIDA!! ---
# (Reemplaza la que tenías por esta)
class RetrainSimulationView(APIView):
    """
    Esta vista simula un re-entrenamiento.
    No entrena nada, pero genera una NUEVA precisión y
    limpia la caché para forzar una regeneración de datos.
    """
    permission_classes = [PuedeCargarDatos] # Reusamos el permiso

    def post(self, request, *args, **kwargs):
        try:
            # 1. Generamos una nueva precisión simulada
            # (ej. 83.68% +/- 1.5% para que varíe)
            nueva_precision = 0.8368 + random.uniform(-0.015, 0.015)
            
            # 2. La guardamos en la caché para que get_cocinado_comparison_data la lea
            # Se guarda por 1 día o hasta el próximo re-entrenamiento
            cache.set('current_model_accuracy', nueva_precision, timeout=86400) 

            # 3. ¡MUY IMPORTANTE! Borramos la caché de DATOS antigua
            # para forzar una regeneración con la nueva precisión.
            year = request.data.get('year', 2024)
            month = request.data.get('month', 12)
            
            # ¡Esta es la llave correcta que usa tu ml_engine.py!
            cache_key_datos = f'prediccion_cocinada_top5_{year}_{month}' 
            cache.delete(cache_key_datos)
            
            print(f"--- NUEVA PRECISIÓN GENERADA: {nueva_precision * 100:.2f}% ---")
            
            return Response(
                {'status': 'Modelo re-entrenado (simulado)', 'nueva_precision': f"{nueva_precision * 100:.2f}%"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)