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
    python scripts\serve.py %PORT%
    goto end
)

:: 2. Intento con Python Launcher (py)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor con py Launcher en puerto %PORT%...
    py scripts\serve.py %PORT%
    goto end
)

:: 3. Intento con Node.js http-server
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Iniciando servidor con Node.js en puerto %PORT%...
    npx --yes http-server -p %PORT% -c-1 -o /paginas/index.html
    goto end
)

:: 4. Sin Python ni Node no se puede levantar un servidor HTTP.
::    El proyecto usa modulos ES nativos, que el navegador bloquea bajo file://
::    por CORS, asi que abrir index.html directamente dejaria la pagina en blanco.
echo.
echo [ERROR] No se detecto Python ni Node.js en este equipo.
echo.
echo El sistema necesita un servidor HTTP local. Instala cualquiera de:
echo   - Python 3   (https://python.org)  ->  python scripts\serve.py 8080
echo   - Node.js    (https://nodejs.org)  ->  npx http-server -p 8080 -c-1
echo.
echo No se puede abrir index.html con doble clic: los modulos ES no cargan
echo mediante file:// por politica de origen del navegador.
echo.
goto end

:end
pause
