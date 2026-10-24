# Festival · Catálogo configurable

Aplicación con **React 19 + Vite**, **Django 5.2 LTS** y
**PostgreSQL**. La interfaz pública anterior fue reemplazada por React;
Django conserva las rutas, la plantilla de entrada, autenticación, ORM y Admin.

## Ejecutar en este equipo

```powershell
.\iniciar.cmd
```

Abre <http://127.0.0.1:8000/>. El comando inicia PostgreSQL local cuando sea
necesario, aplica migraciones y compila React si falta el build o cambiaron
las fuentes. Ctrl+C detiene el servidor Django.

- Entorno Python: `.venv`.
- PostgreSQL: `.local/pgsql`; datos persistentes en `.local/pgdata`.
- Node.js 24 y pnpm 11.25.0 locales en `.local/node` y `.local/tools`.
- Credenciales del administrador local: `.local/ACCESO_LOCAL.txt`.
- Configuración de conexión: `.env`.
- Estos archivos locales están excluidos de Git. No borres `pgdata`: contiene tus datos.

## Configurar todo el contenido sin programar

La apariencia sigue la referencia visual de [festivalvallenato.com](https://festivalvallenato.com/):
Poppins en textos y navegación, Raleway en títulos, cabecera y pie negros,
rojo institucional y acentos dorados. Las fuentes se sirven localmente.
El botón redondo de la cabecera alterna entre **Claro** y **Oscuro**:
el sol permite activar el modo claro y la luna activar el oscuro.
La elección se conserva en el navegador; antes de elegir se respeta la
preferencia del sistema operativo. Los formularios, filtros, tarjetas y perfil
también cambian de tema. Los colores siguen siendo editables desde Admin.

Entra a <http://127.0.0.1:8000/admin/> con tu usuario administrador.

| Sección | Qué puedes editar |
| --- | --- |
| Configuración del sitio | Nombre, nombre corto, subtítulo, logo, portada, imagen de respaldo, colores y registro de cuentas |
| Configuración → Textos de la interfaz | Títulos, descripciones, menús, botones, mensajes y pie de página, mediante campos de texto normales |
| Ediciones | Nombre, año, descripción, imagen, orden y visibilidad |
| Categorías | Nombre, descripción, edición, imagen, orden y publicación |
| Votaciones | Título, descripción, categoría, fechas, imagen, orden y publicación |
| Opciones | Nombre del participante, descripción, votación, imagen, orden y visibilidad |

Puedes subir imágenes desde Admin para ediciones, categorías, votaciones,
participantes, logo, portada e imagen de respaldo. Se admiten JPG, PNG y WebP
de hasta **5 MB y 4096 píxeles por lado**. Se valida que el archivo sea una imagen
real y se muestra una vista previa antes de guardar. Los archivos se conservan
en `media/`, excluido de Git, y Django los sirve localmente bajo `/media/`.

También se conservan las URL `https://` y las rutas de archivos existentes en
`/static/`. El archivo subido tiene prioridad; al marcar **Limpiar** y guardar,
se vuelve a usar la URL. Una imagen vacía utiliza la imagen de respaldo del sitio.
No se admiten HTML ni scripts como contenido. Los colores aceptan `#RRGGBB`;
elige un primario oscuro que mantenga contraste con el texto blanco.

Los textos de la interfaz se agrupan en navegación y apariencia, inicio y
catálogo, cuentas y contraseñas, y mensajes y accesibilidad. Los listados del
Admin incluyen miniaturas y las acciones **Publicar / mostrar seleccionados**
y **Ocultar seleccionados**, con registro de cambios del administrador.

Al guardar, vuelve al sitio público: al recuperar el foco se actualizan
configuración, sesión y catálogo. Recargar también obtiene los cambios.
No hace falta reiniciar Django ni recompilar React para editar contenido.

`orden` menor aparece primero. Los empates se resuelven por nombre y clave
primaria. Ocultar una edición oculta sus categorías, votaciones y participantes;
ocultar una categoría también oculta sus votaciones. La API y React aplican la
misma política, incluso al abrir una URL de detalle directamente.

La estructura de pantallas y las reglas de negocio son código: configurabilidad
significa editar contenido, identidad y publicación, no ejecutar código arbitrario
desde la base de datos. Cambiar estas reglas sigue requiriendo desarrollo y pruebas.

## Funcionalidades incluidas

- Catálogo de múltiples ediciones y categorías, con filtros y búsqueda.
- Listados y participantes paginados; carga por demanda de opciones de filtros.
- Registro, login, logout y perfil editable mediante sesiones reales de Django.
- Cambio de contraseña desde el perfil y recuperación desde el login mediante
  un enlace de un solo uso, válido durante una hora.
- Protección CSRF, validación de contraseñas y permisos del administrador.
- Estados de fecha calculados: publicado, próximo, en periodo y finalizado.
- Diseño responsivo, navegación móvil, estados de carga, vacío y error.
- Tipografías, CSS, JavaScript e imágenes predeterminadas servidos localmente.
- Pantallas cargadas por demanda, consultas públicas compartidas durante 30 segundos
  y loader de navegación que respeta la preferencia de movimiento reducido.

### Recuperar contraseñas en este equipo

En el login, pulsa **¿Olvidaste tu contraseña?** e introduce un correo registrado.
En esta instalación los mensajes se guardan como archivos en `.local/correos/`;
no se envían a un buzón externo. Abre el último archivo y copia su enlace al
navegador para elegir una contraseña nueva. Para cambiar una contraseña conocida,
entra al perfil y selecciona **Cambiar contraseña**.

Los errores de contraseña se validan en Django. Cambiar la contraseña desde el
perfil conserva la sesión actual. La recuperación no inicia sesión automáticamente
y un enlace usado o vencido permite solicitar otro.

No se registran votos ni se inventan resultados. La página de resultados informa
el alcance y enlaza los procesos publicados. Votos, elegibilidad, auditoría y
despliegue productivo quedan fuera de esta segunda fase.

## Instalar desde un clon nuevo

Requisitos: Python 3.12, PostgreSQL 14 o posterior (probado con 17.11),
Node.js 24 LTS y pnpm 11.25.0. Si no tienes pnpm, `npm install -g pnpm@11.25.0`.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edita `.env` con tu propia clave y conexión. No uses los valores de ejemplo
como credenciales compartidas. Crea la base una sola vez con PostgreSQL iniciado:

```powershell
createdb -U postgres votaciones_festival
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py cargar_datos_prueba
cd frontend
pnpm install --frozen-lockfile
pnpm run build
cd ..
.\.venv\Scripts\python.exe manage.py runserver
```

`iniciar.cmd` corresponde a la instalación portátil preparada en este equipo.
En otro equipo con PostgreSQL instalado como servicio, usa el arranque manual
anterior; no necesitas copiar las carpetas `.local` o `.venv`.

Los ejemplos son opcionales. Para demostrar otra edición:

```powershell
.\.venv\Scripts\python.exe manage.py cargar_datos_prueba --anio 2026 --nombre "Festival de la Leyenda Vallenata"
```

El comando no sobrescribe ni reactiva los registros existentes. Si cambias sus
nombres y vuelves a ejecutarlo puede crear nuevos ejemplos con los nombres
iniciales; no lo uses como proceso de sincronización del contenido real.

## Desarrollar React

Para compilar manualmente en este equipo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/compilar-frontend.ps1
```

Para recarga rápida, mantén Django en el puerto 8000 y ejecuta `pnpm dev` en
`frontend/`; abre <http://127.0.0.1:5173/>. Vite reenvía `/api`, `/admin` y
`/static` a Django, sin habilitar CORS abierto. En este equipo puedes ejecutar
pnpm con `.local/tools/pnpm.cmd` desde la raíz usando `--dir frontend`.

El frontend compilado se sirve desde el mismo origen de Django. El manifiesto
de Vite conecta `templates/react.html` con archivos que tienen hash de contenido.
`static/frontend/` se genera y está excluido de Git: compílalo en cada instalación.

## Arquitectura y crecimiento

```text
config/                 Configuración Django, URLs y entrada MVT/manifest Vite
catalogo/               Modelos, reglas, API y Admin del catálogo
cuentas/                Autenticación, perfil y API de cuentas
templates/react.html    Plantilla Django con configuración JSON escapada
frontend/src/
  app/                  Cliente HTTP, contexto, hooks, tema y utilidades
  components/           Componentes React compartidos
  pages/                Pantallas de catálogo, votaciones y cuentas
  styles/               Estilos base e identidad visual
  tests/                Pruebas de interfaz y configuración de Vitest
  main.jsx              Punto de entrada React y definición de rutas
static/img/             Imágenes de la aplicación Django/React
prototipo_entrega1/     Prototipo histórico completo (HTML, CSS e imágenes)
scripts/                Arranque local y compilación de React
docs/                   Guías, entregas y evidencias
```

La API está versionada en `/api/v1/`. Los listados tienen 12 elementos por
defecto y un máximo de 48 por página. Las opciones de una votación se paginan
de 12 en 12. Hay índices para relaciones y publicación, orden determinista,
conteos en SQL y `select_related` para evitar una consulta por tarjeta.
Una prueba verifica que aumentar el número de votaciones no aumenta el número
de consultas del listado. Esto prepara el crecimiento del catálogo; no equivale
a una prueba de carga ni a un despliegue de producción.

Rutas públicas: `/`, `/ediciones/`, `/categorias/`, `/votaciones/`,
`/votaciones/<id>/`, `/resultados/`, `/cuentas/registro/`, `/cuentas/login/`,
`/cuentas/perfil/` y `/admin/`.

Ejemplo de API: `/api/v1/votaciones/?edicion=1&categoria=2&q=Rey&pagina=1&limite=12`.
La API pública es de lectura. La escritura del catálogo requiere permisos en Admin.

## Verificar

Con PostgreSQL iniciado:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv\Scripts\python.exe manage.py test --noinput
.\.venv\Scripts\python.exe -m pip check
cd frontend
pnpm test
pnpm run build
```

El usuario de PostgreSQL necesita permiso para crear la base temporal de pruebas.
Las pruebas no usan ni eliminan los datos del catálogo principal.

El workflow `.github/workflows/checks.yml` ejecuta las pruebas de Python y React,
la compilación, la comprobación de migraciones y los recorridos Playwright en
cada pull request y en los pushes a `main`. Usa PostgreSQL de prueba y no despliega
la aplicación. Se ejecutará en GitHub cuando estos archivos se suban al repositorio.

### Recorridos de navegador y accesibilidad

Las fichas de participantes muestran la imagen y descripción guardadas en Admin.
Se abren con teclado, se cierran con Escape y devuelven el foco al botón de origen.
Al regresar de una votación se conservan búsqueda, filtros y página del listado.
Los nuevos mensajes de navegación, fichas, resultados y errores se editan también
en **Configuración del sitio → Textos de la interfaz**.

Después de compilar React, ejecuta desde `frontend/`:

```powershell
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright inicia Django en `127.0.0.1:8011` con una base SQLite temporal y datos
de prueba. No conecta con PostgreSQL ni modifica el catálogo o las cuentas locales.
El puerto 8011 debe estar libre. La instalación de Python debe tener los requisitos
del proyecto y el build de React debe estar actualizado antes de ejecutar la suite.

Los recorridos cubren registro, login válido e inválido, edición persistente del
perfil, cambio y recuperación de contraseña leyendo el correo local de prueba,
logout, filtros, detalle, ficha de participante y regreso al listado. También
comprueban una subida real desde Admin, su vista previa y la imagen servida al catálogo.
También comprueban recuperación ante un error de servicio, estados de carga,
desbordamiento horizontal y espacio del menú móvil. Se ejecutan en Chromium
con tamaños de escritorio y móvil, incluido un ancho de 320 px.
Las comprobaciones automáticas con axe cubren páginas del catálogo y formularios
en los temas claro y oscuro; complementan la revisión manual de accesibilidad.
Capturas y trazas se guardan en `frontend/test-results/`, excluido de Git.


Para un despliegue público se requiere configurar HTTPS, `DEBUG=False`, secretos,
hosts, servidor WSGI/ASGI, estáticos con `collectstatic`, copias de seguridad y
controles operativos. El servidor `runserver` es únicamente de desarrollo.
