from django.contrib import admin
from django.utils.html import format_html, format_html_join
from .serializers import imagen_url

from .models import Categoria, ConfiguracionSitio, Edicion, Opcion, Votacion
from .forms import ConfiguracionForm
from .defaults import textos_iniciales


def grupos_textos():
    grupos = {name: [] for name in ("Navegación y apariencia", "Inicio y catálogo", "Cuentas y contraseñas", "Mensajes y accesibilidad")}
    for clave in textos_iniciales():
        if any(word in clave for word in ("contrasena", "recuperar", "restablecer", "clave", "password", "correo", "login", "registro", "perfil", "cuenta", "usuario")):
            grupo = "Cuentas y contraseñas"
        elif clave.startswith(("titulo_", "descripcion_", "estado_")) or clave in {"sin_votos", "aviso_votos", "resultados_pendientes", "resultados_alcance", "ver_ficha", "cerrar_ficha", "foto_participante"}:
            grupo = "Inicio y catálogo"
        elif clave.startswith(("error", "sin_", "cargando", "reintentar", "no_encontrado")) or clave in {"enviando", "guardado", "saltar"}:
            grupo = "Mensajes y accesibilidad"
        else:
            grupo = "Navegación y apariencia"
        grupos[grupo].append(f"texto_{clave}")
    return [(f"Textos · {name}", {"fields": tuple(fields), "classes": ("collapse",)}) for name, fields in grupos.items()]


class ImagenAdminMixin:
    readonly_fields = ("vista_imagen",)

    @admin.display(description="Vista previa")
    def vista_imagen(self, obj):
        url = imagen_url(obj) if obj else ""
        return format_html('<img src="{}" alt="Vista previa" style="width:90px;height:70px;object-fit:contain;border-radius:6px" loading="lazy">', url) if url else "Sin imagen"

    class Media:
        js = ("admin/image-preview.js",)


class PublicacionAdminMixin:
    actions = ("publicar", "ocultar")
    visible_field = "publicada"

    def cambiar_publicacion(self, request, queryset, visible):
        for obj in queryset:
            setattr(obj, self.visible_field, visible)
            obj.save(update_fields=[self.visible_field])
            self.log_change(request, obj, "Publicado" if visible else "Oculto")
        self.message_user(request, f"Se actualizaron {queryset.count()} registros.")

    @admin.action(description="Publicar / mostrar seleccionados", permissions=["change"])
    def publicar(self, request, queryset):
        self.cambiar_publicacion(request, queryset, True)

    @admin.action(description="Ocultar seleccionados", permissions=["change"])
    def ocultar(self, request, queryset):
        self.cambiar_publicacion(request, queryset, False)


@admin.register(ConfiguracionSitio)
class ConfiguracionSitioAdmin(admin.ModelAdmin):
    form = ConfiguracionForm
    fieldsets = [
        ("Identidad", {"fields": ("nombre", "nombre_corto", "subtitulo", "logo", "logo_archivo", "vista_identidad")}),
        ("Apariencia", {"fields": ("imagen_portada", "portada_archivo", "imagen_predeterminada", "predeterminada_archivo", "color_primario", "color_acento")}),
        ("Comunidad", {"fields": ("registro_habilitado",)}),
    ] + grupos_textos()
    readonly_fields = ("vista_identidad",)

    @admin.display(description="Imágenes actuales")
    def vista_identidad(self, obj):
        if obj is None:
            return "Guarda la configuración para ver sus imágenes."
        return format_html_join(" ", '<img src="{}" alt="{}" style="width:100px;height:80px;object-fit:contain">',
            [(imagen_url(obj, field, fallback), label) for field, fallback, label in (
                ("logo_archivo", "logo", "Logo"), ("portada_archivo", "imagen_portada", "Portada"),
                ("predeterminada_archivo", "imagen_predeterminada", "Respaldo"))])

    class Media:
        js = ("admin/image-preview.js",)


    def has_add_permission(self, request):
        return super().has_add_permission(request) and not ConfiguracionSitio.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


class CategoriaInline(admin.TabularInline):
    model = Categoria
    extra = 0


class VotacionInline(admin.TabularInline):
    model = Votacion
    extra = 0


class OpcionInline(admin.TabularInline):
    model = Opcion
    extra = 0


@admin.register(Edicion)
class EdicionAdmin(ImagenAdminMixin, PublicacionAdminMixin, admin.ModelAdmin):
    list_display_links = ("nombre",)
    visible_field = "activa"
    list_display = ("vista_imagen", "nombre", "anio", "activa", "orden")
    list_editable = ("activa", "orden")
    list_filter = ("activa", "anio")
    search_fields = ("nombre",)
    inlines = [CategoriaInline]


@admin.register(Categoria)
class CategoriaAdmin(ImagenAdminMixin, PublicacionAdminMixin, admin.ModelAdmin):
    list_display_links = ("nombre",)
    list_display = ("vista_imagen", "nombre", "edicion", "publicada", "orden")
    list_editable = ("publicada", "orden")
    list_filter = ("edicion",)
    search_fields = ("nombre",)
    inlines = [VotacionInline]


@admin.register(Votacion)
class VotacionAdmin(ImagenAdminMixin, PublicacionAdminMixin, admin.ModelAdmin):
    list_display_links = ("titulo",)
    list_display = ("vista_imagen", "titulo", "categoria", "publicada", "orden", "fecha_inicio", "fecha_cierre")
    list_editable = ("publicada", "orden")
    list_select_related = ("categoria",)
    list_filter = ("publicada", "categoria__edicion")
    search_fields = ("titulo",)
    inlines = [OpcionInline]


@admin.register(Opcion)
class OpcionAdmin(ImagenAdminMixin, PublicacionAdminMixin, admin.ModelAdmin):
    list_display_links = ("nombre",)
    visible_field = "activa"
    list_display = ("vista_imagen", "nombre", "votacion", "activa", "orden")
    list_editable = ("activa", "orden")
    list_select_related = ("votacion",)
    list_filter = ("activa", "votacion")
    search_fields = ("nombre",)
