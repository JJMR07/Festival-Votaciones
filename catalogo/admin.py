from django.contrib import admin

from .models import Categoria, Edicion, Opcion, Votacion


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
    list_display = ("nombre", "anio", "activa")
    list_filter = ("activa", "anio")
    search_fields = ("nombre",)
    inlines = [CategoriaInline]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "edicion")
    list_filter = ("edicion",)
    search_fields = ("nombre",)
    inlines = [VotacionInline]


@admin.register(Votacion)
class VotacionAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "publicada", "fecha_inicio", "fecha_cierre")
    list_filter = ("publicada", "categoria__edicion")
    search_fields = ("titulo",)
    inlines = [OpcionInline]


@admin.register(Opcion)
class OpcionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "votacion", "activa")
    list_filter = ("activa", "votacion")
    search_fields = ("nombre",)
