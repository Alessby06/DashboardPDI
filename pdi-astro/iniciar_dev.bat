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
echo [OK] Iniciando Astro Dev Server en puerto 4321...
call npm run dev -- --force --open
if errorlevel 1 pause
exit /b 0
