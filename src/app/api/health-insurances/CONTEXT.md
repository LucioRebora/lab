# Contexto: Obras Sociales (Health Insurance)

## Descripción
Este módulo gestiona la lista maestra de Obras Sociales y Prepagas disponibles para los laboratorios del sistema.

## Reglas de Datos
- **Entidades Principales:** `HealthInsurance` (la obra social en sí) y `PatientHealthInsurance` (el vínculo con el paciente).
- **Código Externo:** Se usa `codigoExterno` para sincronizar códigos de facturación con el sistema anterior (HMB).
- **Relaciones con el Paciente:**
  - El sistema permite asociar **múltiples coberturas** a un solo paciente.
  - La tabla intermedia guarda el `nroAfiliado` específico de cada vínculo.

## UI / UX
- Las obras sociales se asocian dentro del modal del paciente.
- Los estudios médicos (Protocolos) se vinculan a un paciente y a una de sus obras sociales activas.
- Paginación y búsqueda por nombre o código.
