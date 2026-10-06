@echo off
setlocal
title Sistema PDI - Entorno de Desarrollo Astro
cd /d "%~dp0"

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
REM Limpieza de lockfile residual para evitar que Astro tarde buscando procesos zombies
if exist ".astro\dev.json" del /q /f ".astro\dev.json" >nul 2>&1

echo [OK] Iniciando Astro Dev Server en http://localhost:4321...
start "" http://localhost:4321
node --enable-source-maps=false node_modules\astro\bin\astro.mjs dev
if errorlevel 1 pause
exit /b 0
