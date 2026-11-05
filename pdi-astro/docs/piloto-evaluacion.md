# Piloto de evaluación socioeconómica

## Objetivo

Comprobar que el sistema calcula el mismo puntaje, clasificación y exoneración que la hoja oficial `Evaluación Socioeconómica.xlsx` en **5 casos reales**, antes de extender la evaluación a toda la operación.

## Requisitos

- 5 casos reales, activos y con expediente completo.
- Una evaluación aprobada por caso en el sistema.
- La misma ficha llena en el Excel oficial por el Área.
- Un responsable de Trabajo Social y una persona de Coordinación que firme el cierre.

No se pueden usar los casos de demostración. Los casos sin `origen` o con `origen = seed` quedan fuera del piloto.

## Flujo

1. **Elegir los 5 casos** con Coordinación. Deben ser casos reales, no semilla.
2. **Evaluar en el sistema** desde el caso o el expediente: `/evaluacion`.
3. **Llenar el Excel oficial** para esos mismos 5 casos.
4. **Completar el CSV** `docs/piloto-evaluacion.csv` con:
   - `codigo`: código del caso o del usuario.
   - `usuario`: nombre, solo para lectura.
   - `puntaje_excel`: puntaje total del Excel.
   - `clasificacion_excel`: clasificación del Excel.
   - `exoneracion_excel`: 100%, 50% o 0%.
   - `observaciones`: diferencias, dudas o criterios aplicados.
5. **Ejecutar la comparación**:

```powershell
node scripts/piloto-evaluacion.mjs --auditar
node scripts/piloto-evaluacion.mjs --template
node scripts/piloto-evaluacion.mjs --excel docs/piloto-evaluacion.csv
```

6. **Revisar** `docs/piloto-resultados.md`.
7. **Corregir** lo que marque `REVISAR` y repetir hasta que los 5 estén en `OK`.
8. **Firmar** el cierre del piloto con Coordinación.

## Criterio de aceptación

Un caso está `OK` cuando:

- La diferencia absoluta de puntaje es **≤ 0,5 puntos**.
- La clasificación coincide.
- La exoneración sugerida coincide.

El piloto se cierra con **5 de 5 en OK**. Si un caso no coincide, no se ajusta el Excel para que cuadre: se revisa el mapeo de campos, la rúbrica o el dato de origen.

## Estado actual

- Casos activos: 9.
- Casos reales con `origen` distinto de `seed`: **0**.
- Evaluaciones aprobadas: **0**.

Los 9 casos activos son datos de demostración y no tienen `origen` real. El piloto **no puede ejecutarse** hasta que el Área cargue los 5 casos reales o los marque con un origen real (`social`, `padron`, `expediente` o `importacion`).

## Auditoría

```powershell
node scripts/piloto-evaluacion.mjs --auditar
```

Muestra cuántos casos son reales, cuántos son semilla y cuántos no tienen origen. Es de solo lectura.

## Plantilla

```powershell
node scripts/piloto-evaluacion.mjs --template
```

Genera `docs/piloto-evaluacion.csv` con los casos reales disponibles. Si no hay casos reales, deja solo el encabezado y lo advierte. Usa `--force` para reemplazar una plantilla existente.

## Comparación

```powershell
node scripts/piloto-evaluacion.mjs --excel docs/piloto-evaluacion.csv
```

Genera `docs/piloto-resultados.md` con la tabla de los 5 casos, el delta, la clasificación, la exoneración y el estado. No escribe en la base.
