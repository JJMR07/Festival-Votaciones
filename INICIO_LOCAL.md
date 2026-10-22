# Ejecutar en este equipo

El entorno local ya tiene Python 3.12.10, `.venv` con las dependencias de
`requirements.txt` y PostgreSQL 17.11 en `.local/pgsql`. La base
`votaciones_festival` tiene sus migraciones aplicadas y datos de ejemplo.
La interfaz pública usa React. Node.js 24 y pnpm están preparados en `.local`.

## Iniciar

Haz doble clic en `iniciar.cmd` o ejecuta desde la terminal de VS Code:

```powershell
.\iniciar.cmd
```

Abre <http://127.0.0.1:8000/>. PostgreSQL arranca automaticamente si hace
falta. Deten Django con Ctrl+C. La base permanece encendida para otros
arranques; despues de reiniciar Windows, el mismo comando la inicia otra vez.
También aplica migraciones y compila React si cambiaste sus fuentes.

El administrador esta en <http://127.0.0.1:8000/admin/>. Su usuario y
contrasena estan en `.local/ACCESO_LOCAL.txt`. Puedes cambiar la contrasena
desde Django Admin. La conexion a PostgreSQL esta configurada en `.env`.
Ambos archivos estan excluidos de Git.

## Personalizar el sitio

En Administración → Configuración del sitio puedes cambiar nombres de marca,
imágenes, colores y textos de la interfaz. Expande «Textos de la interfaz» para
editar títulos, botones y mensajes mediante campos normales.

Ediciones, categorías, votaciones y opciones tienen sus propios nombres,
descripciones, imágenes, orden y visibilidad. Se admiten múltiples ediciones.
Guardar y volver al sitio público actualiza los datos sin recompilar React.

## VS Code y comprobaciones

Se configuro `.vscode/settings.json` para usar `.venv/Scripts/python.exe`.
Si VS Code conserva otro interprete, selecciona este con **Python: Select Interpreter**.
No necesitas activar el entorno virtual para estos comandos:

```powershell
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py test
```

## Detener PostgreSQL

Primero deten Django y luego, desde la carpeta del proyecto:

```powershell
.\.local\pgsql\bin\pg_ctl.exe stop -D .local/pgdata -m fast -w
```

Los datos persistentes estan en `.local/pgdata`: no borres esa carpeta.
La preparacion corresponde a este equipo; `.local`, `.venv` y `.env` no
se distribuyen con Git. El registro de votos sigue pendiente de implementacion.
