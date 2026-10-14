@echo off
setlocal enableextensions
title Sistema PDI - Entorno de Desarrollo Astro
cd /d "%~dp0"

set "PDI_PORT=4321"
set "PDI_URL=http://localhost:%PDI_PORT%"

echo ========================================================
echo   Asociacion Cultural Johannes Gutenberg
echo   Sistema PDI - Servidor de Desarrollo Astro
echo ========================================================
echo.

where node >nul 2>&1
if errorlevel 1 goto no_node

if not exist "node_modules" goto install_deps
goto run_dev

:no_node
echo [ERROR] No se detecto Node.js en este equipo.
echo Por favor instala Node.js desde https://nodejs.org
echo.
pause
exit /b 1

:install_deps
echo [INFO] Instalando dependencias necesarias con npm...
call npm install
echo.

:run_dev
REM Guardia de puerto: si ya hay un servidor respondiendo, NO se lanza una
REM segunda instancia (eso causaba el conflicto de puerto y las cargas
REM incompletas, porque el navegador abria el servidor viejo).
call :server_is_up
if not errorlevel 1 goto already_running

REM OJO: NO borrar .astro\dev.json. Es el lock de instancia unica de Astro 7:
REM checkExistingServer() lo lee para saber si ya hay un servidor vivo. Al
REM borrarlo, Astro no detecta al servidor existente, Vite encuentra el 4321
REM ocupado y se muda EN SILENCIO a otro puerto (4322, 4323...). El navegador
REM sigue abriendo 4321 (el servidor viejo), que es el que "se cae solo".

echo [OK] Iniciando Astro Dev Server en %PDI_URL% ...
echo [INFO] El navegador se abrira automaticamente cuando el servidor este listo.
echo.

REM --force reemplaza (mata) cualquier servidor residual y SIEMPRE toma el 4321,
REM en vez de saltar a otro puerto y dejar dos servidores levantados a la vez.
REM --open abre el navegador JUSTO cuando el servidor esta listo (no antes).
node --enable-source-maps=false node_modules\astro\bin\astro.mjs dev --force --open
if errorlevel 1 pause
echo.
echo [INFO] El servidor termino o se detecto un error.
pause
exit /b 0

:already_running
echo [INFO] Ya hay un servidor de desarrollo activo en %PDI_URL%.
echo [INFO] No se inicia otra instancia. Abriendo el navegador...
start "" "%PDI_URL%"
exit /b 0

:server_is_up
REM Devuelve errorlevel 0 si el puerto esta ocupado (servidor arriba); 1 si esta libre.
REM Get-NetTCPConnection cubre IPv4 e IPv6 (Astro escucha en localhost/::1).
REM Timeout de 10s (no 2s): un cold-compile de Vite puede tardar mas y antes
REM hacia creer al script que el puerto estaba libre, lanzando otra instancia.
REM Un servidor que responde (aunque sea con un no-200) cuenta como arriba.
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -State Listen -LocalPort %PDI_PORT% -ErrorAction SilentlyContinue) { try { $r=Invoke-WebRequest -Uri 'http://localhost:%PDI_PORT%/' -TimeoutSec 10 -UseBasicParsing; if ($r.StatusCode -ge 200) { exit 0 } exit 1 } catch { if ($_.Exception.Response) { exit 0 } exit 1 } } else { exit 1 }" >nul 2>&1
exit /b %errorlevel%
