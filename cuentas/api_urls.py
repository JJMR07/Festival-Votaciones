from django.urls import path
from . import api

urlpatterns = [
    path("sesion/", api.sesion), path("registro/", api.registro),
    path("login/", api.entrar), path("logout/", api.salir), path("perfil/", api.perfil),
]
