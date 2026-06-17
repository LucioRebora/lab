# Contexto: Protocolos (Turnos y Estudios)

## Descripción
Este es el corazón de la operación diaria del laboratorio. Gestiona las citas, estudios y resultados de cada paciente.

## Reglas de Datos
- **Entidad:** `Protocol`.
- **Relaciones:** Se vincula a un `Patient`, un `Doctor` y un `Laboratory`.
- **Estado (Status):** 
  - `PENDIENTE`: Turno asignado pero no realizado.
  - `REALIZADO`: Los estudios han sido tomados.
  - `CANCELADO`: No se llevó a cabo.
  - `ENTREGADO`: El informe final ya fue entregado al paciente.
- **Veterinaria:** 
  - Gestión específica de mascotas con campos: `Especie` (select), `Nombre Mascota` y `Propietario`.
  - Estudios específicos como `Coagulograma` añadidos al catálogo de análisis.
- **PRP (Plasma Rico en Plaquetas):**
  - Interfaz de tabla con botones de acción directa para cambio de estado ("Confirmar Turno", "Marcar como Realizado") según el estado actual.
- **Derivaciones:** Estudios enviados a laboratorios externos.

## UI / UX
- Los turnos se listan por día y laboratorio.
- Modales dinámicos para cambiar el estado rápidamente desde el listado.
- Sistema de Auditoría: Se registran los cambios de estado en `AuditLog`.
