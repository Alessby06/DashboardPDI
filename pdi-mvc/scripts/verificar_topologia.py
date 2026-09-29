#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de topologia del Sistema PDI.

La conversion a MPA sustituyo una sola pagina por nueve documentos, y eso
convirtio la lista de paginas en un dato que hay que escribir en tres sitios:

    js/auth/RouteMap.js   PAGINAS   decide quien entra a donde
    build.py              PAGINAS   que documento se genera
    src/chrome/sidebar.html           que enlace aparece en el menu

Cuando los tres coinciden, la topologia es una verdad. En cuanto uno se queda
atras, aparece una clase de fallo que no se manifiesta donde se cometio:
PageGuard busca la ficha por el slug de data-page, no la encuentra, y redirige
al panel de control. La pagina existe, se sirve, responde 200, y no se puede
abrir. build.py --check no lo detecta, porque build.py se compara a si mismo.

Este verificador lee los tres y exige que digan lo mismo. Se ejecuta aparte de
build.py porque responde a otra pregunta: build.py pregunta si el documento esta
bien formado, este pregunta si los documentos que hay son los que deberia
haber.

No requiere dependencias. Ejecutar:  python verificar_topologia.py
Devuelve codigo de salida 1 si encuentra problemas, 0 si todo esta bien.
"""

import io
import os
import re
import sys

# La raiz del sitio es el directorio padre: los scripts viven en scripts/.
# ROOT es el proyecto (pdi-mvc/) y APP la raiz web (pdi-mvc/app/), que es
# lo que se publica. Los modulos y los HTML viven en APP; las plantillas
# de src/ y las herramientas de scripts/ se quedan en ROOT.
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(BASE, "app")

ROUTE_MAP = os.path.join(APP, "js", "auth", "RouteMap.js")
SIDEBAR = os.path.join(BASE, "src", "chrome", "sidebar.html")

# Fichas que no van en el menu: son paginas de detalle, a las que se llega por
# codigo (expediente?id=3) y no por un enlace del lateral.
OFF_MENU = "no aparece en el menu"


def leer(ruta):
    with io.open(ruta, encoding="utf-8") as f:
        return f.read()


def bloque_entre(texto, apertura, cierre="\\};"):
    """Contenido de un {...} o [...] que sigue a una apertura, con la clave del
    anidamiento: un cierre en la primera columna cierra el bloque."""
    i = texto.index(apertura) + len(apertura)
    fin = re.compile(r"^%s" % cierre, re.MULTILINE).search(texto, i)
    if not fin:
        raise SystemExit("[ERROR] No se cierra el bloque de %r en RouteMap.js" % apertura)
    return texto[i:fin.start()]


def parsear_routemap():
    """Extrae PAGINAS y ORDEN_MENU de js/auth/RouteMap.js.

    Se le el archivo como texto, no se ejecuta: un verificador no debe cargar la
    aplicacion para juzgarla. El formato que se espera es el de un objeto
    literal con una ficha por linea, que es como esta escrito y como lo
    mantendria quien lo lea.
    """
    texto = leer(ROUTE_MAP)

    cuerpo = bloque_entre(texto, "export const PAGINAS = {")
    paginas = {}
    for m in re.finditer(r"^  (\w+): \{(.*?)^  \},", cuerpo, re.MULTILINE | re.DOTALL):
        slug, ficha = m.group(1), m.group(2)

        def campo(nombre):
            mm = re.search(r"^\s*%s:\s*(\"[^\"]*\"|true|false|null)," % nombre, ficha, re.MULTILINE)
            if not mm:
                return None
            v = mm.group(1)
            if v in ("true", "false"):
                return v == "true"
            if v == "null":
                return None
            return v[1:-1]

        roles = re.search(r"allowedRoles:\s*\[([^\]]*)\]", ficha)
        paginas[slug] = {
            "archivo": campo("archivo"),
            "view": campo("view"),
            "enMenu": campo("enMenu"),
            "allowedRoles": re.findall(r'"([^"]+)"', roles.group(1)) if roles else [],
        }

    orden_txt = bloque_entre(texto, "export const ORDEN_MENU = [", "\\];")
    orden = re.findall(r'"([^"]+)"', orden_txt)

    return paginas, orden


def parsear_sidebar():
    """Enlaces de navegacion del sidebar: (href, data-page, data-view)."""
    texto = leer(SIDEBAR)
    enlaces = []
    for m in re.finditer(r"<a\b[^>]*>", texto):
        tag = m.group(0)
        href = re.search(r'href="\./(\w+)\.html"', tag)
        if not href:
            continue
        page = re.search(r'data-page="([^"]*)"', tag)
        view = re.search(r'data-view="([^"]*)"', tag)
        enlaces.append({
            "slug_href": href.group(1),
            "data_page": page.group(1) if page else None,
            "data_view": view.group(1) if view else None,
        })
    return enlaces


def comprobar(paginas, orden, sidebar, build_paginas, sin_enlace_menu):
    """Contrasta las cuatro fuentes de verdad.

    paginas         fichas de RouteMap
    sidebar         enlaces de src/chrome/sidebar.html
    build_paginas   tabla PAGINAS de build.py
    sin_enlace_menu paginas que build.py declara sin enlace de menu
    """
    problemas = []
    avisos = []

    slugs_menu = [s for s, f in paginas.items() if f["enMenu"]]
    slugs_build = [t[0] for t in build_paginas]
    slugs_sidebar = [e["data_page"] for e in sidebar]

    # --- 1. RouteMap <-> build.py -------------------------------------------
    # build.py genera todas las paginas, no solo las del menu, asi que se
    # contrasta contra todas las fichas. Comparar solo contra las del menu
    # reportaba como sobra el expediente, que es justamente la pagina de
    # detalle: existe, se genera y se llega a ella por id, y no por un enlace.
    solo_routemap = sorted(set(paginas) - set(slugs_build))
    solo_build = sorted(set(slugs_build) - set(paginas))
    if solo_routemap:
        problemas.append(
            "en RouteMap pero no en build.py (no se genera su documento): %s"
            % ", ".join(solo_routemap)
        )
    if solo_build:
        problemas.append(
            "en build.py pero no en RouteMap (PageGuard no sabria de quien es): %s"
            % ", ".join(solo_build)
        )

    # Y el reparto entre "con enlace de menu" y "sin ella" tiene que coincidir en
    # los dos archivos. Aqui es donde se esconden los fallos de este tipo: una
    # pagina que uno da por del menu y el otro por de detalle se genera sin
    # enlace activo, y el lateral no marca nada.
    detalle_routemap = {s for s, f in paginas.items() if not f["enMenu"]}
    detalle_build = sin_enlace_menu
    if detalle_routemap != detalle_build:
        problemas.append(
            "las paginas de detalle no coinciden.\n"
            "        detalle en RouteMap, con enlace en build.py: %s\n"
            "        detalle en build.py, con enlace en RouteMap: %s"
            % (", ".join(sorted(detalle_routemap - detalle_build)) or "ninguna",
               ", ".join(sorted(detalle_build - detalle_routemap)) or "ninguna")
        )

    for slug, entry, view_id in build_paginas:
        ficha = paginas.get(slug)
        if not ficha:
            continue  # ya reportado arriba
        if ficha["view"] != view_id:
            problemas.append(
                "%s: RouteMap declara view='%s' y build.py genera id='%s'"
                % (slug, ficha["view"], view_id)
            )
        if ficha["archivo"] != "%s.html" % slug:
            problemas.append(
                "%s: RouteMap declara archivo='%s', se esperaba '%s.html'"
                % (slug, ficha["archivo"], slug)
            )
        if not os.path.isfile(os.path.join(APP, entry.replace("/", os.sep))):
            problemas.append("%s: el punto de entrada %s no existe" % (slug, entry))
        if not os.path.isfile(os.path.join(APP, "%s.html" % slug)):
            problemas.append(
                "%s: RouteMap lo declara en el menu pero %s.html no esta generado "
                "(ejecuta python build.py)" % (slug, slug)
            )

    # --- 2. RouteMap <-> sidebar --------------------------------------------
    if sorted(slugs_menu) != sorted(x for x in slugs_sidebar if x):
        problemas.append(
            "el menu lateral y RouteMap no coinciden.\n"
            "        solo en RouteMap: %s\n"
            "        solo en el sidebar: %s"
            % (", ".join(sorted(set(slugs_menu) - set(slugs_sidebar))) or "ninguno",
               ", ".join(sorted(set(x for x in slugs_sidebar if x) - set(slugs_menu))) or "ninguno")
        )
    if len(slugs_sidebar) != len(sidebar):
        problemas.append("hay enlaces del menu sin data-page: el PageGuard no los puede ubicar")

    for e in sidebar:
        slug = e["data_page"]
        ficha = paginas.get(slug)
        if not ficha:
            continue  # ya reportado arriba
        if e["slug_href"] != slug:
            problemas.append(
                "el enlace ./%s.html declara data-page='%s': el PageGuard buscara "
                "una ficha que no existe" % (e["slug_href"], slug)
            )
        if e["data_view"] != ficha["view"]:
            problemas.append(
                "%s: el enlace declara data-view='%s' y RouteMap dice '%s'"
                % (slug, e["data_view"], ficha["view"])
            )

    # --- 3. ORDEN_MENU coherente --------------------------------------------
    if sorted(orden) != sorted(slugs_menu):
        problemas.append(
            "ORDEN_MENU no cubre las mismas paginas enMenu: "
            "falta %s / sobra %s"
            % (", ".join(sorted(set(slugs_menu) - set(orden))) or "nada",
               ", ".join(sorted(set(orden) - set(slugs_menu))) or "nada")
        )
    for slug in orden:
        if slug not in paginas:
            problemas.append("ORDEN_MENU menciona '%s', que no esta en PAGINAS" % slug)

    # --- 4. fichas de detalle declaradas pero no generadas ------------------
    for slug, ficha in paginas.items():
        if ficha["enMenu"]:
            continue
        if not os.path.isfile(os.path.join(APP, "%s.html" % slug)):
            problemas.append(
                "%s: RouteMap lo declara (%s) y el codigo construye enlaces hacia el, "
                "pero %s.html no existe: esos enlaces dan 404"
                % (slug, OFF_MENU, slug)
            )

    # --- 5. unicidad de los identificadores de vista ------------------------
    vistas = [f["view"] for f in paginas.values() if f["view"]]
    repetidas = sorted({v for v in vistas if vistas.count(v) > 1})
    if repetidas:
        problemas.append(
            "identificadores de vista repetidos (slugDesdeView no podria decidir): %s"
            % ", ".join(repetidas)
        )

    for slug, ficha in paginas.items():
        if not ficha["allowedRoles"]:
            avisos.append("%s: allowedRoles vacio, nadie podria entrar" % slug)
        for rol in ficha["allowedRoles"]:
            if rol not in ("coord", "facilitadora", "promotora", "social", "admin"):
                problemas.append("%s: rol desconocido '%s' en allowedRoles" % (slug, rol))

    return problemas, avisos


def main():
    sys.path.insert(0, os.path.join(BASE, "scripts"))
    import build  # solo PAGINAS; importar no ejecuta nada

    paginas, orden = parsear_routemap()
    sidebar = parsear_sidebar()

    print("=" * 66)
    print("  VERIFICACION DE TOPOLOGIA - Sistema PDI")
    print("=" * 66)
    print("  Fichas en RouteMap     : %d" % len(paginas))
    print("  En el menu             : %d" % len([f for f in paginas.values() if f["enMenu"]]))
    print("  Tabla de build.py      : %d" % len(build.PAGINAS))
    print("  Enlaces del sidebar    : %d" % len(sidebar))
    print("-" * 66)

    if not paginas:
        print("  [FALLA] No se pudo leer PAGINAS de RouteMap.js.")
        return 1

    problemas, avisos = comprobar(paginas, orden, sidebar, build.PAGINAS,
                                  build.SIN_ENLACE_DE_MENU)

    for a in avisos:
        print("  [AVISO] %s" % a)

    if problemas:
        print("  [FALLA] La topologia esta desincronizada:")
        for p in problemas:
            print("      - %s" % p)
        print("-" * 66)
        print("  Con estas diferencias, PageGuard redirige al panel una pagina que")
        print("  existe y responde 200, y nadie ve el aviso: el enlace de menu se")
        print("  ve bien y la pagina nunca abre.")
        print("  Origen: %s" % os.path.relpath(ROUTE_MAP, BASE))
        print("=" * 66)
        return 1

    print("  [OK] RouteMap, build.py y el menu lateral declaran la misma")
    print("       topologia. Toda pagina del menu tiene su documento.")
    print("=" * 66)
    return 0


if __name__ == "__main__":
    sys.exit(main())
