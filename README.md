# Sistema web de votaciones — Festival de la Leyenda Vallenata 2027

Proyecto universitario de Desarrollo Web (Fundación Universitaria del Área Andina).  
**Entrega 2:** proyecto Django ejecutable, modelos relacionados en PostgreSQL, autenticación y consulta pública.

Estructura de negocio: **Edición → Categoría → Votación → Opción**.  
El registro definitivo de votos, duplicados, elegibilidad, resultados finales y despliegue **no** forman parte de esta entrega.

## Inicio rápido (Windows)

**Doble clic a `iniciar_proyecto.bat`.** Ese archivo:

1. Enciende PostgreSQL (si estaba apagado).
2. Activa el entorno virtual.
3. Enciende el servidor y abre <http://127.0.0.1:8000/> en el navegador.

Para **apagarlo**: presione `Ctrl + C` en la ventana negra (o ciérrela).

> Si ya tenía PostgreSQL encendido no pasa nada: el script lo detecta y lo reutiliza.
> Si prefiere hacerlo a mano, vea las secciones 1–3 más abajo.

## Requisitos

- Windows 10 (también funciona en otros sistemas con Python y PostgreSQL)
- Python 3.12
- PostgreSQL 12 o superior (en este equipo se instaló **PostgreSQL 17** con Scoop: `scoop install postgresql`)
- Django **4.2 LTS** (fijado en `requirements.txt`)

## 1. Entorno virtual

En la carpeta del proyecto:

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Resultado esperado: el prompt muestra `(venv)` y se instalan Django, psycopg2-binary y python-dotenv.

## 2. PostgreSQL

1. Inicia el servidor de bases de datos (Scoop agrega `pg_ctl` al PATH):

```powershell
pg_ctl start
```

2. Crea la base de datos (el superusuario por defecto es `postgres`; te pedirá la contraseña):

```powershell
createdb -U postgres votaciones_festival
```

3. (Opcional) Para que PostgreSQL arranque junto con Windows, registra el servicio desde una consola elevada:

```powershell
pg_ctl register -N PostgreSQL
```

Resultado esperado: la base `votaciones_festival` aparece al listar bases de datos (`psql -U postgres -c "\l"`).

Para detener el servidor: `pg_ctl stop`.

## 3. Variables de entorno

Copia `.env.example` a `.env` (este último **no** se sube al repositorio):

```powershell
Copy-Item .env.example .env
```

Edita `.env` con tu usuario, contraseña y puerto de PostgreSQL (valores por defecto del proyecto: `postgres` / `postgres` / `5432`). Nunca pegues esas credenciales en el PDF ni en GitHub.

## 4. Migraciones

```powershell
python manage.py makemigrations
python manage.py migrate
```

Resultado esperado: tablas de Django (usuarios, sesiones, admin) y tablas `catalogo_edicion`, `catalogo_categoria`, `catalogo_votacion`, `catalogo_opcion` creadas en PostgreSQL.

## 5. Administrador y datos de prueba

```powershell
python manage.py createsuperuser
python manage.py cargar_datos_prueba
```

Resultado esperado: puedes entrar a `http://127.0.0.1:8000/admin/` y ver una edición 2027, cuatro categorías, votaciones y opciones de demostración.

## 6. Servidor de desarrollo

```powershell
python manage.py runserver
```

- Pública: http://127.0.0.1:8000/
- Categorías: http://127.0.0.1:8000/categorias/
- Votaciones: http://127.0.0.1:8000/votaciones/
- Registro: http://127.0.0.1:8000/cuentas/registro/
- Login: http://127.0.0.1:8000/cuentas/login/
- Admin: http://127.0.0.1:8000/admin/

## 7. Pruebas

```powershell
python manage.py test
```

Resultado esperado: pruebas de modelos, páginas públicas y autenticación en verde.

## Estructura Django (MVT)

| Pieza | Dónde está | Para qué sirve |
| --- | --- | --- |
| Modelo | `catalogo/models.py` | Tablas y relaciones en PostgreSQL |
| Vista | `catalogo/views.py`, `cuentas/views.py` | Lógica: consultar datos o autenticar |
| Plantilla | `templates/` | HTML responsive (prototipo + Bootstrap) |
| Rutas | `config/urls.py`, `catalogo/urls.py`, `cuentas/urls.py` | URLs |
| Admin | `catalogo/admin.py` | CRUD de ediciones, categorías, votaciones y opciones |
| Estáticos | `static/css/styles.css`, `static/js/app.js` | CSS del prototipo y un JS mínimo |

El prototipo HTML de la Entrega 1 quedó en `prototipo_entrega1/` como referencia visual.

## Qué no incluye esta entrega

- Guardar votos
- Impedir votos duplicados
- Reglas de quién puede votar
- Resultados oficiales
- Auditoría y despliegue en un servidor público
