from django.utils import timezone

from .defaults import textos_iniciales


def imagen_url(obj, archivo="imagen_archivo", respaldo="imagen"):
    imagen = getattr(obj, archivo)
    return imagen.url if imagen else getattr(obj, respaldo)


def configuracion_data(config):
    return {
        "nombre": config.nombre, "nombre_corto": config.nombre_corto, "subtitulo": config.subtitulo,
        "logo": imagen_url(config, "logo_archivo", "logo"), "imagen_portada": imagen_url(config, "portada_archivo", "imagen_portada"),
        "imagen_predeterminada": imagen_url(config, "predeterminada_archivo", "imagen_predeterminada"),
        "color_primario": config.color_primario, "color_acento": config.color_acento,
        "registro_habilitado": config.registro_habilitado,
        "textos": {**textos_iniciales(), **config.textos},
    }


def edicion_data(obj):
    return {"id": obj.pk, "nombre": obj.nombre, "anio": obj.anio,
            "descripcion": obj.descripcion, "imagen": imagen_url(obj),
        "total_categorias": obj.total_categorias}


def categoria_data(obj):
    return {"id": obj.pk, "nombre": obj.nombre, "descripcion": obj.descripcion,
            "imagen": imagen_url(obj), "edicion_id": obj.edicion_id,
            "edicion_nombre": obj.edicion.nombre, "anio": obj.edicion.anio,
            "total_votaciones": obj.total_votaciones}


def votacion_data(obj):
    ahora = timezone.now()
    estado = "sin_fecha"
    if obj.fecha_cierre and obj.fecha_cierre <= ahora:
        estado = "cerrada"
    elif obj.fecha_inicio and obj.fecha_inicio > ahora:
        estado = "programada"
    elif obj.fecha_inicio:
        estado = "abierta"
    return {
        "id": obj.pk, "titulo": obj.titulo, "descripcion": obj.descripcion, "imagen": imagen_url(obj),
        "categoria_id": obj.categoria_id, "categoria_nombre": obj.categoria.nombre,
        "edicion_id": obj.categoria.edicion_id, "edicion_nombre": obj.categoria.edicion.nombre,
        "anio": obj.categoria.edicion.anio, "total_opciones": obj.total_opciones,
        "fecha_inicio": obj.fecha_inicio, "fecha_cierre": obj.fecha_cierre, "estado": estado,
    }
