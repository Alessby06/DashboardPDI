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
     vista() y los que invocan window.PDI?.Vista?.metodo?.().

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

Las comprobaciones B y C comparten el problema de las vistas, asi que este
archivo necesita saber que vista corresponde a cada nombre de window.PDI y que
metodos declara cada una. Eso lo lee de los propios archivos de js/views, sin
inventar ningun manifiesto: si una vista no se registra, no existe para el
codigo que la busca, y el verificador deberia decirlo.

Se ejecuta asi:

    python verificar_puentes.py

Devuelve 1 si algo falla, para poder encadenarlo con los demas verificadores.
"""

import io
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))

LEGACY = os.path.join(BASE, "js", "core", "legacy-globals.js")
VISTAS = os.path.join(BASE, "js", "views")
PAGINAS = os.path.join(BASE, "src", "pages")

CARPETAS_JS = ["views", "core", "utils", "models", "auth", "pages"]

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
RE_REGISTRO = re.compile(r"window\.PDI\.([A-Za-z_$][\w$]*)\s*=")
RE_METODO = re.compile(r"^  (?:static\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*[(=]", re.M)
RE_ATRIBUTO_JS = re.compile(r'on(?:click|input|change|submit)="([^"]+)"')
RE_GLOBAL = re.compile(r"\bwindow\.([A-Za-z_$][\w$]*)")

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


def metodos_por_vista():
    """Nombre en window.PDI -> metodos que declara la vista."""
    tabla = {}
    for entrada in sorted(os.listdir(VISTAS)):
        if not entrada.endswith(".js"):
            continue
        texto = leer(os.path.join(VISTAS, entrada))
        registro = RE_REGISTRO.search(texto)
        if registro:
            tabla[registro.group(1)] = {m.group(1) for m in RE_METODO.finditer(texto)}
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
        raiz = os.path.join(BASE, "js", carpeta)
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
        raiz = os.path.join(BASE, "js", carpeta)
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
        raiz = os.path.join(BASE, "js", carpeta)
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

    metodos = metodos_por_vista()
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

    for numero, linea in enumerate(codigo_legacy, 1):
        for vista, metodo in RE_PUENTE_OPCIONAL.findall(linea):
            if vista not in metodos:
                fallos.append(
                    "B  legacy-globals.js L%d: window.PDI?.%s no se registra."
                    % (numero, vista)
                )
            elif metodo not in metodos[vista]:
                fallos.append(
                    "B  legacy-globals.js L%d: %s no declara %s. El puente queda mudo."
                    % (numero, vista, metodo)
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

    print("  vistas registradas en window.PDI: %d" % len(metodos))
    print("  puentes definidos en todo js/:    %d" % len(definidos))
    print("  puentes construidos con vista():  %d" % llamadas)
    print("")

    if fallos:
        print("  [FALLA] %d problema(s):" % len(fallos))
        for fallo in fallos:
            print("      %s" % fallo)
        return 1

    print("  A  las %d llamadas a vista() pasan los dos argumentos que declara." % llamadas)
    print("  B  Toda vista y todo metodo que nombra un puente existe.")
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
