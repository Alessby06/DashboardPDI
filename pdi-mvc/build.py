#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema PDI - Ensamblador de la MPA (Multi-Page Application).

Convierte las piezas de src/ en las nueve paginas publicables. La fuente de
verdad son los archivos de src/, nunca el resultado: por eso la duplicacion
del chrome entre paginas es generada y se mantiene consistente sola.

Uso:
    python build.py              reconstruye las nueve paginas
    python build.py --check      verifica que las paginas estan al dia

No requiere dependencias externas. El proyecto sigue sin build step en tiempo
de ejecucion: las paginas generadas se versionan y se sirven tal cual.
"""

import io
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "src")
CHROME = os.path.join(SRC, "chrome")
PAGES = os.path.join(SRC, "pages")

# (slug, etiqueta, entry point, id del <section>)
#
# El id del section no es decorativo: es el campo 'view' que declara
# js/auth/RouteMap.js, y slugDesdeView() lo usa para traducir los
# identificadores que el codigo heredado todavia menciona. Si build.py escribe
# una pagina cuyo section no coincide con lo que dice RouteMap, el mapa queda
# mintiendo y el error aparece lejos de su causa. Por eso se valida aqui.
PAGINAS = [
    ("dashboard",     "Dashboard General",            "js/pages/dashboard.js",     "view-dashboard"),
    ("padron",        "Padrón de Beneficiarios",      "js/pages/padron.js",        "view-beneficiarios"),
    ("salud",         "Salud y Nutrición (CRED)",     "js/pages/salud.js",         "view-salud"),
    ("educativo",     "Casita del Saber",             "js/pages/educativo.js",     "view-educativo"),
    ("social",        "Derivaciones Sociales (ASP)", "js/pages/social.js",        "view-social"),
    ("sedes",         "Sedes e Iglesias",             "js/pages/sedes.js",         "view-sedes"),
    ("voluntariados", "Voluntariados",               "js/pages/voluntariados.js", "view-voluntarios"),
    ("auditoria",     "Historial de Cambios",         "js/pages/auditoria.js",     "view-auditoria"),
    ("ajustes",       "Ajustes",                      "js/pages/ajustes.js",       "view-ajustes"),
]

PLANTILLA = """{head}
<body data-page="{slug}">
  <!-- Toast Notification Stack -->
  <div class="toast-container" id="toastContainer"></div>

  <div class="app-shell">
{sidebar}
{topbar}
  <main class="content-viewport" id="mainContent">
{contenido}
  </main>
    </div>
  </div>

{modales}
  <!-- Punto de entrada: modulos ES nativos. Requiere servidor HTTP -->
  <script type="module" src="{entry}"></script>
</body>

