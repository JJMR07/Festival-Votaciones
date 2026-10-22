from django.core.paginator import Paginator
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.http import require_GET
from django.views.decorators.cache import never_cache

from .models import ConfiguracionSitio
from .selectors import categorias_publicas, ediciones_publicas, votaciones_publicas
from .serializers import categoria_data, configuracion_data, edicion_data, votacion_data


def listar(request, queryset, serializer, *, edicion=None, categoria=None, nombre="nombre"):
    try:
        for parametro, campo in (("edicion", edicion), ("categoria", categoria)):
            valor = request.GET.get(parametro)
            if valor and campo:
                numero = int(valor)
                if numero < 1:
                    raise ValueError
                queryset = queryset.filter(**{campo: numero})
        busqueda = request.GET.get("q", "").strip()[:150]
        if busqueda:
            queryset = queryset.filter(Q(**{f"{nombre}__icontains": busqueda}) | Q(descripcion__icontains=busqueda))
        pagina = int(request.GET.get("pagina", 1))
        limite = int(request.GET.get("limite", 12))
        if pagina < 1 or not 1 <= limite <= 48:
            raise ValueError
    except (ValueError, OverflowError):
        return JsonResponse({"error": "Filtros o paginación inválidos."}, status=400)
    paginador = Paginator(queryset, limite)
    if pagina > paginador.num_pages:
        return JsonResponse({"error": "Página no encontrada."}, status=404)
    objetos = paginador.page(pagina)
    return JsonResponse({"items": [serializer(o) for o in objetos], "total": paginador.count,
                         "pagina": pagina, "paginas": paginador.num_pages})


@require_GET
@never_cache
def configuracion(request):
    return JsonResponse(configuracion_data(ConfiguracionSitio.obtener()))


@require_GET
def ediciones(request):
    return listar(request, ediciones_publicas(), edicion_data)


@require_GET
def categorias(request):
    return listar(request, categorias_publicas(), categoria_data, edicion="edicion_id")


@require_GET
def votaciones(request):
    return listar(request, votaciones_publicas(), votacion_data,
                  edicion="categoria__edicion_id", categoria="categoria_id", nombre="titulo")


@require_GET
def detalle(request, pk):
    obj = votaciones_publicas().filter(pk=pk).first()
    if obj is None:
        return JsonResponse({"error": "Votación no encontrada."}, status=404)
    # La colección de opciones también se pagina: el detalle nunca carga toda una tabla.
    data = votacion_data(obj)
    opciones = obj.opciones.filter(activa=True)
    try:
        pagina = int(request.GET.get("pagina", 1))
        paginador = Paginator(opciones, 12)
        if pagina < 1 or pagina > paginador.num_pages:
            raise ValueError
    except (ValueError, OverflowError):
        return JsonResponse({"error": "Página de participantes inválida."}, status=400)
    data["opciones"] = {"items": [{"id": o.pk, "nombre": o.nombre, "descripcion": o.descripcion,
                                   "imagen": o.imagen} for o in paginador.page(pagina)],
                        "pagina": pagina, "paginas": paginador.num_pages, "total": paginador.count}
    return JsonResponse(data)
