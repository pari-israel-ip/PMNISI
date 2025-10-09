 # Archivo: backEnd/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # CUALQUIER COSA que empiece con 'api/' será manejada por el archivo de URLs de la app 'users'
    path('api/', include('users.urls')),
    path('api/data/', include('gestor_datos.urls')), # <-- AÑADE ESTA

]