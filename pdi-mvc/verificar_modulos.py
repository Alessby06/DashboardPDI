#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador del grafo de modulos ES del Sistema PDI.

Recorre el grafo de imports desde el punto de entrada (js/app.js) y reporta:

  - MODULOS INALCANZABLES: archivos .js que ningun modulo alcanza. En un build
    con modulos nativos esto significa que el archivo jamas se descarga, por
    que todo lo que registre en window.* queda indefinido. Suele pasar cuando
    un modulo se crea pero nadie lo importa: sus efectos secundarios nunca
    ocurren y los errores se manifiestan como "secciones vacias" en vez de como
    fallos visibles.

  - IMPORTS ROTOS: imports que apuntan a un archivo inexistente. Rompen el
    grafo por completo y el navegador no ejecuta el resto del modulo.

No requiere dependencias. Ejecutar:  python verificar_modulos.py
Devuelve codigo de salida 1 si encuentra problemas, 0 si todo esta bien.
"""

import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(BASE, "js")
ENTRADA = os.path.join(JS_DIR, "app.js")

# import { a, b } from './x.js'  |  import './x.js'  |  export ... from './x.js'
RE_IMPORT = re.compile(
    r"""(?:^|\n)\s*(?:import|export)\b[^;\n]*?from\s*['"]([^'"]+)['"]"""
    r"""|(?:^|\n)\s*import\s*['"]([^'"]+)['"]""",
    re.MULTILINE,
)


def modulos_js():
    """Todos los .js del proyecto, indexados por ruta normalizada con /."""
    encontrados = {}
    for raiz, _dirs, archivos in os.walk(JS_DIR):
        for nombre in archivos:
            if nombre.endswith(".js"):
                completa = os.path.join(raiz, nombre)
                clave = os.path.relpath(completa, JS_DIR).replace(os.sep, "/")
                encontrados[clave] = completa
    return encontrados


def imports_de(ruta):
    """Rutas importadas por un archivo, resueltas a relativas de js/."""
    with open(ruta, "r", encoding="utf-8", errors="replace") as f:
        contenido = f.read()
    encontrados = []
    for coincidencia in RE_IMPORT.finditer(contenido):
        destino = coincidencia.group(1) or coincidencia.group(2)
        if not destino or not destino.startswith("."):
            continue  # import de paquete externo: fuera del alcance
        base = os.path.relpath(os.path.dirname(ruta), JS_DIR).replace(os.sep, "/")
        if base == ".":
            base = ""
        combinado = os.path.normpath(os.path.join(base, destino)).replace(os.sep, "/")
        encontrados.append(combinado.lstrip("./"))
    return encontrados


def main():
    if not os.path.isfile(ENTRADA):
        print("[ERROR] No se encuentra el punto de entrada js/app.js")
        return 1

    todos = modulos_js()
    alcanzables = set()
    imports_rotos = []
    pendientes = [ENTRADA]

    while pendientes:
        actual = pendientes.pop()
        clave = os.path.relpath(actual, JS_DIR).replace(os.sep, "/")
        if clave in alcanzables:
            continue
        alcanzables.add(clave)

        for destino in imports_de(actual):
            if destino in todos:
                pendientes.append(todos[destino])
            else:
                imports_rotos.append((clave, destino))

    inalcanzables = sorted(set(todos) - alcanzables)
    problemas = len(inalcanzables) + len(imports_rotos)

    print("=" * 66)
    print("  VERIFICACION DEL GRAFO DE MODULOS - Sistema PDI")
    print("=" * 66)
    print(f"  Modulos totales      : {len(todos)}")
    print(f"  Alcanzables desde app: {len(alcanzables)}")
    print("-" * 66)

    if inalcanzables:
        print("  [FALLA] MODULOS INALCANZABLES (nadie los importa):")
        for nombre in inalcanzables:
            print(f"      - js/{nombre}")
        print("      No se descargaran nunca. Si registran algo en window.*,")
        print("      quedara indefinido. Anade el import o elimina el archivo.")
        print("-" * 66)

    if imports_rotos:
        print("  [FALLA] IMPORTS ROTOS (archivo destino inexistente):")
        for origen, destino in imports_rotos:
            print(f"      - js/{origen}  ->  {destino}")
        print("      El grafo se interrumpe y el navegador no ejecuta el modulo.")
        print("-" * 66)

    if problemas == 0:
        print("  [OK] Grafo integro: todos los modulos son alcanzables y")
        print("       todos los imports resuelven.")
    else:
        print(f"  [FALLA] {problemas} problema(s) detectado(s).")

    print("=" * 66)
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
