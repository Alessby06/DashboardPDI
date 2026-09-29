"""Comprueba que los puentes entre el marcado y el codigo esten bien cableados.

Este verificador existe por un fallo concreto. En js/core/legacy-globals.js el
ayudante que fabrica los puentes a las vistas se habia declarado asi:

    const vista = (nombre) => (fn) => (...)

Es decir, curryingado y de un solo argumento, mientras que los cuarenta y dos
usos de abajo la llamaban con los dos a la vez:

    window.filterPadronSearch = vista("BeneficiariosView", "filterBySearch");

El segundo argumento se descartaba sin avisar. Lo que acababa colgado de window
era la funcion intermedia, de modo que al teclear, el HTML le pasaba el texto y
ese texto ocupaba el lugar del nombre del metodo. La busqueda daba undefined y
no se filtraba nada: sin error en consola, con el puente correctamente definido
y con typeof valiendo "function". Cinco paginas quedaron con todos sus
buscadores, filtros y chips inertes, y las tablas se dibujaban enteras sin
dejar rastro. Desde fuera solo se veía que "las tablas no funcionan".

Un fallo asi no se ve mirando la pagina: se ve mirando el cableado. Por eso este
archivo hace cuatro comprobaciones.

  A. Que toda llamada a vista() pase los dos argumentos que declara. Es el fallo
     que acabo de arreglarse, y el que mas caro salio.

  B. Que la vista y el metodo que nombra el puente existan de verdad. El
     aparejo opcional se come un metodo mal escrito, asi que un nombre
     equivocado tampoco daria error. Aplica a los dos estilos de puente: los de
     vista() y los que invocan window.PDI?.X?.metodo?.().

     Recorre TODO js/, no solo legacy-globals. Antes los puentes vivian casi
     todos en ese archivo y el unico destino eran las vistas, asi que mirar solo
     ahi bastaba. Hoy hay puentes iguales repartidos (los de Theme, los de las
     vistas, los del archivo de puentes) y apuntan a vistas, controladores,
     nucleo y utiles por igual, que es donde los mire todos con la comprobacion
     E. Un nombre mal escrito en cualquiera de ellos se come igual de
     silencioso, asi que se comprueban todos.

  C. Que todo puente que el marcado invoca exista. En las dos direcciones: un
     puente borrado con el marcado sigue apuntandolo, y un puente que el marcado
     llama sin existir. Se buscan los atributos on* en las dos fuentes, porque
     parte del markup lo dibuja el codigo y no esta en src/pages: los botones de
     quitar un filtro de la tabla los pinta la vista con innerHTML.

  D. Lo mismo que C pero hacia el otro lado: puentes definidos que ya no invoca
     nadie. No es un fallo, es una lista para decidir: un puente sin uso es
     codigo que mantiene viva una funcion que quiza ya no existe.

  E. Que cada puente este definido en un solo archivo. Esta es la causa de fondo
     de la familia de fallos: hubo 42 puentes definidos dos veces, en
     legacy-globals.js y al final del archivo de la vista, y las dos copias no
     decian lo mismo. Gana la ultima que se evalua, que hoy es la vista porque
     se importa despues, de modo que el fallo no se ve: en cuanto cambia el
     orden de las importaciones, la copia mala pasa a mandar y los botones se
     quedan mudos sin decir error. Hay cuatro excepciones, declaradas abajo, y
     ninguna es por descuido.

Las comprobaciones B y C comparten el problema de donde esta cada nombre de
window.PDI y que metodos declara, asi que este archivo necesita saber leer los
registros sin inventar ningun manifiesto. No basta con mirar las vistas: casi
todos los modulos se registran igual, colgandose de window.PDI al importarse, y
los puentes apuntan hoy a vistas, controladores, nucleo y utiles por igual. Si
alguien no se registra, no existe para el codigo que lo busca, y el verificador
deberia decirlo.

Se ejecuta asi:

    python verificar_puentes.py

Devuelve 1 si algo falla, para poder encadenarlo con los demas verificadores.

Lo que NO comprueba, y conviene saber:

  Que el modulo al que apunta un puente este cargado en la pagina donde ese
  puente se invoca. Con los diferidos (window.PDI?.X?.y) el nombre y el metodo
  se pueden comprobar y aun asi el puente quedar mudo si esa pagina no carga X.
  Ocurre a proposito, no por descuido: los botones del modal de menor viven en
  el chrome, en las diez paginas, y BeneficiarioController solo se carga en el
  padron. Ahi el puente no puede encontrar a quien llamar, y no deberia: ese
  modal solo se abre desde el padron. Para eso hace falta saber que pagina
  carga que, y eso es trabajo de una prueba en el navegador, no de leer codigo.
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

LEGACY = os.path.join(APP, "js", "core", "legacy-globals.js")
VISTAS = os.path.join(APP, "js", "views")
PAGINAS = os.path.join(BASE, "src", "pages")  # las plantillas siguen en el proyecto

CARPETAS_JS = ["views", "controllers", "core", "utils", "models", "auth", "pages"]

# Globales que no son puentes: los pone el navegador o el propio proyecto.
#
# "app" esta aqui a proposito y no por descuido. No existe en ningun sitio del
# proyecto, y hay seis referencias que lo consultan con encadenamiento opcional,
# de modo que son inertes: nunca se cumple la condicion y la rama no llega a
# ejecutarse. SeAccepta como deuda y se deja anotado aqui para que al arreglarlo
# se borre de esta lista y el verificador empiece a vigilarlo.
GLOBALES_DEL_ENTORNO = {
    "PDI",
    "app",  # deuda documentada: ver la nota de arriba
    "alert",
    "confirm",
    "event",
    "history",
    "innerWidth",
    "location",
    "open",
    "print",
}

# Puentes que si se definen en dos sitios a proposito, con la razon.
#
# Los cuatro son botones de cerrar o guardar de los modales de voluntarios. Los
# botones estan en el chrome, que va en las diez paginas, mientras que
# VoluntariadosView solo se importa en la suya. Si el puente viviera en la vista,
# en las otras nueve paginas el boton de cerrar no tendria a quien llamar. Su
# dueno es legacy-globals.js y no la vista, y por eso no estan duplicados: estan
# en un solo sitio, el que puede atender a todos.
UN_DUENO_ASI = {
    "closeModalCapacitacionVoluntarias": "js/core/legacy-globals.js",
    "closeModalFichaVoluntario": "js/core/legacy-globals.js",
    "closeModalInscripcionVoluntario": "js/core/legacy-globals.js",
    "saveCapacitacionVoluntaria": "js/core/legacy-globals.js",
}

RE_VISTA_LLAMADA = re.compile(r"\bvista\(([^()]*)\)")
RE_PUENTE_OPCIONAL = re.compile(
    r"window\.PDI\?\.([A-Za-z_$][\w$]*)\?\.([A-Za-z_$][\w$]*)\?*\."
)
RE_METODO = re.compile(r"^  (?:static\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*[(=]", re.M)
RE_ATRIBUTO_JS = re.compile(r'on(?:click|input|change|submit)="([^"]+)"')
RE_GLOBAL = re.compile(r"\bwindow\.([A-Za-z_$][\w$]*)")

# Las tres de abajo son para el registro en window.PDI. Antes solo se miraba
# js/views, y todo lo demas se daba por bueno porque los puentes Resolvian a
# vistas. Ahora los puentes apuntan tambien a controladores, al nucleo y a los
# utiles, y todos se registran igual: cada modulo se cuelga de window.PDI al
# importarse. Asi que hay que saber leer los dos estilos de registro.
#
#   RE_REGISTRO   "window.PDI.Nombre = loQueSea"  (con o sin objeto detras)
#   RE_EXPORTADO  "export const Nombre = {"       (el objeto que se registra)
#   RE_MIEMBRO    un miembro directo de un objeto, a cualquier indentacion
RE_REGISTRO = re.compile(r"window\.PDI\.([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)?\s*\{?")
RE_EXPORTADO = re.compile(r"export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*\{")
RE_MIEMBRO = re.compile(
    r"^\s*(?:static\s+|async\s+|get\s+|set\s+)*([A-Za-z_$][\w$]*)\s*(?:\(|=|:|,|\?|\}|$)"
)

# Cualquier identificador suelto dentro de un atributo on*. Solo se usa para la
# lista informativa D, no para fallar: el marcado llama a los puentes con y sin
# el prefijo window, y alguna vez a traves de un objeto ("nav.toggleSidebar()").
# Contar de mas solo hace la lista D mas corta, y un puente que aparece sin
# usarse no es un fallo: es codigo muerto, que es justo lo que D quiere senalar.
RE_IDENTIFICADOR = re.compile(r"[A-Za-z_$][\w$]*")

# Una llamada a un puente desde el codigo: el nombre solo, o detras de window. o de
# nav., seguido de parentesis de apertura.
RE_LLAMADA = re.compile(r"(?:window|nav|self|globalThis)\.([A-Za-z_$][\w$]*)\s*\(|(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(")


def leer(ruta):
    with io.open(ruta, encoding="utf-8") as f:
        return f.read()


def sin_comentarios(lineas):
    """Quita los comentarios de linea y de bloque.

    Sin esto, el propio comentario que explica el fallo de vista() se contaria
    como una llamada mas, y el verificador protestaria sobre su propia nota.
    """
    limpio = []
    dentro = False
    for linea in lineas:
        if dentro:
            if "*/" in linea:
                dentro = False
                limpio.append("")
            else:
                limpio.append("")
            continue
        if linea.strip().startswith("/*"):
            if "*/" not in linea:
                dentro = True
                limpio.append("")
            continue
        if linea.strip().startswith("//"):
            limpio.append("")
            continue
        limpio.append(linea.split("//", 1)[0])
    return limpio


def separar_argumentos(inside):
    """Parte una lista de argumentos por comas de primer nivel.

    No basta con partir por comas: un nombre podria llevar una coma dentro de
    una cadena, y partir a lo bruto contaria argumentos que no son.
    """
    partes = []
    actual = []
    cadena = None
    for caracter in inside:
        if cadena:
            actual.append(caracter)
            if caracter == cadena:
                cadena = None
            continue
        if caracter in "\"'":
            cadena = caracter
            actual.append(caracter)
            continue
        if caracter == ",":
            partes.append("".join(actual).strip())
            actual = []
            continue
        actual.append(caracter)
    if "".join(actual).strip():
        partes.append("".join(actual).strip())
    return partes


def miembros_de_objeto(lineas, inicio):
    """Nombres de los miembros DIRECTOS del objeto que abre en la linea 'inicio'.

    'inicio' es un indice de lista, base cero, y tiene que ser la linea donde
    aparece la llave de apertura. Se lleva la cuenta de las llaves y solo
    recoge miembros cuando esta al primer nivel. Sin eso tambien contaria los
    metodos de los metodos, y la comprobacion B dejaria de notar un nombre mal
    escrito: es justo lo que vigila, porque el encadenamiento opcional se come
    un metodo equivocado sin dar ningun error.
    """
    miembros = set()
    nivel = 0
    abierto = False
    for indice in range(inicio, len(lineas)):
        limpio = lineas[indice].split("//", 1)[0]
        if abierto and nivel == 1:
            encontrado = RE_MIEMBRO.match(limpio)
            if encontrado:
                miembros.add(encontrado.group(1))
        for caracter in limpio:
            if caracter == "{":
                nivel += 1
                abierto = True
            elif caracter == "}":
                nivel -= 1
                if abierto and nivel <= 0:
                    return miembros
    return miembros


def modulos_registrados():
    """Nombre en window.PDI -> miembros que ese modulo expone.

    Hay dos formas de registrarse y las dos cuentan:

      1. Reutilizando un objeto ya declarado, que es lo que hacen casi todos:
         los controladores, los modelos, las vistas y el nucleo hacen
         "export const X = { ... }" y al final "window.PDI.X = X".

      2. Con un objeto en linea, sin nombre: es lo que hace Bootstrap, que
         escribe "window.PDI.Bootstrap = { arrancarComun, publicarRefresco }".

    Solo con mirar la primera, el verificador VIA COMO REGISTRADOS a los
    controladores que ahora registran los puentes, y daba por buenos 19 puentes
    que no podia comprobar. Con las dos, se vuelven a comprobar.
    """
    archivos = []
    for carpeta in CARPETAS_JS:
        raiz = os.path.join(APP, "js", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if entrada.endswith(".js"):
                archivos.append(os.path.join(raiz, entrada))

    # Primero, que objetos exporta cada archivo y con que miembros.
    exportados = {}
    registros = []
    for ruta in archivos:
        lineas = leer(ruta).split("\n")
        for numero, linea in enumerate(lineas, 1):
            exportado = RE_EXPORTADO.search(linea)
            if exportado:
                exportados[exportado.group(1)] = miembros_de_objeto(lineas, numero - 1)
            registro = RE_REGISTRO.search(linea)
            if registro and "PDI" != registro.group(1):
                registros.append((registro.group(1), registro.group(2), ruta, numero))

    tabla = {}
    for nombre, reexportado, ruta, numero in registros:
        if reexportado and reexportado in exportados:
            tabla[nombre] = exportados[reexportado]
        elif not reexportado:
            tabla[nombre] = miembros_de_objeto(leer(ruta).split("\n"), numero - 1)
    return tabla


def puentes_por_archivo():
    """Nombre del puente -> conjunto de archivos de js/ que lo definen.

    Devuelve un conjunto y no un unico archivo a proposito: esa es la manera de
    que la comprobacion E vea los duplicados. No basta con mirar legacy-globals:
    la paginacion del padron y la ficha del voluntario definen sus propios puentes
    al final de la vista, y buscarlos solo en legacy-globals los daria por
    inexistentes.
    """
    tabla = {}
    for carpeta in CARPETAS_JS:
        raiz = os.path.join(APP, "js", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if not entrada.endswith(".js"):
                continue
            texto = sin_comentarios(leer(os.path.join(raiz, entrada)).split("\n"))
            for linea in texto:
                for nombre in re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=", linea):
                    if nombre in GLOBALES_DEL_ENTORNO:
                        continue
                    tabla.setdefault(nombre, set()).add("js/%s/%s" % (carpeta, entrada))
    return tabla


def atributos_con_eventos():
    """(archivo, linea, fragmento) de cada atributo on*=, de paginas, chrome y codigo.

    El chrome va aparte porque va en todas las paginas: los botones de cerrar los
    modales viven en src/chrome/modals.html y no aparecen en ningun archivo de
    src/pages, asi que si no se lee, sus puentes parecen no usarse nunca.
    """
    hallazgos = []
    for carpeta in ("pages", "chrome"):
        raiz = os.path.join(BASE, "src", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if not entrada.endswith(".html"):
                continue
            for numero, linea in enumerate(leer(os.path.join(raiz, entrada)).split("\n"), 1):
                for fragmento in RE_ATRIBUTO_JS.findall(linea):
                    hallazgos.append(("src/%s/%s" % (carpeta, entrada), numero, fragmento))
    for carpeta in CARPETAS_JS:
        raiz = os.path.join(APP, "js", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if not entrada.endswith(".js"):
                continue
            for numero, linea in enumerate(leer(os.path.join(raiz, entrada)).split("\n"), 1):
                for fragmento in RE_ATRIBUTO_JS.findall(linea):
                    hallazgos.append(("js/%s/%s" % (carpeta, entrada), numero, fragmento))
    return hallazgos


def llamadas_en_codigo():
    """Puentes que el codigo invoca, aunque no sea desde un atributo on*.

    La lista D miraba solo el markup, y ahi el falso positivo era de manual: casi
    todos los puentes se llaman tambien desde el propio JavaScript, con o sin el
    prefijo window. Este recorrido recoge esos nombres para que la lista senale de
    verdad los puentes que nadie toca.
    """
    nombres = set()
    for carpeta in CARPETAS_JS:
        raiz = os.path.join(APP, "js", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if not entrada.endswith(".js"):
                continue
            texto = sin_comentarios(leer(os.path.join(raiz, entrada)).split("\n"))
            for linea in texto:
                for grupo in RE_LLAMADA.findall(linea):
                    for nombre in grupo:
                        if nombre:
                            nombres.add(nombre)
    return nombres


def comprobar():
    fallos = []
    avisos = []

    metodos = modulos_registrados()
    definidos = puentes_por_archivo()
    texto_legacy = leer(LEGACY)
    codigo_legacy = sin_comentarios(texto_legacy.split("\n"))

    # ------------------------------------------------------------------ A
    llamadas = []
    for numero, linea in enumerate(codigo_legacy, 1):
        for argumentos in RE_VISTA_LLAMADA.findall(linea):
            partes = separar_argumentos(argumentos)
            llamadas.append((numero, argumentos, partes))
            if len(partes) != 2:
                fallos.append(
                    "A  legacy-globals.js L%d: vista(%s) recibe %d argumento(s) y "
                    "declara 2. El segundo se descarta y el puente queda mudo."
                    % (numero, argumentos.strip(), len(partes))
                )

    # ------------------------------------------------------------------ B
    for numero, argumentos, partes in llamadas:
        if len(partes) != 2:
            continue
        vista, metodo = partes[0].strip('"'), partes[1].strip('"')
        if vista not in metodos:
            fallos.append(
                "B  legacy-globals.js L%d: la vista %s no se registra en window.PDI."
                % (numero, vista)
            )
        elif metodo not in metodos[vista]:
            fallos.append(
                "B  legacy-globals.js L%d: %s no declara %s. El puente queda mudo."
                % (numero, vista, metodo)
            )

    # Los puentes diferidos (window.PDI?.X?.y) se comprueban en TODO js/, no solo
    # en legacy-globals. Antes vivian casi todos en ese archivo, asi que mirar
    # solo ahi bastaba; hoy hay puentes iguales en core/Theme.js y en las vistas,
    # y un nombre mal escrito en cualquiera de ellos se comeria igual de
    # silencioso. El mensaje dice el archivo para que se sepa donde mirar.
    for carpeta in CARPETAS_JS:
        raiz = os.path.join(APP, "js", carpeta)
        if not os.path.isdir(raiz):
            continue
        for entrada in sorted(os.listdir(raiz)):
            if not entrada.endswith(".js"):
                continue
            etiqueta = "js/%s/%s" % (carpeta, entrada)
            lineas = sin_comentarios(leer(os.path.join(raiz, entrada)).split("\n"))
            for numero, linea in enumerate(lineas, 1):
                for vista, metodo in RE_PUENTE_OPCIONAL.findall(linea):
                    if vista not in metodos:
                        fallos.append(
                            "B  %s L%d: window.PDI?.%s no se registra. Ningun modulo "
                            "se cuelga de window.PDI con ese nombre, asi que el "
                            "puente nunca encontrara a quien llamar."
                            % (etiqueta, numero, vista)
                        )
                    elif metodo not in metodos[vista]:
                        fallos.append(
                            "B  %s L%d: %s no declara %s. El puente queda mudo."
                            % (etiqueta, numero, vista, metodo)
                        )

    # ------------------------------------------------------------------ C
    invocados = set()
    nombrados = set()
    for origen, numero, fragmento in atributos_con_eventos():
        for nombre in RE_GLOBAL.findall(fragmento):
            if nombre in GLOBALES_DEL_ENTORNO:
                continue
            invocados.add(nombre)
            nombrados.add(nombre)
            if nombre not in definidos:
                fallos.append(
                    "C  %s L%d llama a window.%s y ningun archivo de js/ lo define."
                    % (origen, numero, nombre)
                )
        nombrados.update(RE_IDENTIFICADOR.findall(fragmento))

    # ------------------------------------------------------------------ D
    nombrados |= llamadas_en_codigo()
    sin_usar = sorted(n for n in definidos if n not in nombrados)

    # ------------------------------------------------------------------ E
    for nombre, archivos in sorted(definidos.items()):
        if len(archivos) < 2:
            continue
        dueno_declarado = UN_DUENO_ASI.get(nombre)
        if dueno_declarado is not None:
            if archivos == {dueno_declarado}:
                continue
            fallos.append(
                "E  window.%s tiene %d duenos (%s), pero UN_DUENO_ASI declara que "
                "solo puede estar en %s."
                % (nombre, len(archivos), ", ".join(sorted(archivos)), dueno_declarado)
            )
        else:
            fallos.append(
                "E  window.%s esta definido en %d sitios a la vez: %s. Gana el "
                "ultimo que se evalua y depende del orden de las importaciones, "
                "asi que el fallo aparece o desaparece sin tocar este codigo. "
                "Deja un solo dueno; si de verdad hacen falta los dos, "
                "declaralo en UN_DUENO_ASI con el motivo."
                % (nombre, len(archivos), ", ".join(sorted(archivos)))
            )

    return fallos, avisos, sin_usar, len(llamadas), metodos, definidos


def main():
    fallos, avisos, sin_usar, llamadas, metodos, definidos = comprobar()

    print("  modulos registrados en window.PDI: %d" % len(metodos))
    print("  puentes definidos en todo js/:       %d" % len(definidos))
    print("  puentes construidos con vista():     %d" % llamadas)
    print("")

    if fallos:
        print("  [FALLA] %d problema(s):" % len(fallos))
        for fallo in fallos:
            print("      %s" % fallo)
        return 1

    print("  A  las %d llamadas a vista() pasan los dos argumentos que declara." % llamadas)
    print("  B  Todo metodo que nombra un puente existe, en vistas, controladores,")
    print("     nucleo y utiles, y en todo js/.")
    print("  C  Todo puente que el marcado invoca existe, incluidos los botones")
    print("     que dibuja el codigo y no estan en src/pages.")
    print("  E  Ningun puente esta definido en dos sitios a la vez.")

    if avisos:
        print("")
        print("  [AVISO] %d:" % len(avisos))
        for aviso in avisos:
            print("      %s" % aviso)

    print("")
    print("  D  [INFO] %d puentes que ni el markup ni el codigo invocan." % len(sin_usar))
    print("     No es un fallo, y no siempre es codigo muerto: puede que se invoquen")
    print("     con una forma que esta lista no ve. Es una lista para decidir:")
    for nombre in sin_usar:
        print("      %-34s %s" % (nombre, ", ".join(sorted(definidos[nombre]))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
