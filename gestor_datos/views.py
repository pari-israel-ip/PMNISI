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
import pandas as pd
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from . import ml_engine
from users.permissions import PuedeCargarDatos
# AÑADE ESTOS IMPORTS AL INICIO DE gestor_datos/views.py
from PIL import Image as PILImage # Necesario para leer el tamaño real de la imagen
import base64
from io import BytesIO
from openpyxl.drawing.image import Image as XLImage # Renombramos para evitar conflictos
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from PIL import Image as PILImage # Importamos PIL explícitamente para verificar
from reportlab.platypus import Image as ReportLabImage
from reportlab.lib.pagesizes import landscape, letter
import base64
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as ReportLabImage
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import HttpResponse
import pandas as pd
from django.db.models import Count
from django.db.models.functions import Trunc, Extract
from users.permissions import PuedeCargarDatos
from .models import RegistroDelito, RegistroDelitoReal
import pandas as pd
import base64
from io import BytesIO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from openpyxl.drawing.image import Image as XLImage # Renombramos para no confundir
from users.permissions import PuedeCargarDatos
from .models import RegistroDelitoReal
# --- IMPORTS PARA PDF E IMÁGENES ---
import base64
from io import BytesIO
from PIL import Image as PILImage # <--- IMPORTANTE: Usamos Pillow para medir
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as ReportLabImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime, time # Asegúrate de importar datetime
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from . import ml_engine
# ===================================================================
# --- VISTAS PARA LOS DATOS DE PRUEBA (USAN EL MODELO ANTIGUO) ---
# ===================================================================

from . import ml_engine # <-- ¡Se mantiene nuestro cerebro!

from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from io import BytesIO
import base64
from reportlab.platypus import Image as ReportLabImage # Importante para las fotos
from reportlab.lib.pagesizes import letter, landscape
# --- ¡NUESTRO LIBRO DE ESTILO! 

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

class EstadisticasRealesView(APIView):
    permission_classes = [PuedeCargarDatos]
    
    def get(self, request, *args, **kwargs):
        # 1. Base: Todos los delitos con fecha válida
        queryset = RegistroDelitoReal.objects.filter(fecha_denuncia__isnull=False)

        # --- FILTROS INTERACTIVOS (ZONA Y DELITO) ---
        # Usamos __iexact para evitar problemas de mayúsculas/minúsculas
        zona_filtro = request.query_params.get('zona')
        delito_filtro = request.query_params.get('delito')

        # Validamos que no sea 'null', 'undefined' o vacío
        if zona_filtro and zona_filtro not in ['null', 'undefined', '']:
            queryset = queryset.filter(zona_del_hecho__iexact=zona_filtro)

        if delito_filtro and delito_filtro not in ['null', 'undefined', '']:
            queryset = queryset.filter(naturaleza_delito__iexact=delito_filtro)
        # --------------------------------------------

        # 2. Cálculos (Se ejecutan sobre el queryset ya filtrado)
        total_delitos = queryset.count()
        
        top_delitos = queryset.values('naturaleza_delito').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        
        # Nota: Si filtras por zona, top_zonas mostrará solo esa zona (es lo correcto)
        top_zonas = queryset.values('zona_del_hecho').annotate(total=Count('cod_form_01')).order_by('-total')[:5]
        
        delitos_por_año = queryset.annotate(año=Trunc('fecha_denuncia', 'year')).values('año').annotate(total=Count('cod_form_01')).order_by('año')
        
        delitos_por_mes = queryset.annotate(
            mes_numero=Extract('fecha_denuncia', 'month')
        ).values('mes_numero').annotate(
            total=Count('cod_form_01')
        ).order_by('mes_numero')
        
        # El mapa se actualiza automáticamente con el filtro
        coordenadas_qs = queryset.exclude(latitud__isnull=True).exclude(longitud__isnull=True).order_by('-fecha_denuncia').values('latitud', 'longitud')[:1000]
        
        # Formateo de fechas para el frontend
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
# ===================================================================
# --- VISTAS PARA LOS DATOS REALES (USAN EL NUEVO MODELO) ---
# ===================================================================

# Archivo: gestor_datos/views.py

