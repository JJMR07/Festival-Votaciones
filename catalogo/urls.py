from django.urls import path

from . import views

app_name = "catalogo"

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("categorias/", views.lista_categorias, name="categorias"),
    path("votaciones/", views.lista_votaciones, name="votaciones"),
    path("votaciones/<int:pk>/", views.detalle_votacion, name="detalle"),
    path("resultados/", views.resultados, name="resultados"),
]
