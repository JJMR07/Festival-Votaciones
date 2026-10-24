from django.urls import path
from . import api

urlpatterns = [
    path("sesion/", api.sesion), path("registro/", api.registro),
    path("login/", api.entrar), path("logout/", api.salir), path("perfil/", api.perfil),
    path("contrasena/cambiar/", api.cambiar_contrasena),
    path("contrasena/recuperar/", api.recuperar_contrasena),
    path("contrasena/restablecer/<str:uidb64>/<str:token>/", api.restablecer_contrasena),
]
