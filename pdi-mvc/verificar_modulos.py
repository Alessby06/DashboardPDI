#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador del grafo de modulos ES del Sistema PDI.

Recorre el grafo de imports desde los puntos de entrada y reporta:

  - MODULOS INALCANZABLES: archivos .js a los que ningun punto de entrada llega.
    En modulos nativos esto significa que el archivo jamas se descarga, por lo
    que todo lo que registre en window.* queda indefinido. Suele pasar cuando
    un modulo se crea pero nadie lo importa: sus efectos secundarios nunca
    ocurren y los errores se manifiestan como "secciones vacias" en vez de como
    fallos visibles.

  - IMPORTS ROTOS: imports que apuntan a un archivo inexistente. Rompen el
    grafo por completo y el navegador no ejecuta el resto del modulo.

PUNTOS DE ENTRADA: tras la conversion a MPA hay uno por pagina, en js/pages/.
El grafo completo se valida recorriéndolos todos: si un modulo no es alcanzable
desde ninguno, esta muerto.

No requiere dependencias. Ejecutar:  python verificar_modulos.py
Devuelve codigo de salida 1 si encuentra problemas, 0 si todo esta bien.
"""

import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(BASE, "js", "pages")

# Directorios que nunca contienen modulos de la aplicacion.
EXCLUIDOS = {"node_modules", ".git", "src", "__pycache__", ".vercel"}

# Entrada historica de la SPA. Se conserva mientras exista, para no reportar
# como inalcanzable un grafo que todavia no se haya dividido.
ENTRADA_LEGACY = os.path.join(BASE, "js", "app.js")

# import { a, b } from './x.js'  |  import './x.js'  |  export ... from './x.js'
RE_IMPORT = re.compile(
    r"""(?:^|\n)\s*(?:import|export)\b[^;\n]*?from\s*['"]([^'"]+)['"]"""
    r"""|(?:^|\n)\s*import\s*['"]([^'"]+)['"]""",
    re.MULTILINE,
)


def puntos_de_entrada():
    """Entradas a recorrer: js/app.js (si sigue existiendo) + js/pages/*.js."""
    entradas = []
    if os.path.isfile(ENTRADA_LEGACY):
        entradas.append(ENTRADA_LEGACY)
    if os.path.isdir(PAGES_DIR):
        for nombre in sorted(os.listdir(PAGES_DIR)):
            if nombre.endswith(".js"):
                entradas.append(os.path.join(PAGES_DIR, nombre))
    return entradas


def clave_de(ruta):
    """Ruta normalizada relativa a la raiz del proyecto, con / como separador."""
    return os.path.relpath(ruta, BASE).replace(os.sep, "/")


def modulos_js():
    """Todos los .js del proyecto, indexados por ruta normalizada con /."""
    encontrados = {}
    for raiz, dirs, archivos in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in EXCLUIDOS]
        for nombre in archivos:
            if nombre.endswith(".js"):
                completa = os.path.join(raiz, nombre)
                encontrados[clave_de(completa)] = completa
    return encontrados


def imports_de(ruta):
    """Rutas importadas por un archivo, resueltas a relativas de la raiz."""
    with open(ruta, "r", encoding="utf-8", errors="replace") as f:
        contenido = f.read()
    encontrados = []
    for coincidencia in RE_IMPORT.finditer(contenido):
        destino = coincidencia.group(1) or coincidencia.group(2)
        if not destino or not destino.startswith("."):
            continue  # import de paquete externo: fuera del alcance
        base = os.path.relpath(os.path.dirname(ruta), BASE).replace(os.sep, "/")
        if base == ".":
            base = ""
        combinado = os.path.normpath(os.path.join(base, destino)).replace(os.sep, "/")
        encontrados.append(combinado.lstrip("./"))
    return encontrados


def main():
    entradas = puntos_de_entrada()
    if not entradas:
        print("[ERROR] No se encontro ningun punto de entrada.")
        print("        Se esperaba js/app.js o al menos un js/pages/*.js")
        return 1

    todos = modulos_js()
    alcanzables = set()
    imports_rotos = []
    pendientes = list(entradas)

    while pendientes:
        actual = pendientes.pop()
        clave = clave_de(actual)
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
    print(f"  Puntos de entrada    : {len(entradas)}")
    print(f"  Modulos totales      : {len(todos)}")
    print(f"  Alcanzables          : {len(alcanzables)}")
    print("-" * 66)

    if inalcanzables:
        print("  [FALLA] MODULOS INALCANZABLES (nadie los importa):")
        for nombre in inalcanzables:
            print(f"      - {nombre}")
        print("      No se descargaran nunca. Si registran algo en window.*,")
        print("      quedara indefinido. Anade el import o elimina el archivo.")
        print("-" * 66)

    if imports_rotos:
        print("  [FALLA] IMPORTS ROTOS (archivo destino inexistente):")
        for origen, destino in imports_rotos:
            print(f"      - {origen}  ->  {destino}")
        print("      El grafo se interrumpe y el navegador no ejecuta el modulo.")
        print("-" * 66)

    if problemas == 0:
        print("  [OK] Grafo integro: todos los modulos son alcanzables desde")
        print("       alguno de los puntos de entrada y todos los imports resuelven.")
    else:
        print(f"  [FALLA] {problemas} problema(s) detectado(s).")

    print("=" * 66)
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
