@echo off
rem Abre PostgreSQL y conecta psql a la base del proyecto (doble clic).
set PGDIR=%USERPROFILE%\scoop\apps\postgresql\current
set PGPASSWORD=postgres

echo Iniciando PostgreSQL (si ya esta corriendo, ignora el aviso)...
"%PGDIR%\bin\pg_ctl.exe" -D "%PGDIR%\data" start

echo.
echo Conectado a la base "votaciones_festival". Escriba \q para salir.
"%PGDIR%\bin\psql.exe" -U postgres -d votaciones_festival
pause
