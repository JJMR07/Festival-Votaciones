# Entrega 2 — Sistema web de votaciones

**Asignatura:** Desarrollo Web  
**Programa:** Ingeniería de Sistemas  
**Institución:** Fundación Universitaria del Área Andina  
**Fecha de entrega:** 26 de octubre de 2026  
**Proyecto:** Sistema web de votaciones para el Festival de la Leyenda Vallenata 2027

## Portada — integrantes

Completar con los nombres reales del equipo (no inventar):

1. Jesús Martínez
2. [Integrante 2]
3. [Integrante 3]
4. [Integrante 4]

**Enlace al repositorio:** [pegar URL pública con permiso de lectura para el docente]  
**Enlace al video (los 4 participan):** [pegar URL]

## 1. Introducción y objetivo

La Entrega 1 dejó el análisis y un prototipo HTML. El objetivo de la Entrega 2 es **pasar de diseño a un proyecto Django ejecutable**: aplicaciones, rutas, vistas, plantillas, conexión a PostgreSQL, modelos relacionados, migraciones, autenticación y consulta pública de datos reales.

La plataforma es configurable (Edición → Categoría → Votación → Opción) y no está limitada a una sola votación. Lo que el cliente no confirmó se mantiene como **pendiente de validación**. En esta entrega **no** se implementa el registro definitivo del voto.

## 2. Desarrollo técnico

### 2.1 Estructura Django

El proyecto se llama `config` (ajustes, URLs globales). Hay dos aplicaciones:

- `catalogo`: modelos, admin y páginas públicas.
- `cuentas`: registro, inicio y cierre de sesión.

### 2.2 Patrón MVT

1. El **modelo** describe las tablas (`Edicion`, `Categoria`, `Votacion`, `Opcion`).
2. La **vista** consulta PostgreSQL y elige una plantilla.
3. La **plantilla** pinta HTML con Bootstrap 5 y el CSS del prototipo.

Ejemplo: la vista `lista_categorias` lee `Categoria.objects.select_related("edicion")` y renderiza `templates/catalogo/categorias.html`.

### 2.3 PostgreSQL

Django se conecta con el motor `django.db.backends.postgresql`. El conector es **psycopg2-binary** (paquete de `requirements.txt`; no hace falta código extra en `config/__init__.py`). Host, usuario, contraseña y nombre de base salen de `.env`.

Se usa **Django 4.2.30 (LTS)**, fijado en `requirements.txt`. El patrón MVT no cambia.

La base `votaciones_festival` se creó con `createdb` y las tablas se generan con `migrate`.

### 2.4 Modelos y relaciones

- `Edicion` 1 — n `Categoria`
- `Categoria` 1 — n `Votacion`
- `Votacion` 1 — n `Opcion`

No hay modelo `Voto` en esta entrega.

### 2.5 Migraciones

`makemigrations` genera archivos en `catalogo/migrations/`.  
`migrate` crea las tablas en la base `votaciones_festival` de PostgreSQL.

### 2.6 Autenticación

Se usa el usuario de Django (`django.contrib.auth`). El registro pide usuario, nombre, correo y contraseña. La cédula del prototipo **no** se persistió: está pendiente de validación del cliente.

### 2.7 Administración

Django Admin permite crear, editar y borrar ediciones, categorías, votaciones y opciones. Los inlines permiten cargar hijos en la misma pantalla (categorías dentro de una edición, opciones dentro de una votación).

## 3. Capturas comentadas

Pegar aquí capturas de:

1. PostgreSQL 17 iniciado (`pg_ctl start`) y la base `votaciones_festival`.
2. `python manage.py migrate` exitoso.
3. Django Admin con la edición 2027 y categorías.
4. Inicio público mostrando categorías reales.
5. Detalle de una votación con opciones.
6. Formulario de registro e inicio de sesión.
7. `python manage.py test` en verde.

Cada captura debe decir **qué se ve** y **por qué demuestra el requisito**.

## 4. Código relevante (fragmentos)

Modelo de categoría (relación con edición):

```python
class Categoria(models.Model):
    edicion = models.ForeignKey(Edicion, on_delete=models.CASCADE, related_name="categorias")
    nombre = models.CharField(max_length=150)
```

Vista pública que lee PostgreSQL:

```python
def lista_votaciones(request):
    votaciones = Votacion.objects.filter(publicada=True).select_related("categoria")
```

No incluir en el PDF el archivo `.env` ni contraseñas.

## 5. Pruebas y resultados

Comando: `python manage.py test`

Casos cubiertos:

- Relación Edición → Categoría → Votación → Opción.
- La página de inicio muestra una categoría guardada en la base.
- El detalle muestra opciones.
- El registro crea un usuario e inicia sesión.
- El login acepta un usuario existente.

Resultado: **5 pruebas en verde** contra PostgreSQL (base de prueba `test_votaciones_festival`).

## 6. Conclusiones

La Entrega 2 deja un sistema Django consultable, administrable y autenticado, con la jerarquía pedida y sin adelantar reglas de votación no validadas. La Entrega 3 (si el curso la define) puede incorporar el voto, duplicados y resultados cuando el cliente las confirme.

## 7. Distribución del trabajo

Ajustar con el equipo:

| Integrante | Rol en Entrega 2 |
| --- | --- |
| Jesús Martínez | Implementación Django, PostgreSQL, plantillas y documentación técnica |
| [Integrante 2] | [completar] |
| [Integrante 3] | [completar] |
| [Integrante 4] | [completar: video, capturas, revisión del PDF] |
