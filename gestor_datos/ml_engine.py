import pandas as pd
import numpy as np
import random
from .models import RegistroDelitoReal
from django.db.models import Count
from django.db.models.functions import Trunc
from datetime import datetime
from django.utils import timezone
from django.core.cache import cache 

# --- FIJAMOS LA SEMILLA ---
np.random.seed(42)
random.seed(42)

def jiggle_value(count, percentage=0.15, min_var=-2, max_var=2):
    if count == 0:
        return 0
    if count > 20:
        variation = count * percentage
        return max(0, count + random.uniform(-variation, variation))
    else:
        return max(0, count + random.uniform(min_var, max_var))

def jiggle_points(points_list):
    predichos = []
    for p in points_list:
        predichos.append({
            'latitud': p['latitud'] + np.random.uniform(-0.0008, 0.0008),
            'longitud': p['longitud'] + np.random.uniform(-0.0008, 0.0008)
        })
    return predichos

def limpiar_nombres_columnas_df(df_in):
    cols = [
        c.lower()
         .strip()
         .replace(' ', '_').replace('.', '').replace('/', '_')
         .replace('(', '').replace(')', '')
         .replace('á', 'a').replace('é', 'e').replace('í', 'i')
         .replace('ó', 'o').replace('ú', 'u')
         .replace('nº', 'n')
        for c in df_in.columns
    ]
    df_in.columns = cols
    return df_in

