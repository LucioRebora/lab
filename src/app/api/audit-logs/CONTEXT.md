# Contexto: Auditoría (Audit Log)

## Descripción
Este módulo registra cronológicamente las acciones críticas y cambios de estado en el sistema para control interno.

## Reglas de Registro
- **Acción:** `ACTION_TYPE` (Ej: `STATUS_CHANGE`, `CREATE_PATIENT`, `DELETE`).
- **Recurso:** Qué entidad fue afectada (`PATIENT`, `PROTOCOL`).
- **Datos Detallados:** Se guarda el valor anterior (`oldValue`) y el nuevo valor (`newValue`) en formato JSON.
- **Usuario:** El `userId` de quien realizó el cambio será registrado.

## UI / UX
- Acceso desde la barra lateral bajo la sección "Auditoría".
- Vista: Tabla con filtros por fecha, laboratorio y tipo de acción.
- Colores: Mantiene la consistencia con los colores de estados (`PENDIENTE`, `REALIZADO`, etc.).
