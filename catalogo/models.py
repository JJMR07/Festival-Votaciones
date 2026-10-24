from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from .defaults import textos_iniciales
from .validators import validar_imagen, validar_textos, validar_imagen_archivo, ruta_imagen
from django.core.validators import FileExtensionValidator


class ImagenSubida(models.Model):
    imagen_archivo = models.ImageField(
        "subir imagen", upload_to=ruta_imagen, blank=True,
        validators=[validar_imagen_archivo, FileExtensionValidator(["jpg", "jpeg", "png", "webp"])],
        help_text="JPG, PNG o WebP, máximo 5 MB y 4096 px por lado. Tiene prioridad sobre la URL. Al quitarla se vuelve a usar la URL.",
    )

    class Meta:
        abstract = True


class ConfiguracionSitio(models.Model):
    nombre = models.CharField(max_length=150, default="Festival de la Leyenda Vallenata")
    nombre_corto = models.CharField(max_length=45, default="Festival Vallenato")
    subtitulo = models.CharField(max_length=100, default="TRADICIÓN QUE VIVE")
    logo = models.CharField(max_length=500, default="/static/img/logo.png", validators=[validar_imagen])
    imagen_portada = models.CharField(max_length=500, default="/static/img/music2.png", validators=[validar_imagen])
    imagen_predeterminada = models.CharField(max_length=500, default="/static/img/music.png", validators=[validar_imagen])
    color_primario = models.CharField(max_length=7, default="#dd3333", validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$", "Usa un color hexadecimal, por ejemplo #dd3333.")])
    color_acento = models.CharField(max_length=7, default="#e9d294", validators=[RegexValidator(r"^#[0-9a-fA-F]{6}$", "Usa un color hexadecimal.")])
    registro_habilitado = models.BooleanField(default=True)
    textos = models.JSONField(default=textos_iniciales, validators=[validar_textos], help_text="Textos de toda la interfaz. Conserva las claves y edita sus valores. Las claves omitidas usan el valor inicial.")
    logo_archivo = models.ImageField("subir logo", upload_to=ruta_imagen, blank=True, validators=[validar_imagen_archivo, FileExtensionValidator(["jpg", "jpeg", "png", "webp"])], help_text="JPG, PNG o WebP, máximo 5 MB y 4096 px por lado. Tiene prioridad sobre la URL.")
    portada_archivo = models.ImageField("subir portada", upload_to=ruta_imagen, blank=True, validators=[validar_imagen_archivo, FileExtensionValidator(["jpg", "jpeg", "png", "webp"])], help_text="JPG, PNG o WebP, máximo 5 MB y 4096 px por lado. Tiene prioridad sobre la URL.")
    predeterminada_archivo = models.ImageField("subir imagen de respaldo", upload_to=ruta_imagen, blank=True, validators=[validar_imagen_archivo, FileExtensionValidator(["jpg", "jpeg", "png", "webp"])], help_text="JPG, PNG o WebP, máximo 5 MB y 4096 px por lado. Tiene prioridad sobre la URL.")
    actualizada = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "configuración del sitio"
        verbose_name_plural = "configuración del sitio"
        constraints = [models.CheckConstraint(condition=models.Q(pk=1), name="configuracion_unica")]

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre

    @classmethod
    def obtener(cls):
        # Leer el sitio público no escribe en la base de datos.
        return cls.objects.filter(pk=1).first() or cls(pk=1)


class Edicion(ImagenSubida):
    """Una edición del festival (por ejemplo, 2027)."""

    nombre = models.CharField(max_length=150)
    anio = models.PositiveIntegerField(verbose_name="año")
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True, verbose_name="visible al público", help_text="Desactívala para ocultar también sus categorías, votaciones y participantes.")
    orden = models.PositiveIntegerField(default=0)
    imagen = models.CharField(max_length=500, blank=True, validators=[validar_imagen])

    class Meta:
        verbose_name = "edición"
        verbose_name_plural = "ediciones"
        ordering = ["orden", "-anio", "nombre", "pk"]
        indexes = [models.Index(fields=["activa", "orden", "-anio"], name="edicion_publica_idx")]

    def __str__(self):
        return f"{self.nombre} ({self.anio})"


class Categoria(ImagenSubida):
    """Categoría asociada a una edición (Rey Profesional, Rey Infantil, etc.)."""

    edicion = models.ForeignKey(
        Edicion,
        on_delete=models.CASCADE,
        related_name="categorias",
        verbose_name="edición",
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True)
    publicada = models.BooleanField(default=True)
    orden = models.PositiveIntegerField(default=0)
    imagen = models.CharField(max_length=500, blank=True, validators=[validar_imagen])

    class Meta:
        verbose_name = "categoría"
        verbose_name_plural = "categorías"
        ordering = ["orden", "nombre", "pk"]
        indexes = [models.Index(fields=["edicion", "publicada", "orden"], name="categoria_publica_idx")]

    def __str__(self):
        return f"{self.nombre} — {self.edicion.anio}"


class Votacion(ImagenSubida):
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
    orden = models.PositiveIntegerField(default=0)
    imagen = models.CharField(max_length=500, blank=True, validators=[validar_imagen])

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_cierre and self.fecha_cierre <= self.fecha_inicio:
            raise ValidationError({"fecha_cierre": "El cierre debe ser posterior al inicio."})

    class Meta:
        verbose_name = "votación"
        verbose_name_plural = "votaciones"
        ordering = ["orden", "titulo", "pk"]
        indexes = [models.Index(fields=["categoria", "publicada", "orden"], name="votacion_publica_idx")]
        constraints = [models.CheckConstraint(
            condition=models.Q(fecha_inicio__isnull=True) | models.Q(fecha_cierre__isnull=True) | models.Q(fecha_cierre__gt=models.F("fecha_inicio")),
            name="votacion_fechas_validas",
        )]

    def __str__(self):
        return self.titulo


class Opcion(ImagenSubida):
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
    orden = models.PositiveIntegerField(default=0)
    imagen = models.CharField(max_length=500, blank=True, validators=[validar_imagen])

    class Meta:
        verbose_name = "opción"
        verbose_name_plural = "opciones"
        ordering = ["orden", "nombre", "pk"]
        indexes = [models.Index(fields=["votacion", "activa", "orden"], name="opcion_publica_idx")]

    def __str__(self):
        return self.nombre
