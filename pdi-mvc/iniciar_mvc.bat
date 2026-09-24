@echo off
title Sistema PDI - Servidor HTTP Local (MVC)
cd /d "%~dp0"

:: Configuración de puerto por defecto (Cambiable a 8080, 8090, 3000, etc.)
SET PORT=8080

echo ========================================================
echo   Asociacion Cultural Johannes Gutenberg
echo   Sistema PDI - Iniciando en puerto %PORT%
echo ========================================================
echo.

:: 1. Intento directo con Python (el más rápido y eficiente)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor con Python en puerto %PORT%...
    python serve.py %PORT%
    goto end
)

:: 2. Intento con Python Launcher (py)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor con py Launcher en puerto %PORT%...
    py serve.py %PORT%
    goto end
)

:: 3. Intento con Node.js http-server
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor con Node.js en puerto %PORT%...
    npx --yes http-server -p %PORT% -c-1 -o /index.html
    goto end
)

:: 4. Fallback directo al navegador
echo.
echo [ADVERTENCIA] No se detecto Python ni Node.js.
echo Abriendo index.html directamente en el navegador...
start "" "index.html"

:end
pause
