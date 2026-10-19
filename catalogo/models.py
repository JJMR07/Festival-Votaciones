from django.db import models


class Edicion(models.Model):
    """Una edición del festival (por ejemplo, 2027)."""

    nombre = models.CharField(max_length=150)
    anio = models.PositiveIntegerField(verbose_name="año")
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "edición"
        verbose_name_plural = "ediciones"
        ordering = ["-anio", "nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.anio})"


class Categoria(models.Model):
    """Categoría asociada a una edición (Rey Profesional, Rey Infantil, etc.)."""

    edicion = models.ForeignKey(
        Edicion,
        on_delete=models.CASCADE,
        related_name="categorias",
        verbose_name="edición",
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} — {self.edicion.anio}"


class Votacion(models.Model):
    """Proceso de votación dentro de una categoría."""

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name="votaciones",
        verbose_name="categoría",
    )
    titulo = models.CharField(max_length=200, verbose_name="título")
    descripcion = models.TextField(blank=True, verbose_name="descripción")
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    publicada = models.BooleanField(
        default=True,
        help_text="Si está desmarcada, no se muestra en la interfaz pública.",
    )

    class Meta:
        verbose_name = "votación"
        verbose_name_plural = "votaciones"
        ordering = ["titulo"]

    def __str__(self):
        return self.titulo


class Opcion(models.Model):
    """Opción (candidato o participante) de una votación."""

    votacion = models.ForeignKey(
        Votacion,
        on_delete=models.CASCADE,
        related_name="opciones",
        verbose_name="votación",
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.CharField(max_length=200, blank=True, verbose_name="descripción")
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = "opción"
        verbose_name_plural = "opciones"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