def get_cocinado_comparison_data(year, month):
    """
    Función principal que consulta la DB y genera los datos
    reales vs. los predichos "cocinados".
    
    ¡CON LÓGICA DE ZONAS Y SEMANAS CORREGIDA!
    """

    cache_key = f'prediccion_cocinada_top5_{year}_{month}'
    cached_data = cache.get(cache_key)
    if cached_data:
        print(f"--- Devolviendo datos TOP 5 desde el CACHÉ para {month}/{year} ---")
        return cached_data

    print(f"--- Generando NUEVA simulación TOP 5 para {month}/{year} (no se encontró en caché) ---")
    
    qs = RegistroDelitoReal.objects.filter(
        fecha_denuncia__year=year,
        fecha_denuncia__month=month
    )
    if not qs.exists():
        return {"error": f"No se encontraron datos reales para {month}/{year}."}

    df = pd.DataFrame.from_records(
        qs.values(
            'fecha_denuncia', 
            'naturaleza_delito', 
            'zona_del_hecho', 
            'latitud', 
            'longitud'
        )
    )
    df = limpiar_nombres_columnas_df(df)
    
    if 'naturaleza_delito' not in df.columns or 'zona_del_hecho' not in df.columns:
        return {"error": "Las columnas 'naturaleza_delito' o 'zona_del_hecho' no se limpiaron correctamente."}

    # --- LÓGICA DE FILTRADO TOP 5 ---
    tipos_real_full = df['naturaleza_delito'].value_counts()
    tipos_real_top = tipos_real_full.head(5) 
    top_tipo_names = tipos_real_top.index.tolist() 
    df_filtrado = df[df['naturaleza_delito'].isin(top_tipo_names)].copy()
    
    # 3. CALCULAR LAS ESTADÍSTICAS "REALES"
    df_filtrado['fecha_denuncia'] = pd.to_datetime(df_filtrado['fecha_denuncia'])
    
    total_real = len(df_filtrado)
    tipos_real = tipos_real_top.to_dict()
    
    # --- ¡CAMBIO CLAVE 1: LÓGICA DE ZONAS! ---
    # Ya no usamos 'zona_agrupada'. Contamos sobre la columna original 'zona_del_hecho'.
    # Esto elimina "OTRAS_ZONAS" del gráfico.
    zonas_real = df_filtrado['zona_del_hecho'].value_counts().head(5).to_dict()
    
    # --- ¡CAMBIO CLAVE 2: LÓGICA SEMANAL! ---
    # Nos aseguramos de tener todas las semanas de Diciembre 2024, rellenando con 0
    df_diario_real = df_filtrado.set_index('fecha_denuncia').resample('D').size()
    
    # 1. Creamos un índice con TODAS las semanas de Diciembre 2024 (que son 5)
    start_date = pd.Timestamp(f'{year}-{month}-01')
    end_date = start_date + pd.offsets.MonthEnd(0)
    # Usamos 'W-SUN' (Week ending Sunday) que es el default de resample('W')
    all_weeks_index = pd.date_range(start=start_date, end=end_date, freq='W-SUN')
    # Añadimos la primera semana si 2024-12-01 no es domingo
    if start_date.dayofweek != 6: # 6 es Domingo
         all_weeks_index = all_weeks_index.insert(0, start_date)

    # 2. Re-indexamos los datos reales contra el índice completo
    df_semanal_real = df_diario_real.resample('W-SUN').sum().reindex(all_weeks_index, fill_value=0)
    
    # 3. Formateamos la salida
    tendencia_semanal_real = [
        {'semana': index.strftime('%Y-%m-%d'), 'conteo': valor}
        for index, valor in df_semanal_real.items()
    ]
    # --- FIN CAMBIO SEMANAL ---
    
    puntos_mapa_real = df_filtrado[['latitud', 'longitud']].to_dict('records')

    # 4. "COCINAR" LAS PREDICCIONES
    ACCURACY = cache.get('current_model_accuracy', 0.8368)

    # PASO 1: Tipos de delito
    tipos_predicho = {}
    for key, val in tipos_real.items():
        base_pred = val * ACCURACY
        pred_final = jiggle_value(base_pred, percentage=0.05, min_var=-1, max_var=1)
        tipos_predicho[key] = max(0, int(round(pred_final)))

    # PASO 2: Total
    total_predicho = sum(tipos_predicho.values())

    # PASO 3: Zonas (Ahora usa la lista 'zonas_real' corregida)
    zonas_predicho = {}
    for key, val in zonas_real.items():
        base_pred = val * ACCURACY
        pred_final = jiggle_value(base_pred, percentage=0.05, min_var=-1, max_var=1)
        zonas_predicho[key] = max(0, int(round(pred_final)))
    
    # PASO 4: Tendencia Semanal (Predicha)
    # Hacemos el mismo re-escalado sobre el df_semanal_real (que ya tiene 5 semanas)
    df_semanal_predicho = df_semanal_real.apply(lambda x: x * ACCURACY)
    sum_pred = df_semanal_predicho.sum()
    
    if sum_pred > 0:
        df_semanal_predicho = (df_semanal_predicho * total_predicho / sum_pred)
        
    tendencia_semanal_predicha = [
        {'semana': item['semana'], 'conteo': max(0, int(round(valor)))}
        for item, valor in zip(tendencia_semanal_real, df_semanal_predicho)
    ]

    # PASO 5: Puntos del mapa
    puntos_mapa_predichos = []
    if len(puntos_mapa_real) > total_predicho and total_predicho > 0:
        puntos_reales_sample = random.sample(puntos_mapa_real, total_predicho)
        puntos_mapa_predichos = jiggle_points(puntos_reales_sample)
    else:
        puntos_mapa_predichos = jiggle_points(puntos_mapa_real[:total_predicho])

    # 5. DEVOLVER TODO
    output = {
        "metadata": {
            "mes": month,
            "anio": year,
            "precision_simulada": f"{ACCURACY * 100:.2f}%" 
        },
        "reales": {
            "total_delitos": total_real,
            "por_tipo": tipos_real,
            "por_zona": zonas_real,
            "tendencia_semanal": tendencia_semanal_real,
            "puntos_mapa": puntos_mapa_real
        },
        "predichos_ml": {
            "total_delitos": total_predicho,
            "por_tipo": tipos_predicho,
            "por_zona": zonas_predicho,
            "tendencia_semanal": tendencia_semanal_predicha,
            "puntos_mapa": puntos_mapa_predichos
        }
    }
    
    cache.set(cache_key, output, timeout=86400)
    return output