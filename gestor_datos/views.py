# Archivo: gestor_datos/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
import pandas as pd
from .models import RegistroDelito
# Archivo: gestor_datos/views.py
from users.permissions import PuedeCargarDatos # Importamos el nuevo permiso
from django.db.models import Count
import math # <-- 1. ¡IMPORTAMOS LA HERRAMIENTA DE LIMPIEZA!



class CargarDatosView(APIView):
    permission_classes = [PuedeCargarDatos] # Usamos nuestro permiso flexible

    def post(self, request, *args, **kwargs):
        archivo = request.FILES.get('archivo_excel')
        if not archivo:
            return Response({'error': 'No se proporcionó ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Lee el archivo Excel usando pandas
            df = pd.read_excel(archivo)
            
            registros_a_crear = []
            for _, row in df.iterrows():
                # Convierte la fecha de Excel (número) a una fecha real si es necesario
                fecha_excel = row['FECHAS']
                if isinstance(fecha_excel, (int, float)):
                    fecha_real = pd.to_datetime('1899-12-30') + pd.to_timedelta(fecha_excel, 'D')
                else:
                    fecha_real = pd.to_datetime(fecha_excel)

                lat_grande = row.get('LATITUD')
                lon_grande = row.get('LONGITUD')

                # Dividimos por 10^8 para poner el punto decimal en su sitio.
                # Nos aseguramos de que no sean nulos antes de dividir.
                lat_correcta = lat_grande / 100000000.0 if pd.notna(lat_grande) else None
                lon_correcta = lon_grande / 100000000.0 if pd.notna(lon_grande) else None
                # --- FIN DE LA CORRECCIÓN ---

                registros_a_crear.append(
                    RegistroDelito(
                        numero_id=row['NUMERO ID'],
                        codigo_delito=row.get('CODIGO_DELITO'),
                        tipo_delito=row.get('TIPO_DELITO'),
                        descripcion_delito=row.get('DESCRIPCION_DELITO'),
                        distrito=row.get('DISTRITO'),
                        fecha=fecha_real.date(),
                        hora=row.get('HORA'),
                        clasificacion=row.get('CLASIFICACION'),
                        calle=row.get('CALLE'),
                        latitud=lat_correcta,
                        longitud=lon_correcta
                    )
                )
            
            # Crea todos los registros en la base de datos de una sola vez
            RegistroDelito.objects.bulk_create(registros_a_crear, ignore_conflicts=True)

            return Response({'status': f'{len(registros_a_crear)} registros cargados exitosamente.'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        
class EstadisticasView(APIView):
    permission_classes = [PuedeCargarDatos]

    def get(self, request, *args, **kwargs):
        # 1. Obtenemos los datos como antes
        total_delitos = RegistroDelito.objects.count()
        delitos_por_tipo = RegistroDelito.objects.values('tipo_delito').annotate(
            total=Count('tipo_delito')
        ).order_by('-total')[:5]
        
        # 2. Obtenemos las coordenadas "sucias", sin filtrar en la BD
        coordenadas_sucias = RegistroDelito.objects.order_by('-fecha').values('latitud', 'longitud')[:1000]

        # --- 3. EL BUCLE DE LIMPIEZA MANUAL ---
        coordenadas_limpias = []
        for coord in coordenadas_sucias:
            # Usamos math.isnan() para detectar los valores 'nan'
            # y también comprobamos que no sean None (null)
            lat = coord.get('latitud')
            lon = coord.get('longitud')
            
            if lat is not None and lon is not None and not math.isnan(lat) and not math.isnan(lon):
                # Solo si la latitud Y la longitud son números válidos, los añadimos a la lista limpia
                coordenadas_limpias.append(coord)
        # --- FIN DEL BUCLE DE LIMPIEZA ---
        
        # 4. Empaquetamos los datos 100% limpios
        data = {
            'total_delitos': total_delitos,
            'top_delitos': list(delitos_por_tipo),
            'coordenadas': coordenadas_limpias, # ¡Usamos la lista limpia!
        }
        
        return Response(data, status=status.HTTP_200_OK)