from django.shortcuts import get_object_or_404, render

from .models import Categoria, Edicion, Votacion


def inicio(request):
    edicion = Edicion.objects.filter(activa=True).order_by("-anio").first()
    categorias = (
        Categoria.objects.filter(edicion=edicion).select_related("edicion")
        if edicion
        else Categoria.objects.none()
    )
    return render(
        request,
        "catalogo/inicio.html",
        {"edicion": edicion, "categorias": categorias},
    )


def lista_categorias(request):
    categorias = Categoria.objects.select_related("edicion").all()
    return render(request, "catalogo/categorias.html", {"categorias": categorias})


def lista_votaciones(request):
    votaciones = (
        Votacion.objects.filter(publicada=True)
        .select_related("categoria", "categoria__edicion")
        .prefetch_related("opciones")
    )
    categoria_id = request.GET.get("categoria")
    categoria = None
    if categoria_id:
        categoria = get_object_or_404(Categoria, pk=categoria_id)
        votaciones = votaciones.filter(categoria=categoria)
    return render(
        request,
        "catalogo/votaciones.html",
        {"votaciones": votaciones, "categoria": categoria},
    )


def detalle_votacion(request, pk):
    votacion = get_object_or_404(
        Votacion.objects.select_related("categoria", "categoria__edicion").prefetch_related(
            "opciones"
        ),
        pk=pk,
        publicada=True,
    )
    opciones = votacion.opciones.filter(activa=True)
    return render(
        request,
        "catalogo/detalle.html",
        {"votacion": votacion, "opciones": opciones},
    )


def resultados(request):
    votaciones = (
        Votacion.objects.filter(publicada=True)
        .select_related("categoria", "categoria__edicion")
        .prefetch_related("opciones")
    )
    return render(request, "catalogo/resultados.html", {"votaciones": votaciones})
