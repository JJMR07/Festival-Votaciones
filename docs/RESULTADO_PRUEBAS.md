# Descripción y resultados de las pruebas

Verificación realizada el **21 de octubre de 2026**, en el entorno local con PostgreSQL.

| Grupo | Ejecutadas | Satisfactorias | Fallidas | Omitidas |
| --- | ---: | ---: | ---: | ---: |
| Backend (Django) | 31 | 31 | 0 | 0 |
| Frontend (Vitest) | 13 | 13 | 0 | 0 |
| **Total** | **44** | **44** | **0** | **0** |

El estado corresponde a esta ejecución. Los resultados deben actualizarse después de cambios que afecten los comportamientos probados. Estas son pruebas automáticas de casos concretos; no equivalen a pruebas de carga ni a una garantía de ausencia de errores. Las pruebas del frontend utilizan respuestas simuladas de la API.

## Backend: catálogo

Archivo: `catalogo/tests.py`, clase `CatalogoTests`.

| Prueba | Descripción de lo verificado | Estado |
| --- | --- | --- |
| `test_relaciones` | La votación pertenece a una categoría y edición, y sus opciones se relacionan correctamente. | Satisfactoria |
| `test_nombres_editados_se_reflejan_en_api` | Los cambios de nombre de categoría, votación y participante aparecen en la respuesta de la API. | Satisfactoria |
| `test_interfaz_react_con_configuracion_de_postgresql` | Las rutas principales responden correctamente y utilizan la plantilla de entrada de React con sus datos iniciales. | Satisfactoria |
| `test_ediciones_sin_limitar_a_un_anio` | El catálogo permite consultar ediciones de diferentes años. | Satisfactoria |
| `test_ocultar_edicion_oculta_toda_la_jerarquia` | Desactivar una edición oculta sus categorías y votaciones e impide abrir directamente el detalle de una votación. | Satisfactoria |
| `test_ocultar_categoria_oculta_votaciones` | Una categoría no publicada y sus votaciones no aparecen en los listados ni en el conteo público de categorías. | Satisfactoria |
| `test_votaciones_y_opciones_no_publicadas_no_se_filtran` | Las opciones inactivas no aparecen en el detalle ni en sus conteos, y las votaciones no publicadas no se pueden consultar. | Satisfactoria |
| `test_filtros_busqueda_y_paginacion` | La búsqueda y el filtro de categoría se combinan correctamente con la paginación; una edición inexistente no devuelve categorías. | Satisfactoria |
| `test_orden_configurable` | El listado de categorías respeta el orden configurado. | Satisfactoria |
| `test_paginacion_de_participantes` | El detalle divide los participantes en páginas y mantiene el total correcto. | Satisfactoria |
| `test_parametros_invalidos` | Los parámetros de consulta inválidos generan un error 400 y una página inexistente genera un error 404. | Satisfactoria |
| `test_estados_dependen_de_fechas` | El estado de una votación corresponde a sus fechas: sin fecha, programada, abierta o cerrada. | Satisfactoria |
| `test_fechas_incoherentes_rechazadas_en_modelo_y_base` | Una fecha de cierre anterior al inicio es rechazada tanto por la validación del modelo como por la restricción de la base de datos. | Satisfactoria |
| `test_consultas_no_crecen_por_cada_votacion` | Al agregar 30 votaciones, la cantidad de consultas del listado se mantiene igual y no supera tres. | Satisfactoria |
| `test_api_catalogo_solo_lectura` | Los endpoints públicos de catálogo y configuración rechazan solicitudes POST con estado 405. | Satisfactoria |
| `test_datos_demo_idempotentes_no_reactivan_edicion` | Repetir la carga de ejemplos no reactiva una edición ocultada ni duplica sus cuatro categorías. | Satisfactoria |

## Backend: configuración y administración

Archivo: `catalogo/tests.py`, clase `ConfiguracionTests`.

| Prueba | Descripción de lo verificado | Estado |
| --- | --- | --- |
| `test_cambiar_marca_y_textos_sin_recompilar` | El nombre y los textos editados llegan a la API y la página inicial refleja el nombre; los textos no personalizados conservan sus valores predeterminados. | Satisfactoria |
| `test_json_seguro_en_plantilla` | Un texto que intenta cerrar el bloque de script no se inserta literalmente en la plantilla como código ejecutable. | Satisfactoria |
| `test_validadores_de_configuracion` | Se rechazan colores, direcciones de imagen y estructuras o valores de textos inválidos en los casos probados. | Satisfactoria |
| `test_get_sin_configuracion_no_escribe_datos` | Consultar la configuración cuando no existe un registro responde correctamente sin crear datos en la base. | Satisfactoria |
| `test_admin_exige_autorizacion` | Un visitante y un usuario común son redirigidos al intentar acceder a las páginas administrativas probadas. | Satisfactoria |
| `test_admin_puede_cambiar_nombre_y_configuracion` | Un superusuario accede a la configuración y puede guardar el cambio de nombre de una edición desde Admin. | Satisfactoria |

## Backend: cuentas y autenticación

Archivo: `cuentas/tests.py`, clase `CuentasTests`.

