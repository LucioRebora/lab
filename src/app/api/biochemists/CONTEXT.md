# Contexto: Bioquímicos

## Descripción
Este módulo gestiona la información de los profesionales bioquímicos habilitados en el sistema.

## Reglas de Datos
- **Entidad:** `Biochemist`.
- **Contacto:** 
  - Se gestionan campos de dirección completa.
  - **Email:** Incluido como campo de contacto principal. En el formulario de alta/edición, este campo se posiciona sobre la dirección para facilitar el contacto rápido.
- **Relaciones:** Los bioquímicos firman y son responsables de los estudios procesados en los laboratorios.

## UI / UX
- Formulario de gestión: `BiochemistModal`.
- Los campos están ordenados lógicamente priorizando contacto digital (email) seguido de ubicación física.