</html>
"""


def leer(ruta):
    if not os.path.isfile(ruta):
        raise SystemExit("[ERROR] No se encuentra: %s" % os.path.relpath(ruta, BASE))
    with io.open(ruta, encoding="utf-8") as f:
        return f.read()


def leer_bloque(nombre):
    texto = leer(os.path.join(CHROME, nombre))
    # Los bloques se guardaron sin linea en blanco final; se normaliza.
    return texto.rstrip("\n")


def marcar_activo(sidebar, slug):
    """Anade la clase 'active' al enlace de navegacion de la pagina actual.

    La clase se inyecta en generacion en lugar de fijarse en el HTML, de modo
    que un unico sidebar sirve para las nueve paginas. El CSS tambien marca el
    activo por selector de atributo, asi que esta clase es un refuerzo y no la
    unica fuente: si el marcado cambia, el CSS sigue aciertando.
    """
    # Se captura el href aparte para poder devolver la etiqueta completa. Si se
    # devolviera solo class=..., el href desapareceria del enlace y la pagina
    # se quedaria sin navegacion.
    patron = r'(<a href="\./%s\.html")\s+class="([^"]*)"' % re.escape(slug)

    def _sub(m):
        apertura, clase = m.group(1), m.group(2)
        if "active" in clase.split():
            return m.group(0)
        return '%s class="%s active"' % (apertura, clase.strip())

    salida, n = re.subn(patron, _sub, sidebar, count=1)
    if n != 1:
        raise SystemExit("[ERROR] No se encontro el enlace de nav para '%s'" % slug)
    return salida


def construir(slug, etiqueta, entry):
    head = leer_bloque("head.html")
    sidebar = marcar_activo(leer_bloque("sidebar.html"), slug)
    topbar = leer_bloque("topbar.html")
    modales = leer_bloque("modals.html")
    contenido = leer(os.path.join(PAGES, "%s.html" % slug)).rstrip("\n")

    # Deduplicar: la plantilla ya cierra </main> y los div del shell, asi que
    # el contenido de la pagina no debe traerlos.
    return PLANTILLA.format(
        head=head, slug=slug, sidebar=sidebar, topbar=topbar,
        contenido=contenido, modales=modales, entry=entry,
    )


# Etiquetas cuyo balance importa de verdad. No se comprueban todas porque el
# HTML de origen tiene voids como <br> y <img> que no llevan cierre.
ETIQUETAS_CRITICAS = ["div", "section", "aside", "header", "main", "nav", "form", "table"]

# Contenido que no es marcado y hay que ignorar al contar.
RE_CODIGO = re.compile(r"<script\b[^>]*>.*?</script>", re.DOTALL | re.IGNORECASE)
RE_COMENTARIO = re.compile(r"<!--.*?-->", re.DOTALL)
RE_CADENA = re.compile(r"\"[^\"\n]*\"|'[^'\n]*'")


def contar_etiqueta(html, etiqueta):
    """(aperturas, cierres) de una etiqueta, ignorando scripts, comentarios,
    cadenas y auto-cerrados."""
    limpio = RE_CODIGO.sub("", html)
    limpio = RE_COMENTARIO.sub("", limpio)
    limpio = RE_CADENA.sub('""', limpio)
    abre = len(re.findall(r"<%s\b" % etiqueta, limpio))
    cierra = len(re.findall(r"</%s>" % etiqueta, limpio))
    return abre, cierra


def validar(slug, html, entry, view_id):
    """Comprueba lo que un conteo manual haria mal: que el documento este
    balanceado y que la pagina apunte a su propio punto de entrada."""
    problemas = []

    if '<body data-page="%s">' % slug not in html:
        problemas.append('falta <body data-page="%s">' % slug)

    if 'src="%s"' % entry not in html:
        problemas.append("el script de entrada no apunta a %s" % entry)

    # El punto de entrada tiene que existir de verdad, y llamarse como la
    # pagina. Antes esta comprobacion comparaba el valor contra si mismo (el
    # mismo string que la plantilla acaba de escribir), asi que no podia fallar
    # nunca. Ahora mira el disco.
    if not os.path.isfile(os.path.join(BASE, entry.replace("/", os.sep))):
        problemas.append("el punto de entrada %s no existe" % entry)

    esperado = "js/pages/%s.js" % slug
    if entry != esperado:
        problemas.append("el punto de entrada deberia ser %s, es %s" % (esperado, entry))

    for etiqueta in ETIQUETAS_CRITICAS:
        abre, cierra = contar_etiqueta(html, etiqueta)
        if abre != cierra:
            problemas.append("<%s> desbalanceado: %d aperturas, %d cierres" % (etiqueta, abre, cierra))

    # El <section> debe llevar el id que RouteMap declara para esta pagina.
    if '<section class="app-view active" id="%s">' % view_id not in html:
        encontrados = re.findall(r'<section class="app-view[^"]*" id="([^"]*)"', html)
        problemas.append(
            "el <section> deberia ser id='%s' (segun RouteMap) pero hay: %s"
            % (view_id, encontrados or "ninguno")
        )

    # Exactly one nav link, and it must carry the same view id as the section.
    enlaces = re.findall(r'<a href="\./%s\.html"[^>]*>' % re.escape(slug), html)
    if len(enlaces) != 1:
        problemas.append("se esperaba 1 enlace de nav a '%s', hay %d" % (slug, len(enlaces)))
    else:
        if "active" not in re.search(r'class="([^"]*)"', enlaces[0]).group(1).split():
            problemas.append("el enlace de nav a '%s' no lleva la clase active" % slug)
        if 'data-view="%s"' % view_id not in enlaces[0]:
            problemas.append("el enlace de nav a '%s' no declara data-view='%s'" % (slug, view_id))

    # Ningun otro enlace de nav debe llevar la clase active.
    otros = re.findall(r'<a href="\./(\w+)\.html" class="([^"]*active[^"]*)"', html)
    otros = [o for o in otros if o[0] != slug]
    if otros:
        problemas.append("enlaces de nav marcados como activos que no son de esta pagina: %s"
                          % ", ".join(sorted({o[0] for o in otros})))

    return problemas


def main():
    check = "--check" in sys.argv
    problemas = 0

    for slug, etiqueta, entry, view_id in PAGINAS:
        destino = os.path.join(BASE, "%s.html" % slug)
        nuevo = construir(slug, etiqueta, entry)

        fallos = validar(slug, nuevo, entry, view_id)
        for f in fallos:
            print("  [FALLA] %s.html: %s" % (slug, f))
        problemas += len(fallos)

        if check:
            actual = leer(destino) if os.path.isfile(destino) else ""
            if actual != nuevo:
                print("  [DESACTUALIZADA] %s.html" % slug)
                problemas += 1
        else:
            with io.open(destino, "w", encoding="utf-8", newline="\n") as f:
                f.write(nuevo)
            print("  generado %-22s (%5d lineas)" % (slug + ".html", nuevo.count("\n") + 1))

    # index.html queda como puerta de entrada al dashboard
    with io.open(os.path.join(BASE, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(INDICE_REDIRECT)

    if problemas:
        print("\n  %d problema(s). Las paginas pueden estar mal formadas." % problemas)
        return 1

    if check:
        print("\n  Todas las paginas estan al dia y bien formadas.")
    else:
        print("\n  %d paginas generadas y validadas." % len(PAGINAS))
    return 0


INDICE_REDIRECT = """<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Sistema PDI | Johannes Gutenberg</title>
  <link rel="canonical" href="./dashboard.html">
  <meta http-equiv="refresh" content="0; url=./dashboard.html">
  <script>window.location.replace("./dashboard.html" + window.location.search + window.location.hash);</script>
  <style>
    body {
      background: #000;
      color: #f0eaff;
      font-family: "Google Sans Flex", system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }

    a {
      color: #9d78f5;
    }
  </style>
</head>

<body>
  <p>Redirigiendo al <a href="./dashboard.html">Dashboard General</a>&hellip;</p>
</body>

</html>
"""


if __name__ == "__main__":
    sys.exit(main())
