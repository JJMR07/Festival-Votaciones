@echo off
rem ============================================================
rem  INICIAR SISTEMA DE VOTACIONES (doble clic)
rem  Enciende PostgreSQL, el servidor Django y abre el navegador.
rem  Para APAGAR: presione Ctrl + C en esta ventana.
rem ============================================================
title Sistema de Votaciones - Festival Vallenata 2027
cd /d "%~dp0"

set "PGDIR=%USERPROFILE%\scoop\apps\postgresql\current"

echo ============================================================
echo   SISTEMA DE VOTACIONES - FESTIVAL DE LA LEYENDA VALLENATA
echo ============================================================
echo.

echo [1/3] Verificando PostgreSQL...
"%PGDIR%\bin\pg_ctl.exe" status -D "%PGDIR%\data" >nul 2>&1
if errorlevel 1 (
    echo        PostgreSQL esta apagado. Encendiendo...
    "%PGDIR%\bin\pg_ctl.exe" -D "%PGDIR%\data" start >nul
    timeout /t 3 /nobreak >nul
) else (
    echo        PostgreSQL ya estaba encendido.
)

echo [2/3] Activando entorno virtual...
call "%~dp0venv\Scripts\activate.bat"
if errorlevel 1 (
    echo.
    echo ERROR: no se encontro el entorno virtual "venv".
    echo Ejecute primero:  py -3.12 -m venv venv
    echo Y luego:          pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo [3/3] Encendiendo el servidor y abriendo el navegador...
echo.
echo        PAGINA:  http://127.0.0.1:8000/
echo        ADMIN:   http://127.0.0.1:8000/admin/   (usuario: admin)
echo.
echo        Para apagar el servidor: Ctrl + C
echo ------------------------------------------------------------
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start http://127.0.0.1:8000/"
python manage.py runserver 127.0.0.1:8000

echo.
echo Servidor detenido.
pause
