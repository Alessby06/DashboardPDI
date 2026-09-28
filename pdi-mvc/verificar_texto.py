#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Detector de texto corrupto en el codigo fuente.

Ha aparecido varias veces en este proyecto la mezcla de alfabetos: fragmentos en
chino o cirilico incrustados en mitad de una frase en castellano. No lo detecta
el navegador (es UTF-8 valido) y no lo detecta ningun linter, asi que acaba en
la documentacion del sistema. Este script lo caza.

Caza dos cosas:
  - Caracteres de alfabetos que no tienen nada que hacer aqui: cirilico, kana,
    ideogramas, hangul y el caracter de reemplazo U+FFFD.
  - Letras latinases extendidas (U+0100-U+017F), que en un proyecto en
    castellano casi siempre son mojibake: un acento UTF-8 mal decodificado deja
    una letra acentuada hungara o eslava en lugar de la Espana.

Uso:  python verificar_texto.py [ruta ...]
Devuelve 1 si encuentra contaminacion, 0 si todo esta limpio.
"""

import io
import os
import re
import sys

# La consola de Windows usa cp1252 y no puede imprimir el texto que hay que
# reportar. Sin esto, el propio verificador revienta al intentar mostrarlo.
for flujo in (sys.stdout, sys.stderr):
    try:
        flujo.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

BASE = os.path.dirname(os.path.abspath(__file__))
RAIZES_POR_DEFECTO = [os.path.join(BASE, "js"), os.path.join(BASE, "src"), os.path.join(BASE, "data")]

EXTENSIONES = {".js", ".html", ".css", ".py", ".json", ".md", ".mjs"}
EXCLUIDOS = {"node_modules", ".git", "__pycache__", ".vercel", "assets"}

SOSPECHOSO = re.compile(
    r"[\u0400-\u04FF"   # cirilico
    r"\u3040-\u30FF"   # kana
    r"\u4E00-\u9FFF"   # ideogramas
    r"\uAC00-\uD7AF"   # hangul
    r"\uFFFD]"         # caracter de reemplazo
)

# El rangoUtil de la contaminacion por mojibake es el de las latinas
# extendidas: un acento UTF-8 mal decodificado produce una letra hungara
# (U+01ED), eslava (U+0456) o baltica (U+0117) en lugar de la nuestra.
LATINA_EXTENDIDA = re.compile(r"[\u0100-\u024F]")


def archivos_de(rutas):
    vistos = set()
    for ruta in rutas:
        if os.path.isfile(ruta):
            yield ruta
            continue
        for raiz, dirs, archivos in os.walk(ruta):
            dirs[:] = [d for d in dirs if d not in EXCLUIDOS]
            for nombre in archivos:
                if os.path.splitext(nombre)[1] in EXTENSIONES:
                    completa = os.path.join(raiz, nombre)
                    if completa not in vistos:
                        vistos.add(completa)
                        yield completa


def revisar_linea(linea):
    """Devuelve el tipo de contaminacion, o None si la linea esta limpia."""
    if SOSPECHOSO.search(linea):
        return "alfabeto ajeno o U+FFFD"
    if LATINA_EXTENDIDA.search(linea):
        return "latina extendida (probable mojibake)"
    return None


def resolver(ruta):
    """Ruta absoluta. Las relativas se buscan primero en el directorio actual
    y despues en la raiz del proyecto, para que el script sirva tanto para
    revisar el proyecto entero como una muestra concreta."""
    if os.path.isabs(ruta):
        return ruta
    desde_aqui = os.path.abspath(ruta)
    if os.path.exists(desde_aqui):
        return desde_aqui
    return os.path.join(BASE, ruta)


def main():
    rutas = [resolver(r) for r in (sys.argv[1:] or RAIZES_POR_DEFECTO)]

    hallazgos = []
    revisados = 0

    for ruta in archivos_de(rutas):
        revisados += 1
        try:
            with io.open(ruta, encoding="utf-8") as f:
                lineas = f.read().split("\n")
        except UnicodeDecodeError as exc:
            hallazgos.append((ruta, 0, "el archivo no es UTF-8 valido", str(exc)))
            continue

        for n, linea in enumerate(lineas, start=1):
            tipo = revisar_linea(linea)
            if tipo:
                hallazgos.append((ruta, n, tipo, linea.strip()[:88]))

    print("=" * 66)
    print("  VERIFICACION DE TEXTO - Sistema PDI")
    print("=" * 66)
    print(f"  Archivos revisados: {revisados}")
    print("-" * 66)

    if hallazgos:
        print("  [FALLA] TEXTO CONTAMINADO:")
        for ruta, n, tipo, texto in hallazgos:
            rel = os.path.relpath(ruta, BASE).replace(os.sep, "/")
            donde = f"{rel}:{n}" if n else rel
            print(f"      - {donde}  [{tipo}]")
            print(f"        {texto}")
        print("-" * 66)
        print(f"  [FALLA] {len(hallazgos)} linea(s) con contaminacion.")
    else:
        print("  [OK] Sin caracteres fuera del alfabeto latino ni mojibake.")

    print("=" * 66)
    return 1 if hallazgos else 0


if __name__ == "__main__":
    sys.exit(main())
