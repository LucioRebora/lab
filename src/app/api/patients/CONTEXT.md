# Contexto: Pacientes

## Descripción
Este módulo gestiona toda la información de los pacientes del laboratorio. Es la entidad central para protocolos y atención médica.

## Reglas de Datos (Migración y Validación)
- **DNI/Documento:** 
  - Se guarda como `String`. 
  - Limpieza: Se eliminan puntos, espacios y letras. Solo quedan números.
  - Opcionalidad: Es opcional en la DB (admite `null`) para soportar migraciones incompletas, pero el **Frontend le exige** al usuario completarlo obligatoriamente.
- **Fecha de Nacimiento:**
  - Se guarda como `DateTime`.
  - Limpieza: Si el año es `1900` o está vacía, se almacena como `null`.
  - El Frontend calcula la edad automáticamente pero permite edición manual.
- **Teléfonos:**
  - Se unifican los campos `TelefonoCasa`, `TelefonoTrabajo` y `TelefonoOtro` del sistema externo.
  - Prioridad: Se prefiere el celular (detectado por el código "15").
  - Formato: Solo números, limpieza total de símbolos.
- **Codigo Externo:**
  - Campo `codigoExterno` usado para sincronización con sistemas de facturación o gestión externos. Solo para backend, no visible en UI por defecto.

## Relaciones
- **Laboratorio:** Cada paciente pertenece a un `LaboratoryId`.
- **Coberturas:** Un paciente puede tener múltiples obras sociales a través de la tabla intermedia `PatientHealthInsurance`.
- **Protocolos:** Relación 1:N con los estudios/turnos del paciente.

## UI / UX
- Modal de edición: `src/components/admin/PatientModal.tsx`.
- Listado: Server-side pagination con filtros por nombre y DNI.
