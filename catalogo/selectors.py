"""Una sola política de publicación para las páginas y la API."""
from django.db.models import Count, Q

from .models import Categoria, Edicion, Votacion


def ediciones_publicas():
    return Edicion.objects.filter(activa=True).annotate(
        total_categorias=Count("categorias", filter=Q(categorias__publicada=True))
    ).order_by(*Edicion._meta.ordering)


def categorias_publicas():
    return Categoria.objects.filter(publicada=True, edicion__activa=True).select_related("edicion").annotate(
        total_votaciones=Count("votaciones", filter=Q(votaciones__publicada=True))
    ).order_by(*Categoria._meta.ordering)


def votaciones_publicas():
    return Votacion.objects.filter(
        publicada=True, categoria__publicada=True, categoria__edicion__activa=True
    ).select_related("categoria__edicion").annotate(
        total_opciones=Count("opciones", filter=Q(opciones__activa=True))
    ).order_by(*Votacion._meta.ordering)
