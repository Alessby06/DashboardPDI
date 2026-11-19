# Seguimiento de la auditoria 001

- Fecha: 2026-11-19
- Archivo corregido: `src/pages/login.astro`
- Hallazgos aprobados: 1, 2 y 3
- No se tocaron otros archivos de interfaz

## Correcciones aplicadas

### Hallazgo 1, R-02: resuelto

Los cuatro usos de guion em en texto visible se sustituyeron por seis puntos medios como placeholder honesto del codigo de recuperacion:

- Linea 1588, contenido inicial de `#recCodigo`.
- Linea 1972, reinicio al abrir el dialogo.
- Linea 2002, respuesta sin codigo del servidor.
- Linea 2038, guarda del boton Copiar.

Queda un guion em en la linea 4, dentro de un comentario de codigo. No es texto de interfaz y no entra en el alcance de R-02.

### Hallazgo 2, R-06 y R-20: resuelto

- `.control input` baja de 16px a 15px en la base, con el comentario `Token body de DESIGN.md: el dato escrito no compite con la accion.`
- El valor de 16px se conserva solo dentro de `@media (any-pointer: coarse)`, con el comentario `En pantallas tactiles 16px evita el zoom automatico de iOS al enfocar.`

Jerarquia resultante en la tarjeta: h1 26px, input 15px, sub y boton 14px, label 12px. El campo ya no supera al token body del sistema.

### Hallazgo 3, R-31 y R-11: resuelto

- Padding de tarjeta de 24px a 22px, segun `components.card.padding`.
- Padding horizontal del input de 16px a 14px, segun `components.input.padding`.
- Radios de control, boton, chip, avisos y dialogo de 8px a 10px, segun `rounded.md`.
- El label se mantiene en 12px/500/sin tracking y la excepcion queda escrita en un comentario junto a la regla, con su razon de legibilidad.

## Verificacion

- `npm run build`: COMPLETO, 17 paginas generadas, incluida `/login/index.html`, sin errores.
- Busqueda de guion em en `login.astro`: solo el comentario de la linea 4.
- Diff revisado: 21 inserciones y 18 eliminaciones, limitadas a `login.astro`.
- No hubo click-through en vivo: el servidor de desarrollo devolvio 502 y no se inicio uno nuevo por la regla del proyecto.

## Delivery Gate, estado final

- R-02 PASS: sin guion em en texto de interfaz.
- R-06, R-20, R-31, R-11 PASS: jerarquia y tokens alineados con `DESIGN.md`, con razones escritas para las excepciones.
- R-37 PASS: direccion existente en `DESIGN.md`.
- R-01, R-04, R-09, R-10, R-13 PASS: sin degradados, glows, badges de IA, glass ni iconos decorativos.
- R-25 PASS por calculo: placeholder 4.53:1, sobre el minimo de 4.5:1.
- R-26 y R-32 PASS por inspeccion de codigo: tema, ojo de contrasena, dialogo y envio tienen comportamiento; foco visible, skip link y nombres accesibles.
- R-34 PASS por inspeccion de codigo: ambos temas definidos.
- R-03 y R-39 PASS por inspeccion de codigo: breakpoints, objetivos tactiles y semantica.
- R-35 PARCIAL: build PASS, click-through NO VERIFICADO por el servidor caido.

Estado global: sin hallazgos abiertos. Queda unicamente la reserva de verificacion en vivo de R-35, que depende de que el servidor de desarrollo este disponible.
