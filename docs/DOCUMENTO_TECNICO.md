# 📖 Documento Técnico — Sistema Web de Votaciones (Festival de la Leyenda Vallenata 2027)

> **Para quién es este documento:** para alguien que es **nuevo en Django y en el desarrollo web**.
> Explica *todas* las piezas del proyecto, qué hace cada archivo y cómo se conectan entre sí.
> No necesitas saber previamente nada: cada concepto nuevo se explica en el momento en que aparece.

---

## 📑 Índice

1. [El proyecto en resumen](#1-el-proyecto-en-resumen)
2. [Tecnologías que usa y qué es cada una](#2-tecnologías-que-usa-y-qué-es-cada-una)
3. [Conceptos clave para principiantes](#3-conceptos-clave-para-principiantes)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Cómo funciona una petición (el viaje de una página)](#5-cómo-funciona-una-petición)
6. [La configuración: `config/settings.py` y `.env`](#6-la-configuración)
7. [La base de datos: PostgreSQL](#7-la-base-de-datos-postgresql)
8. [Los modelos (el corazón del proyecto)](#8-los-modelos)
9. [Las URLs (el mapa del sitio)](#9-las-urls)
10. [Las vistas (la lógica)](#10-las-vistas)
11. [Las plantillas (el HTML que ve el usuario)](#11-las-plantillas)
12. [Archivos estáticos: CSS, JS e imágenes](#12-archivos-estáticos)
13. [Autenticación: registro, login y perfil](#13-autenticación)
14. [Django Admin (el panel de administración)](#14-django-admin)
15. [Comandos especiales del proyecto](#15-comandos-especiales)
16. [Las pruebas automáticas](#16-las-pruebas-automáticas)
17. [Prototipo (Entrega 1) vs Django (Entrega 2)](#17-prototipo-vs-django)
18. [Cheat sheet: comandos del día a día](#18-cheat-sheet)
19. [Ejecución y solución de problemas](#19-ejecución-y-solución-de-problemas)
20. [Seguridad: qué no subir nunca](#20-seguridad)
21. [Glosario completo](#21-glosario)
22. [Qué falta (Entrega 3)](#22-qué-falta)

---

## 1. El proyecto en resumen

Es una **página web para votar** en el Festival de la Leyenda Vallenata (edición 2027),
construida con **Django** (Python) y **PostgreSQL** (base de datos).

**Estructura de negocio (la jerarquía de datos):**

```
Edición (el festival 2027)
   └── Categoría (Rey Profesional, Rey Aficionado, Rey Infantil, Rey Juvenil)
          └── Votación ("Rey Profesional 2027")
                 └── Opción (los candidatos: Opción A, B, C...)
```

**Qué SÍ hace esta entrega (Entrega 2):**

- Muestra páginas públicas con datos **reales leídos de PostgreSQL** (inicio, categorías, votaciones, detalle, resultados).
- Registro e inicio de sesión de usuarios.
- Panel de administración (Django Admin) para cargar datos sin programar.
- Pruebas automáticas que verifican que todo funcione.

**Qué NO hace todavía (queda para la Entrega 3):**

- Guardar los votos de la gente.
- Impedir votos duplicados.
- Reglas de quién puede votar.
- Resultados oficiales (la página de resultados muestra 0 votos a propósito).

---

## 2. Tecnologías que usa y qué es cada una

| Tecnología | Versión | ¿Qué es? (explicación simple) |
|---|---|---|
| **Python** | 3.12 | El lenguaje de programación. Todo el "cerebro" está escrito en Python. |
| **Django** | 4.2.30 (LTS) | Un *framework* web: una colección de herramientas ya hechas (login, admin, base de datos) para no empezar de cero. "LTS" = soporte a largo plazo. |
| **PostgreSQL** | 17.4 | El *SGBD* (gestor de base de datos): el programa que **guarda** las ediciones, categorías, votaciones, opciones y usuarios en disco. |
| **psycopg2-binary** | 2.9.13 | El *conector*: la pieza que permite a Django hablar con PostgreSQL. Sin él, Django no puede consultar la base. |
| **python-dotenv** | 1.2.4 | Lee las variables de configuración (contraseñas, puertos) desde el archivo `.env`. |
| **HTML + CSS** | Bootstrap 5.3 + CSS propio | El lenguaje de las páginas web (HTML) y su apariencia (CSS). Django genera el HTML con *plantillas*. |
| **SQLite** | ❌ NO se usa | A veces aparece en el archivo `.gitignore` de cualquier proyecto Django por plantilla estándar, pero **este proyecto no lo usa**: la base es PostgreSQL. |

### ¿Por qué Django y no otro framework?

Django trae "de fábrica": un panel de administración gratis (`/admin/`), sistema de usuarios y contraseñas,
protección contra ataques (CSRF, inyección SQL), y un ORM para no escribir SQL a mano.
Para un proyecto universitario con jerarquía de datos y login, es la opción estándar.

---

## 3. Conceptos clave para principiantes

Si nunca has usado Django, lee esto **antes** de mirar código:

### 3.1 El patrón MVT (Modelo–Vista–Plantilla)

Es la forma en que Django separa el trabajo en3 piezas:

```
   ┌────────────┐      ┌────────────┐      ┌────────────┐
   │  MODELO    │      │   VISTA    │      │ PLANTILLA  │
   │ models.py  │ ───► │  views.py  │ ───► │  .html     │
   │ "qué datos │      │ "qué hacer │      │ "cómo se   │
   │  existen"  │      │  con ellos"│      │  ven"      │
   └─────┬──────┘      └────────────┘      └────────────┘
         │
         ▼
   PostgreSQL
```

- **Modelo** = una tabla de la base de datos descrita en Python. `Edicion`, `Categoria`, `Votacion`, `Opcion`.
- **Vista** = una función Python que recibe la petición del usuario, consulta los modelos y decide qué plantilla mostrar.
- **Plantilla** = un archivo HTML con "marcadores" que Django reemplaza con datos reales antes de enviarla al navegador.

### 3.2 ORM (Object-Relational Mapping)

Es la herramienta que **traduce Python ↔ SQL**. En vez de escribir `SELECT nombre FROM catalogo_categoria...`,
escribes Python:

```python
Categoria.objects.all()          # → SELECT * FROM catalogo_categoria;
Categoria.objects.filter(anio=2027)  # → SELECT ... WHERE anio = 2027
```

Cada objeto Python = una fila de la tabla. Por eso se dice que el ORM "mapea" objetos a tablas.

### 3.3 Migraciones

Son el "historial de cambios" de la base de datos:

- `python manage.py makemigrations` → Django **detecta** cambios en los modelos y **genera** un archivo de migración.
- `python manage.py migrate` → Django **ejecuta** los cambios reales en PostgreSQL (crear tablas, añadir columnas...).

Nunca edites la base a mano para cambios estructurales: se hacen en `models.py` + migraciones.

### 3.4 La tríada URL → Vista → Plantilla

Cuando escribes `http://127.0.0.1:8000/categorias/` en el navegador:

1. **URL** (`urls.py`): "esa dirección corresponde a la vista `lista_categorias`".
2. **Vista** (`views.py`): consulta la base de datos con el ORM.
3. **Plantilla** (`categorias.html`): se pinta con los datos y se devuelve al navegador como HTML.

### 3.5 Etiquetas de plantilla (tags)

En los `.html` de Django verás dos marcas:

```django
{{ categoria.nombre }}          {# variable: se reemplaza por su valor #}
{% if user.is_authenticated %}  {# etiqueta de lógica: condicionales, bucles... #}
{% for c in categorias %} ... {% endfor %}
{% static 'img/logo.png' %}     {# ruta a un archivo estático (CSS/JS/imagenes) #}
{% url 'catalogo:inicio' %}     {# la URL con nombre "inicio" del app "catalogo" #}
```

### 3.6 Apps

Django divide el proyecto en aplicaciones (`catalogo`, `cuentas`) para separar responsabilidades.
`config` es el "contenedor" que las une (ajustes y URLs raíz).

---

## 4. Estructura de carpetas

```
Pagina-web---Sistema-de-votaciones-main/
│
├── manage.py                  ⭐ Herramienta de consola de Django (comandos)
├── requirements.txt           ⭐ Lista de librerías a instalar (Django, psycopg2...)
├── .env                       🔒 Credenciales reales (NO se sube a Git)
├── .env.example               📋 Plantilla del .env para otros compañeros
├── README.md                  📋 Instrucciones de instalación y uso
│
├── config/                    📦 El "proyecto" (contenedor)
│   ├── settings.py            ⭐ Ajustes: base de datos, plantillas, idioma, etc.
│   ├── urls.py                ⭐ Mapa de URLs raíz (admin, cuentas, catálogo)
│   ├── wsgi.py / asgi.py      Cómo el servidor web lanza Django
│   └── __init__.py            Vacío (era el adaptador MySQL antes; ya no)
│
├── catalogo/                  📦 App1: el catálogo público
│   ├── models.py              ⭐ Las4 tablas: Edicion, Categoria, Votacion, Opcion
│   ├── views.py               ⭐ Las vistas: inicio, categorías, votaciones, detalle, resultados
│   ├── urls.py                ⭐ Las URLs de las páginas públicas
│   ├── admin.py               ⭐ Cómo se ve cada tabla en /admin/
│   ├── tests.py               ✅3 pruebas automáticas
│   ├── migrations/            📜 Historial de cambios de la base de datos
│   └── management/commands/
│       └── cargar_datos_prueba.py   🌱 Comando que carga datos demo
│
├── cuentas/                   📦 App2: usuarios
│   ├── forms.py               ⭐ Formularios de registro y login
│   ├── views.py               ⭐ Registro, login, logout, perfil
│   ├── urls.py                ⭐ /cuentas/registro, login, logout, perfil
│   └── tests.py               ✅2 pruebas de autenticación
│
├── templates/
│   └── react.html             ⭐ Entrada React con configuración segura del sitio
├── frontend/src/
│   ├── app/                   Cliente API, contexto, hooks, tema y utilidades
│   ├── components/            Componentes compartidos de React
│   ├── pages/                 Pantallas de catálogo y cuentas
│   ├── styles/                Estilos base e identidad visual
│   ├── tests/                 Pruebas de interfaz y setup de Vitest
│   └── main.jsx               ⭐ Entrada React y rutas
├── static/img/                Imágenes servidas por Django
├── prototipo_entrega1/        📐 HTML, CSS e imágenes históricas; no es la interfaz activa
├── docs/                      📚 Documentación y evidencias
└── .venv/                     🐍 Entorno virtual local (se ignora en Git)
```

⭐ = archivos que debes conocer sí o sí. 🔒 = nunca lo subas a GitHub.

---

## 5. Cómo funciona una petición

Ejemplo real: el usuario entra a **`http://127.0.0.1:8000/categorias/`**

```
Navegador ──HTTP GET /categorias/──► Django
   │
   │ 1. config/urls.py  →  ¿a qué app pertenece?  →  "categorías" no empieza con /admin/ ni /cuentas/
   │                        → path("", include("catalogo.urls"))  →  pasa a catalogo/urls.py
   │
   │ 2. catalogo/urls.py → path("categorias/", views.lista_categorias, name="categorias")
   │
   │ 3. catalogo/views.py → def lista_categorias(request):
   │                           categorias = Categoria.objects.all()   ← CONSULTA A POSTGRESQL (ORM)
   │                           return render(request, "catalogo/categorias.html", {...})
   │
   │ 4. templates/catalogo/categorias.html → usa los datos y hereda de templates/base.html
   │
   ▼
Navegador ◄──HTML completo (código 200)── Django
```

**Componentes de una vista** (línea por línea):

```python
def lista_categorias(request):                    # recibe la petición HTTP
    categorias = Categoria.objects.select_related("edicion").all()   # consulta (con JOIN a edición)
    return render(                               # devuelve una plantilla
        request,
        "catalogo/categorias.html",              # qué archivo .html usar
        {"categorias": categorias},              # qué datos mandarle (diccionario "contexto")
    )
```

---

## 6. La configuración

### `config/settings.py` — las secciones importantes

| Sección | Qué controla | Valor actual |
|---|---|---|
| `SECRET_KEY` | Clave secreta de seguridad | Desde `.env` |
| `DEBUG` | `True` = muestra errores detallados (solo en desarrollo) | `True` |
| `ALLOWED_HOSTS` | Dominios permitidos (evita ataques de cabecera Host) | `127.0.0.1, localhost` |
| `INSTALLED_APPS` | Apps activas | `catalogo`, `cuentas` + las de Django |
| `TEMPLATES DIRS` | Dónde buscar plantillas | `/templates` |
| `DATABASES` | **Conexión a PostgreSQL** | motor `postgresql`, puerto `5432` |
| `LANGUAGE_CODE` / `TIME_ZONE` | Idioma y zona horaria | `es-co` / `America/Bogota` |
| `STATICFILES_DIRS` | Dónde están los estáticos | `/static` |
| `LOGIN_URL` | A dónde redirige si no has iniciado sesión | `cuentas:login` |

### `.env` — variables de entorno (credenciales)

```
SECRET_KEY=django-dev-...-no-subir-al-repositorio
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

DB_NAME=votaciones_festival     ← nombre de la base
DB_USER=postgres                ← usuario de PostgreSQL
DB_PASSWORD=postgres            ← contraseña (solo desarrollo local)
DB_HOST=127.0.0.1               ← servidor (localhost = tu equipo)
DB_PORT=5432                    ← puerto estándar de PostgreSQL
```

**¿Por qué un `.env`?** Para que las contraseñas **no queden en el código** ni en Git.
`settings.py` las lee con `os.getenv("DB_USER", "postgres")` (el valor después de la coma es
el valor por defecto si falta la variable).

---

## 7. La base de datos PostgreSQL

### ¿Por qué PostgreSQL y no SQLite o MySQL?

- **SQLite** es un archivo local, no un servidor real: no sirve para apps con usuarios concurrentes en serio.
- **MySQL** fue lo primero que usó el proyecto (con XAMPP), pero se migró todo a **PostgreSQL** por decisión del equipo.
- Django habla con PostgreSQL mediante `psycopg2-binary` (instalado en `requirements.txt`).

### Conexión (en `settings.py`)

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",   # el motor
        "NAME": os.getenv("DB_NAME", "votaciones_festival"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}
```

### Las14 tablas que existen

**Tablas del proyecto** (creadas por `catalogo/models.py`):

| Tabla | Contenido | Reglas actuales |
|---|---|---|
| `catalogo_edicion` | Las ediciones del festival |1 fila: edición 2027 |
| `catalogo_categoria` | Categorías de una edición |4 filas (Rey Profesional/Afic./Infant./Juvenil) |
| `catalogo_votacion` | Votaciones dentro de una categoría |4 filas ("Rey X 2027") |
| `catalogo_opcion` | Candidatos de cada votación |12 filas (3 por votación) |

**Tablas de Django** (las genera Django solo, no las tocas):

- `auth_user` → usuarios (aquí está tu cuenta `admin`)
- `django_session`, `django_admin_log`, `django_migrations`, `django_content_type`, `auth_group*`, `auth_permission*`

### Relaciones (lo más importante de la base)

```
Edicion 1 ──────n Categoria 1 ──────n Votacion 1 ──────n Opcion
 (2027)           (Rey Profesional)    (Rey Prof. 2027)   (Opción A)
```

- **1 ─ n** = "uno a muchos": una Edición tiene muchas Categorías; una Categoría tiene muchas Votaciones; una Votación tiene muchas Opciones.
- En los modelos esto es un `ForeignKey`.
- `on_delete=models.CASCADE` = **borrado en cascada**: si borras la Edición 2027, se borran sus categorías, sus votaciones y sus opciones.

### ¿Cómo ver los datos?

- **Opción gráfica:** Menú Inicio → **pgAdmin 4** → Servers → Add Server (`127.0.0.1:5432`, usuario `postgres`, contraseña `postgres`) → `votaciones_festival` → Schemas → public → Tables.
- **Opción terminal:** conecta con `psql` usando las credenciales y el nombre de base configurados en `.env`:
  ```sql
  \dt                            -- lista tablas
  SELECT * FROM catalogo_categoria;
  \q                             -- salir
  ```

---

## 8. Los modelos

Archivo: **`catalogo/models.py`**. Cada clase = una tabla; cada atributo = una columna.

### `Edicion` — el festival de un año

```python
class Edicion(models.Model):
    nombre = models.CharField(max_length=150)      # texto corto (VARCHAR)
    anio = models.PositiveIntegerField(...)        # número entero positivo (2027)
    descripcion = models.TextField(blank=True)     # texto largo, opcional
    activa = models.BooleanField(default=True)     # ¿se muestra al público?
```

- `class Meta` → personaliza: nombre en español ("edición") y orden por defecto (`-anio` = descendente).
- `def __str__` → **qué se muestra** cuando Django necesite representar el objeto (en admin, en el shell). Aquí: `Festival de la Leyenda Vallenata (2027)`.

### `Categoria` — la categoría dentro de una edición

```python
edicion = models.ForeignKey(Edicion, on_delete=models.CASCADE, related_name="categorias")
```

- **`ForeignKey`** = relación "muchos a una": muchas categorías pertenecen a UNA edición.
- **`related_name="categorias"`** → te da el acceso inverso: `edicion.categorias.all()` (de la edición a sus categorías).

### `Votacion` — el proceso de votación

```python
categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name="votaciones")
titulo = models.CharField(max_length=200)         # "Rey Profesional 2027"
fecha_inicio / fecha_cierre = models.DateTimeField(null=True, blank=True)  # fechas opcionales
publicada = models.BooleanField(default=True)     # si está apagada, no se ve en la web
```

### `Opcion` — el candidato

```python
votacion = models.ForeignKey(Votacion, on_delete=models.CASCADE, related_name="opciones")
nombre = models.CharField(max_length=150)         # "Opción de prueba A"
activa = models.BooleanField(default=True)        # opción visible o no
```

### Campos que verás repetidos

| Tipo de campo | Qué es |
|---|---|
| `CharField(max_length=N)` | Texto corto (máximo N caracteres) |
| `TextField` | Texto largo (descripciones) |
| `PositiveIntegerField` | Entero ≥ 0 |
| `BooleanField` | Verdadero/Falso (checkbox) |
| `DateTimeField` | Fecha y hora |
| `ForeignKey` | Llave foránea (relación) |
| `blank=True` | El campo puede ir vacío en formularios |
| `null=True` | La columna puede ser NULL en la base |
| `default=...` | Valor inicial |

---

## 9. Las URLs

### Mapa completo del sitio (`config/urls.py`)

```python
urlpatterns = [
    path("admin/", admin.site.urls),           # panel de administración
    path("cuentas/", include("cuentas.urls")), # app de usuarios
    path("", include("catalogo.urls")),        # app del catálogo (raíz)
]
```

`include(...)` = "reparte las URLs que siguen en el archivo de esa app".

### URLs del catálogo (`catalogo/urls.py`)

| URL | Vista | Nombre | Qué muestra |
|---|---|---|---|
| `/` | `inicio` | `catalogo:inicio` | Página de inicio con tarjetas de categorías |
| `/categorias/` | `lista_categorias` | `catalogo:categorias` | Todas las categorías |
| `/votaciones/` | `lista_votaciones` | `catalogo:votaciones` | Votaciones publicadas (filtro `?categoria=N`) |
| `/votaciones/1/` | `detalle_votacion` | `catalogo:detalle` | Detalle con las opciones |
| `/resultados/` | `resultados` | `catalogo:resultados` | Tarjetas de resultados (0 votos aún) |

### URLs de cuentas (`cuentas/urls.py`)

| URL | Vista | Nombre |
|---|---|---|
| `/cuentas/registro/` | `registro` | `cuentas:registro` |
| `/cuentas/login/` | `InicioSesionView` | `cuentas:login` |
| `/cuentas/logout/` | `CierreSesionView` | `cuentas:logout` |
| `/cuentas/perfil/` | `perfil` | `cuentas:perfil` |

### ¿Qué es `app_name` y los dos-puntos?

En cada `urls.py` hay `app_name = "catalogo"`. Eso crea **namespaces** (espacios de nombre) para
que dos apps puedan tener URLs con el mismo nombre sin chocar. Por eso se referencia así:

```django
{% url 'catalogo:inicio' %}   {# app:nombre #}
reverse("catalogo:votaciones", args=[1])
```

**Ventaja importante:** si mañana cambias la URL de `/inicio/` a `/`, solo tocas `urls.py` y
**ninguna plantilla** se rompe, porque todas usan `{% url %}` (nunca escriben rutas a mano).

---

## 10. Las vistas

Archivo: **`catalogo/views.py`**

### `inicio(request)`
1. Busca la edición activa más reciente (`Edicion.objects.filter(activa=True).order_by("-anio").first()`).
2. Carga sus categorías (solo si hay edición).
3. Muestra `inicio.html` con esas categorías (que se pintan con fotos del prototipo).

### `lista_categorias(request)`
- Trae **todas** las categorías con su edición ya incluida (`select_related("edicion")` = evita consultas extra).

### `lista_votaciones(request)`
- Solo votaciones con `publicada=True`.
- Si la URL trae `?categoria=3`, filtra por esa categoría (y verifica que exista con `get_object_or_404`, que muestra error 404 elegante si no existe).

### `detalle_votacion(request, pk)`
- `pk` = identificador numérico de la votación en la base (`/votaciones/1/` → `pk=1`).
- `get_object_or_404(Votacion, pk=pk, publicada=True)` → si no existe o no está publicada, devuelve **página404** en vez de un error feo.
- Muestra solo opciones con `activa=True`.

### `resultados(request)`
- Lista las votaciones publicadas con sus opciones.
- **Siempre muestra0 votos** porque todavía no existe el modelo `Voto` (no es parte de esta entrega).

### `perfil(request)` (en `cuentas/views.py`)
- Decorador `@login_required` → si no has iniciado sesión, Django te manda al login automáticamente.
- Muestra los datos de la cuenta actual (`user` es una variable que Django pone en todas las plantillas autenticadas).

> **`select_related` vs `prefetch_related`:** el primero hace un JOIN en SQL (para FK directas);
> el segundo hace una consulta extra (para relaciones inversas como `votacion.opciones`). Ambos evitan el
> problema **N+1**: hacer1 consulta por fila en vez de unas pocas.

---

## 11. Las plantillas

### La madre: `templates/base.html`

Todas las páginas la heredan con `{% extends "base.html" %}`. Contiene:

- **Header**: logo (`logo.png` del prototipo) + título + botón Entrar/Salir.
- **Bloque de contenido**: `{% block content %}{% endblock %}` → aquí cada página mete su contenido.
- **Mensajes de Django**: avisos tipo "Cuenta creada" que se auto-ocultan a los4 segundos (`static/js/app.js`).
- **Footer** con los menús: Inicio · Categorías · Votaciones · **Resultados** · **Perfil** (+ Admin si eres staff, + Registro si no has entrado).
- Resalta el menú activo con `footer-item-activo` según la URL actual.

Ejemplo de herencia:

```django
{# templates/catalogo/inicio.html #}
{% extends "base.html" %}            {# hereda todo de base.html #}
{% block title %}Inicio{% endblock %} {# cambia el <title> #}
{% block content %}
    ...HTML propio...
{% endblock %}
```

### Las páginas del catálogo

| Plantilla | Qué muestra | Detalles |
|---|---|---|
| `catalogo/inicio.html` | Portada + tarjetas de categorías **con fotos** (`music.png`/`music2.png`,16:9) | Si no hay edición activa, avisa que hay que crearla en Admin |
| `catalogo/categorias.html` | Todas las categorías con su edición | Enlace a votaciones filtradas |
| `catalogo/votaciones.html` | Lista de votaciones publicadas | Botón "Ver detalle" a cada una |
| `catalogo/detalle.html` | Detalle de la votación + opciones **con foto** (`opcion-foto`,48px) | Muestra fechas si existen |
| `catalogo/resultados.html` | Tarjetas de resultados estilo prototipo | Puestos, barras y0%; aviso de que no hay votos aún |

### Las páginas de cuentas

| Plantilla | Qué muestra |
|---|---|
| `cuentas/login.html` | Formulario de inicio de sesión (hereda de `base.html`) |
| `cuentas/registro.html` | Formulario de registro con validaciones |
| `cuentas/perfil.html` | Datos de tu cuenta + botones (Admin, votaciones, cerrar sesión). Requiere login |

### El CSS de todo

`static/css/styles.css` es el CSS **completo del prototipo Entrega 1** (mismo archivo, ~2200 líneas),
más algunos estilos nuevos agregados al final (`.perfil-*` y `.nota-resultados`).
Por eso las páginas de Django se ven iguales al prototipo.

---

## 12. Archivos estáticos

Se sirven en `/static/...` y se referencian SIEMPRE con `{% static %}`:

```django
{% load static %}                          {# habilita la etiqueta en esta plantilla #}
<link rel="stylesheet" href="{% static 'css/styles.css' %}">
<img src="{% static 'img/logo.png' %}" alt="Logo">
```

| Archivo | Para qué sirve |
|---|---|
| `static/css/styles.css` | Toda la apariencia (header, tarjetas, barras, admin, perfil...) |
| `static/js/app.js` | Hace *fade-out* de los mensajes de Django a los4 segundos |
| `static/img/logo.png` | Logo real del festival (mismo PNG del prototipo) |
| `static/img/music.png`, `music2.png` | Fotos de las tarjetas de categorías y de las opciones |

> **Regla:** los archivos de `templates/` los procesa Django; los de `static/` van tal cual al navegador.

---

## 13. Autenticación

### Flujo de un usuario

```
Registro (/cuentas/registro/)  →  crea usuario en auth_user + inicia sesión automáticamente
Login (/cuentas/login/)        →  valida usuario y contraseña + crea sesión (cookie)
Perfil (/cuentas/perfil/)      →  @login_required: si no hay sesión → redirige al login
Logout (botón "Salir")         →  destruye la sesión
```

### Los formularios (`cuentas/forms.py`)

- **`RegistroForm`** → hereda de `UserCreationForm` (el de Django), que ya valida:
  - que el usuario no exista,
  - que la contraseña tenga8+ caracteres,
  - que las dos contraseñas coincidan,
  - y **hashea** la contraseña (nunca se guarda en texto plano; se guarda con PBKDF2,600,000 iteraciones).
  - Se le agregaron campos en español con estilos de Bootstrap (`class="form-control"`).
- **`LoginForm`** → personaliza las etiquetas del login estándar de Django.

### Elementos de seguridad del login

- **CSRF**: cada formulario lleva `{% csrf_token %}` → un token único que impide que otra página envíe formularios por ti.
- **Sesiones**: se guardan en la tabla `django_session` de PostgreSQL.
- **Contraseñas**: jamás se guardan claras; solo su *hash*.

### El usuario administrador

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin123` |
| Es superusuario | Sí → acceso total a `/admin/` |

> Las credenciales son **solo para desarrollo local**. Cambia la contraseña desde el admin antes de publicar.

---

## 14. Django Admin

Es el panel que Django genera **gratis** en `http://127.0.0.1:8000/admin/`.

### Qué hace `catalogo/admin.py`

```python
@admin.register(Edicion)
class EdicionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "anio", "activa")   # columnas de la lista
    list_filter = ("activa", "anio")              # filtros laterales
    search_fields = ("nombre",)                   # buscador
    inlines = [CategoriaInline]                   # ⭐ crea categorías DENTRO de la edición
```

Los **`inlines`** son lo mejor del admin aquí: al abrir una Edición ves una tabla para agregar sus
Categorías sin salir de la pantalla; igual de Categoría → Votaciones, y Votación → Opciones.
Eso permite cargar toda la jerarquía **sin tocar la base de datos a mano**.

### Cómo usarlo

1. Entra a `http://127.0.0.1:8000/admin/` con `admin` / `admin123`.
2. **Ediciones** → clic en "Festival de la Leyenda Vallenata" → abajo verás sus Categorías en línea.
3. Desde ahí puedes crear, editar y borrar todo (con confirmaciones de Django).

---

## 15. Comandos especiales

### `python manage.py cargar_datos_prueba`

Crea (o actualiza, sin duplicar) los datos demo:

-1 edición: "Festival de la Leyenda Vallenata" (2027, activa)
-4 categorías: Rey Profesional, Aficionado, Infantil, Juvenil
-4 votaciones: "Rey X 2027"
-12 opciones:3 "Opción de prueba" por votación

**¿Por qué `get_or_create`?** Si el dato ya existe lo reutiliza; por eso puedes correrlo
todas las veces que quieras sin duplicar filas.

### Comandos de base de datos

```powershell
python manage.py makemigrations   # detecta cambios en models.py → genera archivos en migrations/
python manage.py migrate          # aplica las migraciones a PostgreSQL
```

---

## 16. Las pruebas automáticas

Se corren con **`python manage.py test`**. Django crea una base temporal
(`test_votaciones_festival`), la llena, ejecuta todo y la borra: **tu base real no se toca**.

| Archivo | Prueba | Qué verifica |
|---|---|---|
| `catalogo/tests.py` | `test_relacion_edicion_categoria_votacion_opcion` | Las relaciones1-n funcionan en la base |
| | `test_inicio_muestra_datos_reales` | La página de inicio devuelve200 y muestra "Rey Profesional" |
| | `test_detalle_votacion_muestra_opciones` | El detalle muestra sus opciones |
| `cuentas/tests.py` | `test_registro_crea_usuario_e_inicia_sesion` | El registro crea el usuario y lo logea (302 = redirección = éxito) |
| | `test_login_con_usuario_existente` | El login con usuario existente funciona |

**Resultado actual:5/5 en verde (OK)** contra PostgreSQL.

**Anatomía de una prueba:**

```python
def test_inicio_muestra_datos_reales(self):
    respuesta = self.client.get(reverse("catalogo:inicio"))  # simula un navegador en "/"
    self.assertEqual(respuesta.status_code, 200)             # ¿respondió OK?
    self.assertContains(respuesta, "Rey Profesional")        # ¿el HTML contiene el dato?
```

> Nota técnica: el `setUp` crea datos de prueba en cada corrida; por eso las pruebas no dependen
> de lo que haya en tu base real.

---

## 17. Prototipo vs Django

El prototipo (`prototipo_entrega1/`) eran **archivos HTML estáticos** con datos falsos:
no había base de datos, ni usuarios, ni lógica. Era el "diseño".

| Prototipo (Entrega 1) | Django (Entrega 2) |
|---|---|
| `index.html` estático | `templates/catalogo/inicio.html` con datos reales |
| Datos falsos escritos en HTML | Datos desde PostgreSQL vía ORM |
| Menús `href="/templates/..."` rotos | `{% url 'catalogo:inicio' %}` con rutas reales |
| Login simulado (sin lógica) | Login real con sesiones y contraseñas hasheadas |
| Perfil/resultados con números inventados | Páginas reales (resultados muestra0 votos honestamente) |
| Imágenes en `/img/` | Imágenes en `/static/img/` con `{% static %}` |

**Las diferencias visuales que se corrigieron:** logo real (`logo.png`), fotos en las tarjetas del
inicio y en las opciones del detalle, y el menú inferior completo (Resultados y Perfil existen ahora).

---

## 18. Cheat sheet

```powershell
# ---------- ARRANQUE ----------
# Inicia PostgreSQL con el método correspondiente a tu sistema e instalación.
python manage.py runserver                      # arranca el sitio en http://127.0.0.1:8000/

# ---------- BASE DE DATOS ----------
python manage.py makemigrations                 # modela cambios de models.py
python manage.py migrate                        # los aplica a PostgreSQL
python manage.py cargar_datos_prueba            # carga datos demo (idempotente)
psql -U postgres -d votaciones_festival         # entrar a la base por terminal (pass: postgres)

# ---------- USUARIOS ----------
python manage.py createsuperuser                # crear otro usuario administrador

# ---------- CALIDAD ----------
python manage.py check                          # revisa que el proyecto esté sano
python manage.py test                           # corre las5 pruebas

# ---------- PÁGINAS ----------
/                    inicio
/categorias/         categorías
/votaciones/         votaciones
/votaciones/1/       detalle
/resultados/         resultados
/cuentas/login/      entrar
/cuentas/registro/   crear cuenta
/cuentas/perfil/     mi perfil
/admin/              administración
```

---

## 19. Ejecución y solución de problemas

### Puesta en marcha desde cero

```powershell
#1. Entorno virtual e instalación (solo la primera vez)
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

#2. PostgreSQL
# Inicia PostgreSQL con el método correspondiente a tu sistema e instalación.

#3. Base de datos (solo la primera vez)
#    createdb -U postgres votaciones_festival

#4. Migraciones y datos
python manage.py migrate
python manage.py cargar_datos_prueba
python manage.py createsuperuser   # (opcional) otro admin

#5. Arrancar
python manage.py runserver
```

### Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `could not connect to server` | PostgreSQL apagado o configuración incorrecta | Inicia PostgreSQL según tu instalación y revisa `DB_HOST` y `DB_PORT` en `.env` |
| `password authentication failed` | Contraseña equivocada | `.env` debe decir `DB_PASSWORD=postgres` |
| Página en blanco / datos vacíos | Base sin migrar o sin datos | `migrate` + `cargar_datos_prueba` |
| `Static file not found` | Falta copiar imagen a `static/img/` | Copiarla y referenciarla con `{% static %}` |
| `DisallowedHost 'testserver'` | Host no permitido (solo al usar el cliente de prueba fuera de `manage.py test`) | Agregar `testserver` a `ALLOWED_HOSTS` |
| Error404 en un detalle | El `pk` no existe o no está publicada | Es normal: `get_object_or_404` lo muestra a propósito |
| Puerto8000 ocupado | Otro servidor corriendo | `python manage.py runserver 8001` |
| `pg_ctl: another server might be running` | PostgreSQL ya estaba encendido | Es solo un aviso, no es un error |

---

## 20. Seguridad

| Regla | Por qué |
|---|---|
| **Nunca subas `.env` a Git** | Contiene la contraseña de la base. Por eso existe `.env.example` (sin valores reales) |
| `DEBUG=True` solo en desarrollo | En producción mostraría rutas internas y código a cualquiera |
| Contraseñas con hash (PBKDF2,600k iteraciones) | Aunque roben la base, no recuperan contraseñas claras |
| `{% csrf_token %}` en cada formulario | Evita ataques CSRF (otro sitio envía formularios por ti) |
| `SECRET_KEY` desde `.env` | Si se filtra, permite firmar cookies falsas |
| `ALLOWED_HOSTS` restringido | Evita el ataque "Host header injection" |
| Borrado en cascada (`CASCADE`) | Evita "huérfanos": filas sin padre que rompen consultas |

**Para publicar** (futuro): `DEBUG=False`, `SECRET_KEY` fuerte, `ALLOWED_HOSTS` con tu dominio,
contraseñas distintas de `postgres` y HTTPS.

---

## 21. Glosario

| Término | Significado |
|---|---|
| **Framework** | Conjunto de herramientas reutilizables para construir software (Django es un framework web) |
| **MVT** | Modelo–Vista–Plantilla: patrón de arquitectura de Django |
| **Modelo** | Clase Python que representa una tabla de la base de datos |
| **Vista** | Función que atiende una URL y decide qué responder |
| **Plantilla** | Archivo HTML con marcadores que Django rellena con datos |
| **ORM** | Capa que traduce código Python a consultas SQL |
| **Migración** | Archivo con pasos para transformar la base de datos |
| **`pk`** | *Primary Key*: identificador único de cada fila (aquí, un entero) |
| **`ForeignKey`** | Campo que crea una relación "muchos a uno" entre tablas |
| **`related_name`** | Nombre del acceso inverso (`edicion.categorias`) |
| **`CASCADE`** | Borrado en cascada: borras el padre y se borran los hijos |
| **Contexto** | El diccionario de datos que la vista le pasa a la plantilla |
| **`reverse()` / `{% url %}`** | Obtener la URL de un nombre, en vez de escribirla a mano |
| **Namespace (`app_name`)** | Prefijo que evita choques de nombres entre apps |
| **Estático** | Archivo que va tal cual al navegador (CSS, JS, imágenes) |
| **Hash** | Huella irreversible de la contraseña (no se puede "deshacer") |
| **CSRF** | Ataque donde otra página envía formularios usando tu sesión; se previene con el token |
| **Superusuario** | Usuario con permisos totales en el admin |
| **`@login_required`** | Decorador que exige sesión para ver una vista |
| **Debug** | Modo de desarrollo con errores detallados (nunca en producción) |
| **LTS** | *Long Term Support*: versión de Django con soporte extendido |
| **Shell de Django** | Consola Python con el proyecto cargado (`manage.py shell`) |
| **Endpoint** | Una URL que responde algo (`/api/votaciones/` es un endpoint) |

---

## 22. Qué falta

Pendientes definidos para la **Entrega 3** (cuando el cliente los valide):

1. **Modelo `Voto`**: registrar el voto real (usuario + opción + fecha).
2. **Voto único**: impedir que un usuario vote dos veces en la misma votación.
3. **Reglas de elegibilidad**: quién puede votar (cédula, etc. — pendiente de confirmación).
4. **Resultados reales**: la página `/resultados/` ya existe; solo hay que alimentarla con los votos reales.
5. **Despliegue**: publicar en un servidor real con HTTPS y `DEBUG=False`.

---

### 📌 Resumen en una frase

> **Django** recibe una URL → una **vista** consulta **PostgreSQL** mediante el **ORM** (modelos) →
> los datos se pintan en una **plantilla** (heredada de `base.html`) → el navegador muestra la página;
> el **admin** permite gestionar todo sin programar, y las **pruebas** verifican que nada se rompa.

*Documento generado automáticamente a partir del código real del proyecto (código verificado con5/5 pruebas en verde).*