| Prueba | Descripción de lo verificado | Estado |
| --- | --- | --- |
| `test_registro_persistencia_y_sesion` | El registro crea el usuario, guarda una contraseña verificable, inicia sesión y devuelve un token CSRF sin exponer la contraseña. | Satisfactoria |
| `test_login_logout_reales` | Se rechazan credenciales incorrectas, se aceptan las correctas y el cierre de sesión deja al usuario sin autenticar. | Satisfactoria |
| `test_registro_desactivado_por_admin` | Deshabilitar el registro impide crear cuentas y devuelve un error 403. | Satisfactoria |
| `test_registro_invalido_no_crea_usuario` | Las contraseñas que no coinciden producen un error de validación y no crean la cuenta. | Satisfactoria |
| `test_usuario_duplicado` | Intentar registrar otra cuenta con el mismo nombre de usuario se rechaza sin duplicar el registro. | Satisfactoria |
| `test_perfil_solo_edita_campos_permitidos` | El perfil requiere sesión, permite editar el nombre y no concede privilegios administrativos mediante el campo `is_staff`. | Satisfactoria |
| `test_json_invalido` | Las solicitudes de inicio de sesión con JSON mal formado o tipos no admitidos se rechazan con estado 400. | Satisfactoria |
| `test_csrf_en_todas_las_escrituras_y_rotacion` | Registro, login, logout y perfil rechazan solicitudes sin token CSRF; el registro válido renueva el token y permite cerrar sesión con el nuevo. | Satisfactoria |
| `test_no_cerrar_sesion_con_get` | Las rutas de cierre de sesión rechazan solicitudes GET con estado 405. | Satisfactoria |

## Frontend: interfaz y cliente de API

Archivo: `frontend/src/tests/app.test.jsx`. Los identificadores siguientes corresponden a los nombres declarados en `it(...)`.

| Prueba | Descripción de lo verificado | Estado |
| --- | --- | --- |
| muestra nombres y enlaces recibidos del backend sin títulos fijos | Una tarjeta presenta el título, categoría, cantidad de participantes y enlace de detalle según los datos recibidos. | Satisfactoria |
| muestra el aviso informativo y no ofrece emitir votos | El aviso indica que el voto no está habilitado y no presenta un botón para votar. | Satisfactoria |
| permite reintentar ante un error de red | El botón de reintento ejecuta la función de recuperación cuando se presenta un error. | Satisfactoria |
| la búsqueda conserva filtros y reinicia la paginación | Buscar agrega el texto de consulta, mantiene la edición seleccionada y elimina la página anterior. | Satisfactoria |
| envía login a Django y muestra sus errores reales | El formulario envía usuario, contraseña y token CSRF al endpoint de login y muestra el mensaje de error devuelto en la respuesta simulada. | Satisfactoria |
| renueva el token CSRF después de autenticar | El cliente utiliza el token nuevo en la siguiente solicitud y mantiene las credenciales en el mismo origen. | Satisfactoria |
| gestiona respuestas no JSON sin perder el estado HTTP | Si el servidor devuelve una respuesta de error que no es JSON, el cliente conserva el código HTTP 403. | Satisfactoria |

## Frontend: modo claro y oscuro

Archivo: `frontend/src/tests/theme.test.jsx`.

| Prueba | Descripción de lo verificado | Estado |
| --- | --- | --- |
| usa la preferencia del sistema cuando no hay elección guardada | Sin una elección previa, el tema sigue la preferencia oscura del sistema y actualiza el documento. | Satisfactoria |
| conserva el modo elegido después de volver a montar la aplicación | El modo seleccionado se almacena, se recupera al montar nuevamente y permite cambiar después al modo claro. | Satisfactoria |
| reacciona a cambios del sistema sólo en modo automático | El tema sigue los cambios del sistema en modo automático y respeta una elección manual. | Satisfactoria |
| sincroniza el tema elegido en otra pestaña | Un evento de cambio del almacenamiento actualiza el tema de la pestaña. | Satisfactoria |
| tolera preferencias inválidas y almacenamiento bloqueado | Una preferencia guardada inválida utiliza el modo automático; el cambio manual funciona aunque falle el almacenamiento y descarta selecciones inválidas. | Satisfactoria |
| aplica el mismo modo antes de cargar React, incluso sin acceso a almacenamiento | El script inicial aplica el tema y `colorScheme` esperado según la preferencia guardada y el sistema; también funciona cuando no puede leer el almacenamiento. | Satisfactoria |

## Ejecución utilizada

Desde la raíz del proyecto, con PostgreSQL iniciado:

```powershell
.\.venv\Scripts\python.exe manage.py test --verbosity 2 --noinput
```

Resultado: **31 pruebas satisfactorias**, salida `OK`, código de salida 0. Django creó y eliminó la base temporal de pruebas.

Para el frontend, con las herramientas locales preparadas en este equipo:

```powershell
$env:PATH = "$PWD\.local\node;$env:PATH"
& .\.local\tools\pnpm.cmd --dir frontend test --reporter=verbose
```

Resultado: **2 archivos y 13 pruebas satisfactorias**, código de salida 0.

En otros equipos con Node.js y pnpm instalados y las dependencias preparadas, el comando equivalente es:

```powershell
pnpm --dir frontend test --reporter=verbose
```
