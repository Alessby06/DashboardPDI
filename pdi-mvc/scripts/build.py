#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema PDI - Ensamblador de la MPA (Multi-Page Application).

Convierte las piezas de src/ en las diez paginas publicables. La fuente de
verdad son los archivos de src/, nunca el resultado: por eso la duplicacion
del chrome entre paginas es generada y se mantiene consistente sola.

Uso:
    python scripts/build.py          reconstruye las diez paginas
    python scripts/build.py --check  verifica que las paginas estan al dia

No requiere dependencias externas. El proyecto sigue sin build step en tiempo
de ejecucion: las paginas generadas se versionan y se sirven tal cual.

Hay dos raices y conviene no confundirlas. ROOT es pdi-mvc/, el proyecto, donde
viven las plantillas de src/ y las herramientas de scripts/. APP es pdi-mvc/app/,
que es la raiz web: lo unico que se publica y lo unico que vercel.json sirve.

build.py lee de ROOT/src y escribe en APP. No copia nada: js, css, assets y data
ya estan en APP y el navegador los carga desde ahi, con rutas relativas que no
cambian al mover el conjunto.
"""

import io
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))   # scripts/
ROOT = os.path.dirname(BASE)                        # pdi-mvc/, el proyecto
APP = os.path.join(ROOT, "app")                     # pdi-mvc/app/, la raiz web
SRC = os.path.join(ROOT, "src")
CHROME = os.path.join(SRC, "chrome")
PAGES = os.path.join(SRC, "pages")

# (slug, punto de entrada, id del <section>)
#
# El slug es la clave con la que RouteMap y el PageGuard llaman a la pagina: es
# el data-page del <body> y el prefijo de los nombres de archivo. El nombre
# legible de cada pagina vive solo en RouteMap; antes esta tabla lo repetia sin
# que nada lo usara, que es la forma de que las dos copias se separen.
#
# El id del section no es decorativo: es el campo 'view' que declara
# js/auth/RouteMap.js, y slugDesdeView() lo usa para traducir los
# identificadores que el codigo heredado todavia menciona. Si build.py escribe
# una pagina cuyo section no coincide con lo que dice RouteMap, el mapa queda
# mintiendo y el error aparece lejos de su causa. Por eso se valida aqui, y por
# eso verificar_topologia.py exige ademas que los dos coincidan.
PAGINAS = [
    ("dashboard",     "js/pages/dashboard.js",     "view-dashboard"),
    ("padron",        "js/pages/padron.js",        "view-beneficiarios"),
    ("salud",         "js/pages/salud.js",         "view-salud"),
    ("educativo",     "js/pages/educativo.js",     "view-educativo"),
    ("social",        "js/pages/social.js",        "view-social"),
    ("sedes",         "js/pages/sedes.js",         "view-sedes"),
    ("voluntariados", "js/pages/voluntariados.js", "view-voluntarios"),
    ("auditoria",     "js/pages/auditoria.js",     "view-auditoria"),
    ("ajustes",       "js/pages/ajustes.js",       "view-ajustes"),
    # No va en el menu lateral: se llega desde el padron con expediente?id=N. Por
    # eso build.py no tiene ningun enlace que marcar como activo en esta pagina,
    # y marcar_activo() fallaria al no encontrarlo. La pagina genera su propio
    # boton de vuelta al padron en su cabecera.
    ("expediente",    "js/pages/expediente.js",    "view-expediente"),
]

# Paginas que existen pero no tienen entrada en el menu lateral. Se separan de
# PAGINAS para que la comprobacion sea explicita: anadir una pagina de detalle
# es una decision, no un olvido, y conviene que se vea al leer la tabla.
SIN_ENLACE_DE_MENU = {"expediente"}

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
        raise SystemExit("[ERROR] No se encuentra: %s" % os.path.relpath(ruta, ROOT))
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


def hojas_de_pagina(slug):
    """Los <link> de las hojas que dependen de la pagina, ya no del chrome.

    Dos cosas se han quitado de la cabecera comun:

    views.css eran 131 KB y se cargaba entero en las diez paginas, cuando cada
    una usa entre la mitad y los dos tercios. Se ha partido en una parte comun a
    todas y otra propia de cada pagina. El reparto se hizo preguntando al DOM
    real de cada pagina que reglas encuentra un elemento suyo, no leyendo el
    nombre de los selectores ni suponiendo a que vista pertenece cada bloque.

    expediente.css son 11 KB y solo la usa la pagina del expediente: se
    comprobo quitando el <link> en caliente y comparando el estilo de las diez
    paginas una a una.

    El orden importa: la comun va antes que la propia, porque de el depende la
    cascada. Por eso la comun solo lleva lo que aparece antes que la primera
    regla propia de cualquier pagina, y lo que viene despues va al archivo de
    la pagina que lo necesita. Un reparto por pertenencia en vez de por orden
    rompia la cascada: .padron-active-chips-bar esta en las diez paginas, asi
    que su segunda regla era comun, y al partir el archivo la primera, que es
    del padron, paso a ganarle y le cambiaba el borde y el margen.
    """
    hojas = ['  <link rel="stylesheet" href="./css/views-comun.css">',
             '  <link rel="stylesheet" href="./css/views-%s.css">' % slug]
    if slug == "expediente":
        hojas.append('  <link rel="stylesheet" href="./css/expediente.css">')
    return "\n".join(hojas)


def construir(slug, entry):
    head = leer_bloque("head.html")
    if "<!--CSS_PAGINA-->" not in head:
        raise SystemExit("[ERROR] head.html no tiene el marcador <!--CSS_PAGINA-->")
    head = head.replace("<!--CSS_PAGINA-->", hojas_de_pagina(slug))
    sidebar = leer_bloque("sidebar.html")
    # Una pagina de detalle no tiene enlace propio en el lateral, y marcarlo
    # buscaria un enlace que no esta: marcar_activo() no sabria que hacer.
    if slug not in SIN_ENLACE_DE_MENU:
        sidebar = marcar_activo(sidebar, slug)
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
    if not os.path.isfile(os.path.join(APP, entry.replace("/", os.sep))):
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

    # Una pagina de detalle no tiene enlace en el lateral, asi que exigirlo seria
    # exigir algo que no debe existir. Lo que si tiene que cumplirse es lo
    # contrario: ningun enlace puede quedar marcado como activo, porque en una
    # pagina a la que se llega por id el menu no esta en ninguna parte.
    #
    # Se busca la palabra "active" dentro del atributo class y no la cadena
    # class="active": al marcar, el orden de las clases depende de como este
    # escrito el enlace en el origen, y un enlace con class="nav-btn active" es
    # exactamente el que hay que notar.
    if slug in SIN_ENLACE_DE_MENU:
        nav = re.search(r"<nav\b.*?</nav>", html, re.DOTALL)
        if nav:
            marcados = re.findall(
                r'<a href="\./(\w+)\.html" class="([^"]*\bactive\b[^"]*)"',
                nav.group(0),
            )
            if marcados:
                problemas.append(
                    "esta pagina no va en el menu, pero se genero con enlaces "
                    "marcados como activos: %s"
                    % ", ".join(sorted({s[0] for s in marcados}))
                )
        return problemas

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

    for slug, entry, view_id in PAGINAS:
        destino = os.path.join(APP, "%s.html" % slug)
        nuevo = construir(slug, entry)

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
    with io.open(os.path.join(APP, "index.html"), "w", encoding="utf-8", newline="\n") as f:
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
