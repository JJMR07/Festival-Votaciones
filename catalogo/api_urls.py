from django.urls import path
from . import api

urlpatterns = [
    path("configuracion/", api.configuracion),
    path("ediciones/", api.ediciones),
    path("categorias/", api.categorias),
    path("votaciones/", api.votaciones),
    path("votaciones/<int:pk>/", api.detalle),
]