# Archivo: gestor_datos/views.py
# --- VISTA 1: EXPORTAR PREDICCIÓN A EXCEL ---
class ExportarPrediccionExcelView(APIView):
    permission_classes = [PuedeCargarDatos]

    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year', 2024))
            month = int(request.query_params.get('month', 12))
        except ValueError:
            return Response({"error": "Parámetros inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Obtenemos los datos cocinados
        data = ml_engine.get_comparison_data(year, month)
        if "error" in data:
            return Response(data, status=status.HTTP_404_NOT_FOUND)

        # 2. Preparamos el Excel
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        filename = f"Prediccion_Delictiva_{month}_{year}.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            # HOJA 1: RESUMEN GENERAL
            resumen_data = {
                'Métrica': ['Total Delitos', 'Precisión Estimada'],
                'Realidad': [data['reales']['total_delitos'], '-'],
                'Predicción ML': [data['predichos_ml']['total_delitos'], data['metadata']['precision_simulada']],
                'Variación': [data['predichos_ml']['total_delitos'] - data['reales']['total_delitos'], '-']
            }
            pd.DataFrame(resumen_data).to_excel(writer, sheet_name='Resumen Ejecutivo', index=False)

            # HOJA 2: COMPARATIVA POR TIPO
            tipos_data = []
            all_tipos = set(list(data['reales']['por_tipo'].keys()) + list(data['predichos_ml']['por_tipo'].keys()))
            for tipo in all_tipos:
                real = data['reales']['por_tipo'].get(tipo, 0)
                pred = data['predichos_ml']['por_tipo'].get(tipo, 0)
                tipos_data.append({'Tipo de Delito': tipo, 'Real': real, 'Pronóstico': pred, 'Diferencia': pred - real})
            pd.DataFrame(tipos_data).to_excel(writer, sheet_name='Por Tipología', index=False)

            # HOJA 3: COMPARATIVA POR ZONA
            zonas_data = []
            all_zonas = set(list(data['reales']['por_zona'].keys()) + list(data['predichos_ml']['por_zona'].keys()))
            for zona in all_zonas:
                real = data['reales']['por_zona'].get(zona, 0)
                pred = data['predichos_ml']['por_zona'].get(zona, 0)
                zonas_data.append({'Zona': zona, 'Real': real, 'Pronóstico': pred, 'Diferencia': pred - real})
            pd.DataFrame(zonas_data).to_excel(writer, sheet_name='Por Zonas', index=False)

        return response

# --- VISTA 2: EXPORTAR PREDICCIÓN A PDF ---
# --- 2. REEMPLAZA ESTA CLASE COMPLETA ---
class ExportarPrediccionPDFView(APIView):
    permission_classes = [PuedeCargarDatos]

    # ¡CAMBIO IMPORTANTE: AHORA ES 'def post', NO 'def get'!
    def post(self, request, *args, **kwargs):
        try:
            # Los parámetros siguen viniendo en la URL (?year=2024...)
            year = int(request.query_params.get('year', 2024))
            month = int(request.query_params.get('month', 12))
            
            # La imagen viene en el cuerpo del POST
            image_data = request.data.get('image') 
        except ValueError:
            return Response({"error": "Datos inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        # Obtenemos los datos
        data = ml_engine.get_comparison_data(year, month)
        if "error" in data:
            return Response(data, status=status.HTTP_404_NOT_FOUND)

        # Preparamos el PDF
        response = HttpResponse(content_type='application/pdf')
        filename = f"Informe_Inteligencia_{month}_{year}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        doc = SimpleDocTemplate(response, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Título
        story.append(Paragraph(f"Informe de Inteligencia Predictiva - {month}/{year}", styles['h1']))
        story.append(Paragraph(f"Precisión del Modelo: {data['metadata']['precision_simulada']}", styles['h3']))
        story.append(Spacer(1, 12))

        # --- INSERTAR LA IMAGEN DEL DASHBOARD ---
        if image_data:
            try:
                # Limpiamos la cabecera "data:image/png;base64," si existe
                if "base64," in image_data:
                    image_data = image_data.split("base64,")[1]
                
                decoded_img = base64.b64decode(image_data)
                img_buffer = BytesIO(decoded_img)
                
                # Ajustamos el tamaño (500px de ancho, alto proporcional)
                img = ReportLabImage(img_buffer, width=480, height=270) 
                story.append(img)
                story.append(Spacer(1, 24))
            except Exception as e:
                print(f"Error procesando imagen: {e}")
                story.append(Paragraph("(Error al procesar la imagen del gráfico)", styles['Normal']))

        # --- TABLAS DE DATOS ---
        estilo_tabla = get_professional_table_style() # Tu función de estilo

        # Tabla Resumen
        story.append(Paragraph("1. Resumen Ejecutivo", styles['h3']))
        data_resumen = [
            ['Indicador', 'Realidad', 'Pronóstico', 'Desviación'],
            ['Total Delitos', data['reales']['total_delitos'], data['predichos_ml']['total_delitos'], 
             data['predichos_ml']['total_delitos'] - data['reales']['total_delitos']]
        ]
        t_resumen = Table(data_resumen, colWidths=[180, 100, 100, 80])
        t_resumen.setStyle(estilo_tabla)
        story.append(t_resumen)
        story.append(Spacer(1, 24))

        # Tabla Tipos
        story.append(Paragraph("2. Detalle por Tipología", styles['h3']))
        data_tipos = [['Tipo de Delito', 'Real', 'Pronóstico', 'Dif']]
        all_tipos = list(data['reales']['por_tipo'].keys())
        for tipo in all_tipos:
            real = data['reales']['por_tipo'].get(tipo, 0)
            pred = data['predichos_ml']['por_tipo'].get(tipo, 0)
            data_tipos.append([tipo, real, pred, pred - real])
        
        t_tipos = Table(data_tipos, colWidths=[220, 80, 80, 60])
        t_tipos.setStyle(estilo_tabla)
        story.append(t_tipos)

        doc.build(story)
        return response
    
class CargarDatosRealesView(APIView):
    permission_classes = [PuedeCargarDatos]

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo_excel')
        if not archivo:
            return Response({'error': 'No se proporcionó archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(archivo)
            
            # --- 1. DETECTIVE DE COLUMNAS (Para encontrar el ID) ---
            # Buscamos cualquier columna que contenga "COD" y "FORM"
            # Esto permite que tu Excel diga "COD. FORM. 01" o "COD. FORM. 02" y funcione igual.
            col_clave = None
            for col in df.columns:
                if "COD" in col.upper() and "FORM" in col.upper():
                    col_clave = col
                    break
            
            if not col_clave:
                return Response({'error': 'No se encontró la columna de ID (Ej: COD. FORM. 01 o 02).'}, status=status.HTTP_400_BAD_REQUEST)

            print(f"--- Columna ID detectada: {col_clave} ---")

            # --- 2. OBTENER IDs EXISTENTES ---
            # Sacamos una lista de lo que ya tenemos para NO repetirlo
            ids_existentes = set(RegistroDelitoReal.objects.values_list('cod_form_01', flat=True))
            
            registros_nuevos = []
            nuevos_contados = 0
            ya_existentes = 0

            for _, row in df.iterrows():
                # Obtenemos el ID del Excel y lo limpiamos
                cod = str(row[col_clave]).strip()

                # --- REGLA DE ORO: SI YA EXISTE, SE IGNORA ---
                if cod in ids_existentes:
                    ya_existentes += 1
                    continue # Saltamos al siguiente

                # --- SI ES NUEVO, PREPARAMOS LOS DATOS ---
                
                # Limpieza de coordenadas (coma por punto)
                lat_str = str(row.get('LATITUD', '')).replace(',', '.')
                lon_str = str(row.get('LONGITUD', '')).replace(',', '.')
                latitud = float(lat_str) if lat_str and lat_str.lower() != 'nan' else None
                longitud = float(lon_str) if lon_str and lon_str.lower() != 'nan' else None
                
                # Limpieza de Hora
                hora_val = row.get('HORA')
                hora_obj = None 
                if pd.notna(hora_val):
                    if isinstance(hora_val, time): hora_obj = hora_val
                    else: 
                        try: hora_obj = pd.to_datetime(str(hora_val), format='%H:%M:%S', errors='coerce').time()
                        except: pass

                # Limpieza de Fecha
                fecha_val = row.get('FECHA DE DENUNCIA')
                fecha_denuncia = pd.to_datetime(fecha_val, dayfirst=True, errors='coerce') if pd.notna(fecha_val) else None

                registros_nuevos.append(
                    RegistroDelitoReal(
                        cod_form_01=cod, # Usamos el ID nuevo
                        cod_n=str(row.get('COD. Nº', '')),
                        gestion=row.get('GESTIÓN'),
                        mes_registro=row.get('MES DE REGISTRO'),
                        fecha_denuncia=fecha_denuncia,
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
                nuevos_contados += 1

            # --- 3. GUARDADO MASIVO (Solo de los nuevos) ---
            if registros_nuevos:
                RegistroDelitoReal.objects.bulk_create(registros_nuevos, ignore_conflicts=True)

            # --- 4. RESPUESTA AL USUARIO ---
            if nuevos_contados == 0:
                return Response(
                    {'status': f'No se cargó nada. {ya_existentes} registros ya existían en el sistema.'}, 
                    status=status.HTTP_200_OK
                )

            return Response(
                {'status': f'Carga exitosa: {nuevos_contados} Nuevos cargados. ({ya_existentes} omitidos por existir).'}, 
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            print("Error carga:", e)
            return Response({'error': f"Error procesando datos: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class EstadisticasRealesView(APIView):
    permission_classes = [PuedeCargarDatos]
    
    def get(self, request, *args, **kwargs):
        # 1. Base Global: Todos los registros válidos
        base_queryset = RegistroDelitoReal.objects.filter(fecha_denuncia__isnull=False)

        # --- OBTENCIÓN DE PARÁMETROS ---
        zona_filtro = request.query_params.get('zona')
        delito_filtro = request.query_params.get('delito')

        # Limpieza para asegurar que no sean 'null', 'undefined' o vacíos
        if zona_filtro in ['null', 'undefined', '']: zona_filtro = None
        if delito_filtro in ['null', 'undefined', '']: delito_filtro = None

        # -------------------------------------------------------------------------
        # 2. DEFINICIÓN DE QUERYSETS ESPECIALIZADOS
        # -------------------------------------------------------------------------

        # A. Queryset "TOTALMENTE FILTRADO" (Para KPIs, Mapas y Líneas de Tiempo)
        # Este obedece a TODO: Si filtras algo, el total y el mapa deben reducirse.
        filtered_queryset = base_queryset
        if zona_filtro:
            filtered_queryset = filtered_queryset.filter(zona_del_hecho__iexact=zona_filtro)
        if delito_filtro:
            filtered_queryset = filtered_queryset.filter(naturaleza_delito__iexact=delito_filtro)

        # B. Queryset para el GRÁFICO DE DELITOS (Ignora el filtro de Delito)
        # Si selecciono "Robo", quiero ver la barra de "Robo" brillante, 
        # pero quiero que "Hurto" siga existiendo (en gris) para comparar.
        qs_para_chart_delitos = base_queryset
        if zona_filtro:
            # Si cambio de zona, los delitos SÍ deben cambiar a los de esa zona
            qs_para_chart_delitos = qs_para_chart_delitos.filter(zona_del_hecho__iexact=zona_filtro)
        # IMPORTANTE: Aquí NO aplicamos el filtro de delito.

        # C. Queryset para el GRÁFICO DE ZONAS (Ignora el filtro de Zona)
        # Si selecciono una zona, quiero ver esa zona brillante,
        # pero quiero ver el resto de la torta para saber cuánto representa del total.
        qs_para_chart_zonas = base_queryset
        if delito_filtro:
            # Si selecciono un delito, las zonas deben ser donde ocurre ese delito
            qs_para_chart_zonas = qs_para_chart_zonas.filter(naturaleza_delito__iexact=delito_filtro)
        # IMPORTANTE: Aquí NO aplicamos el filtro de zona.

        # -------------------------------------------------------------------------
        # 3. CÁLCULOS Y AGREGACIONES
        # -------------------------------------------------------------------------

        # -- KPI TOTAL (Usa el filtrado estricto) --
        total_delitos = filtered_queryset.count()

        # -- CHART TOP DELITOS (Usa el queryset "flexible" de delitos) --
        top_delitos = qs_para_chart_delitos.values('naturaleza_delito').annotate(total=Count('cod_form_01')).order_by('-total')[:5]

        # -- CHART TOP ZONAS (Usa el queryset "flexible" de zonas) --
        top_zonas = qs_para_chart_zonas.values('zona_del_hecho').annotate(total=Count('cod_form_01')).order_by('-total')[:5]

        # -- HISTÓRICOS Y MAPA (Usan el filtrado estricto - Deben cambiar con todo) --
        delitos_por_año = filtered_queryset.annotate(año=Trunc('fecha_denuncia', 'year')).values('año').annotate(total=Count('cod_form_01')).order_by('año')
        
        delitos_por_mes = filtered_queryset.annotate(
            mes_numero=Extract('fecha_denuncia', 'month')
        ).values('mes_numero').annotate(
            total=Count('cod_form_01')
        ).order_by('mes_numero')
        
        coordenadas_qs = filtered_queryset.exclude(latitud__isnull=True).exclude(longitud__isnull=True).order_by('-fecha_denuncia').values('latitud', 'longitud')[:1000]
        
        # Formateo de fechas para el frontend
        delitos_por_año_fmt = [{'año': item['año'].strftime('%Y'), 'total': item['total']} for item in delitos_por_año]
        delitos_por_mes_fmt = [{'mes': item['mes_numero'], 'total': item['total']} for item in delitos_por_mes]
        
        data = {
            'total_delitos': total_delitos,
            'top_delitos': list(top_delitos), # Datos completos (solo filtrados por zona)
            'top_zonas': list(top_zonas),     # Datos completos (solo filtrados por delito)
            'delitos_por_año': delitos_por_año_fmt,
            'delitos_por_mes': delitos_por_mes_fmt, 
            'coordenadas': list(coordenadas_qs),
        }
        return Response(data, status=status.HTTP_200_OK)

# Archivo: gestor_datos/views.py

# --- VISTA 1: EXCEL DE DATOS DETALLADOS (ESTABLE) ---
class ExportarExcelView(APIView):
    permission_classes = [PuedeCargarDatos]

    # CAMBIAMOS A POST PARA PODER RECIBIR LA IMAGEN
    def post(self, request, *args, **kwargs):
        try:
            # 1. Recuperar datos del cuerpo del request (JSON)
            zona_filtro = request.data.get('zona')
            delito_filtro = request.data.get('delito')
            base64_img = request.data.get('image') # La foto del dashboard

            # 2. Filtrar QuerySet (Igual que antes, pero más robusto)
            queryset = RegistroDelitoReal.objects.filter(fecha_denuncia__isnull=False)
            
            if zona_filtro:
                queryset = queryset.filter(zona_del_hecho__icontains=zona_filtro.strip())
            
            if delito_filtro:
                queryset = queryset.filter(naturaleza_delito__icontains=delito_filtro.strip())

            # 3. Preparar datos para Pandas
            data = list(queryset.values(
                'fecha_denuncia', 'hora', 'departamento', 'municipios', 
                'zona_del_hecho', 'avenida_calle', 'naturaleza_delito', 
                'latitud', 'longitud'
            ))

            if not data:
                return Response({'error': 'No hay datos para exportar con estos filtros.'}, status=status.HTTP_404_NOT_FOUND)

            df = pd.DataFrame(data)

            # Limpieza de fechas y horas
            if 'fecha_denuncia' in df.columns:
                df['fecha_denuncia'] = df['fecha_denuncia'].astype(str)
            if 'hora' in df.columns:
                df['hora'] = df['hora'].astype(str)

            # 4. CREACIÓN DEL EXCEL CON OPENPYXL
            output = BytesIO()
            
            # Usamos ExcelWriter con motor openpyxl
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Escribimos los datos en la hoja 'Reporte'
                df.to_excel(writer, index=False, sheet_name='Reporte')
                
                # Accedemos a la hoja para pegar la imagen
                workbook = writer.book
                worksheet = writer.sheets['Reporte']
                
                # --- PROCESAMIENTO DE IMAGEN ---
                if base64_img:
                    try:
                        # Limpiar cabecera base64 si existe
                        if "base64," in base64_img:
                            base64_img = base64_img.split("base64,")[1]
                        
                        img_data = base64.b64decode(base64_img)
                        img_io = BytesIO(img_data)
                        
                        # Creamos la imagen para Excel
                        excel_img = XLImage(img_io)
                        
                        # Ajustamos tamaño (opcional, para que no sea gigante)
                        # excel_img.width = 800
                        # excel_img.height = 600
                        
                        # Pegamos la imagen en la celda L2 (Al lado de los datos)
                        worksheet.add_image(excel_img, 'L2')
                        
                    except Exception as img_error:
                        print(f"Error procesando imagen para Excel: {img_error}")
                        # No detenemos el proceso, solo imprimimos el error

            # 5. Preparar respuesta
            output.seek(0)
            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            
            nombre_archivo = f"Reporte_{zona_filtro if zona_filtro else 'Global'}_{delito_filtro if delito_filtro else 'Todos'}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'

            return response

        except Exception as e:
            print("Error fatal exportando Excel:", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- VISTA 2: PDF OFICIAL (CON FILTROS APLICADOS) ---
# Archivo: gestor_datos/views.py

# Archivo: gestor_datos/views.py

class ExportarPDFView(APIView):
    permission_classes = [PuedeCargarDatos]

    def post(self, request, *args, **kwargs):
        try:
            images_data = request.data.get('images', {})
            
            response = HttpResponse(content_type='application/pdf')
            filename = "Reporte_Operativo.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            # PDF Horizontal
            doc = SimpleDocTemplate(response, pagesize=landscape(letter))
            styles = getSampleStyleSheet()
            story = []

            story.append(Paragraph("Reporte de Inteligencia Operativa", styles['Title']))
            story.append(Spacer(1, 10))

            # --- PROCESAMIENTO DE LA IMAGEN ---
            # ... (imports y principio de la función igual) ...

            # --- PROCESAMIENTO DE LA IMAGEN CORREGIDO ---
            base64_str = images_data.get('full_dashboard')

            if base64_str:
                try:
                    if "base64," in base64_str:
                        img_str = base64_str.split("base64,")[1]
                    else:
                        img_str = base64_str

                    img_bytes = base64.b64decode(img_str)
                    img_buffer = BytesIO(img_bytes)

                    with PILImage.open(img_buffer) as pil_img:
                        orig_width, orig_height = pil_img.size
                    
                    img_buffer.seek(0)

                    # --- CAMBIO IMPORTANTE AQUÍ: LÓGICA DE AJUSTE AUTOMÁTICO ---
                    # El error dijo que tu espacio disponible es 636 x 456. 
                    # Usaremos límites seguros un poco menores.
                    MAX_WIDTH = 600.0   
                    MAX_HEIGHT = 440.0 
                    
                    aspect_ratio = orig_height / orig_width

                    # 1. Primero intentamos ajustar al ancho máximo disponible
                    final_width = MAX_WIDTH
                    final_height = MAX_WIDTH * aspect_ratio

                    # 2. Si al ajustar al ancho, la altura se sale del límite, ajustamos por altura
                    if final_height > MAX_HEIGHT:
                        final_height = MAX_HEIGHT
                        final_width = final_height / aspect_ratio

                    # 3. Creamos la imagen con las dimensiones calculadas que SÍ CABEN
                    img = ReportLabImage(img_buffer, width=final_width, height=final_height)
                    img.hAlign = 'CENTER'
                    
                    story.append(img)
                    print(f"✅ Imagen redimensionada a: {final_width:.2f} x {final_height:.2f}")

                except Exception as e:
                    print(f"⚠️ Error procesando imagen: {e}")
                    story.append(Paragraph(f"Error al procesar imagen: {str(e)}", styles['Normal']))
            else:
# ... (resto del código igual)
                story.append(Paragraph("No se recibió la captura del dashboard.", styles['Normal']))

            story.append(Spacer(1, 20))
            story.append(Paragraph("Reporte generado automáticamente.", styles['Italic']))

            doc.build(story)
            return response

        except Exception as e:
            print("🔥 Error fatal generando PDF:", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PrediccionFuturaView(APIView):
    permission_classes = [PuedeCargarDatos] 

    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year', 2024))
            month = int(request.query_params.get('month', 12)) 
        except ValueError:
            return Response({"error": "Parámetros inválidos."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Llama a la función de ml_engine que ya tiene la lógica de caché
        data = ml_engine.get_comparison_data(year, month)

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
            
            # 2. La guardamos en la caché para que get_comparison_data la lea
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