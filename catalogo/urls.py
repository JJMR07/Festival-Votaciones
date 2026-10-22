from django.urls import path

from config.frontend import index

app_name = "catalogo"

urlpatterns = [
    path("", index, name="inicio"),
    path("ediciones/", index, name="ediciones"),
    path("categorias/", index, name="categorias"),
    path("votaciones/", index, name="votaciones"),
    path("votaciones/<int:pk>/", index, name="detalle"),
    path("resultados/", index, name="resultados"),
]
