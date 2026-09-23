@echo off
title Sistema PDI - Servidor HTTP Local (MVC)
cd /d "%~dp0"

echo ========================================================
echo   Asociacion Cultural Johannes Gutenberg
echo ========================================================
echo.

:: 1. Intento directo con Python (el más rápido y eficiente)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor
    python serve.py
    goto end
)

:: 2. Intento con Python Launcher (py)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor
    py serve.py
    goto end
)

:: 3. Intento con Node.js http-server
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor
    npx --yes http-server -p 8000 -c-1 -o /index.html
    goto end
)

:: 4. Fallback directo al navegador
echo.
echo [ADVERTENCIA] No se detecto Python ni Node.js.
echo Abriendo index.html directamente en el navegador...
start "" "index.html"

:end
pause
