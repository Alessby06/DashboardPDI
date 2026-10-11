---
name: PDI Johannes Gutenberg
description: Sistema de Gestión Social y Pastoral Infantil
colors:
  brand-primary: "#0f766e"
  brand-soft: "#f0fdfa"
  gt-blue: "#0284c7"
  gt-red: "#dc2626"
  gt-yellow: "#d97706"
  gt-green: "#16a34a"
  surface-1: "#ffffff"
  surface-2: "#f8fafc"
  border-subtle: "#e2e8f0"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
---

## Overview
Sistema de diseño centrado en el operador ("Operate Mode") para gestión de casos de menores vulnerables en comunidades vulnerables. Prioriza legibilidad, escaneo rápido en pantallas de escritorio y tablets, estados claros y cero ambigüedad en autorizaciones críticas.

## Colors
- **Brand Primary**: Teal institucional `#0f766e` con acento suave `#f0fdfa`.
- **Semántica de Casos**:
  - Alerta / Alta Urgencia: Rojo `#dc2626`
  - En Evaluación / Media Urgencia: Amarillo / Ámbar `#d97706`
  - Canalizados: Azul `#0284c7`
  - Cerrados / Favorable: Verde `#16a34a`
- **Superficies**: Neutrales limpios en modo claro (`#ffffff`, `#f8fafc`) y modo oscuro accesible.

## Typography
- Familia única sans-serif: `Plus Jakarta Sans`, `Inter`, `system-ui`.
- Escala fija optimizada para densidad de datos (12px etiquetas, 13-14px cuerpo, 16-20px encabezados).

## Layout
- Shell con Sidebar lateral izquierdo fijo/colapsable (38px altura de botón de navegación).
- Área de trabajo principal con cabecera de contexto y contenido estructurado por tarjetas.

## Elevation & Depth
- Sombras sutiles de borde (`box-shadow: 0 1px 3px rgba(0,0,0,0.06)`).
- Bordes definidos con `var(--border-subtle)`.

## Components
- **Kanban Card**: Indicador lateral de color según urgencia, link monoespaciado para código de menor, botones de avance/retroceso táctiles.
- **Pills & Badges**: Etiquetas de estado y contadores de notificación de 18px de altura mínima.
- **Alert Banners**: Bloques de aviso contextual para acciones pendientes de revisión.

## Do's and Don'ts
- **DO**: Mantener una navegación plana, uniforme y predecible en el menú lateral.
- **DO**: Reflejar fielmente los nombres oficiales de etapas: *Pendientes / Alerta*, *En Evaluación Social*, *Canalizados (DEMUNA / BTF)*, *Cerrados con Informe*.
- **DON'T**: Anidar submenús desordenados con sangrías que rompan la verticalidad y el ritmo visual del sidebar.
- **DON'T**: Mostrar secciones de aprobación a operadores ni historiales de solicitud a coordinadores generales.
