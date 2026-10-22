from django.contrib import admin

from .models import Categoria, ConfiguracionSitio, Edicion, Opcion, Votacion
from .forms import ConfiguracionForm
from .defaults import textos_iniciales


@admin.register(ConfiguracionSitio)
class ConfiguracionSitioAdmin(admin.ModelAdmin):
    form = ConfiguracionForm
    fieldsets = [
        ("Identidad", {"fields": ("nombre", "nombre_corto", "subtitulo", "logo")}),
        ("Apariencia", {"fields": ("imagen_portada", "imagen_predeterminada", "color_primario", "color_acento")}),
        ("Comunidad", {"fields": ("registro_habilitado",)}),
        ("Textos de la interfaz", {"fields": tuple(f"texto_{clave}" for clave in textos_iniciales()), "description": "Personaliza títulos, botones, mensajes, menús y pie de página sin cambiar código. Puedes usar la búsqueda del navegador para localizar una etiqueta.", "classes": ("collapse",)}),
    ]

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
class EdicionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "anio", "activa", "orden")
    list_editable = ("activa", "orden")
    list_filter = ("activa", "anio")
    search_fields = ("nombre",)
    inlines = [CategoriaInline]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "edicion", "publicada", "orden")
    list_editable = ("publicada", "orden")
    list_filter = ("edicion",)
    search_fields = ("nombre",)
    inlines = [VotacionInline]


@admin.register(Votacion)
class VotacionAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "publicada", "orden", "fecha_inicio", "fecha_cierre")
    list_editable = ("publicada", "orden")
    list_select_related = ("categoria",)
    list_filter = ("publicada", "categoria__edicion")
    search_fields = ("titulo",)
    inlines = [OpcionInline]


@admin.register(Opcion)
class OpcionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "votacion", "activa", "orden")
    list_editable = ("activa", "orden")
    list_select_related = ("votacion",)
    list_filter = ("activa", "votacion")
    search_fields = ("nombre",)
