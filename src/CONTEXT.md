# Contexto Global: Proyecto Bioitia

## Arquitectura del Proyecto
- **Frontend:** Next.js con `App Router`, React, Tailwind CSS y Framer Motion para animaciones premium.
- **Backend:** API Routes en `/src/app/api/` usando Next.js.
- **Base de Datos:** PostgreSQL administrado por **Prisma ORM**.
- **Autenticación:** NextAuth.js para manejo de sesiones y roles de usuario.

## Estándares de Código
- **Tipado:** TypeScript estricto para reducir errores en runtime.
- **Componentes:** Se usan modales (`PatientModal`, `DoctorModal`, etc.) y componentes de UI consistentes para una experiencia premium.
- **Paginación:** Siempre server-side para listados grandes (como los 28.600+ pacientes).
- **Laboratorios:** Casi todos los registros están filtrados por `laboratoryId` para multi-tenancy.

## Módulos Principales
- **Pacientes:** `src/app/api/patients/` (Documentos opcionales en DB pero obligatorios en UI, limpieza de teléfonos, fechas nulas).
- **Obras Sociales:** `src/app/api/health-insurances/` (Múltiples coberturas por paciente con número de afiliado).
- **Protocolos / Turnos:** `src/app/api/protocols/`
  - **Veterinaria:** Incluye campos específicos para mascotas (Especie, Nombre Mascota) y propietario. Análisis como "Coagulograma" agregados.
  - **PRP (Plasma Rico en Plaquetas):** Gestión de turnos con acciones rápidas de cambio de estado desde la tabla.
  - **Derivaciones:** Estudios enviados a laboratorios externos.
- **Bioquímicos:** Gestión de profesionales con campos de contacto, incluyendo Email (ubicado sobre la dirección en formularios).
- **Auditoría:** `src/app/api/audit-logs/` (Registro de cambios de estado y acciones de usuario).
- **Ajustes:** `src/app/api/settings/` (Configuración de laboratorios y usuarios).

## UI / Layout
- **Dashboard:** Layout optimizado con "Consultas Recientes" ocupando el ancho total (3 columnas) en la parte inferior.
- **Sidebar:** Navegación organizada con secciones administrativas y operativas ("Veterinarias", "Auditoría", "Pacientes").
- **Estética:** Diseño premium con Framer Motion, micro-animaciones y consistencia de colores para estados.

## Sincronización y Migración
- **Importación HMB:** Se migraron **28.662** pacientes desde CSV legacy.
- **Limpieza de Datos:** Automática para remover documentos "SN-", años 1900 y normalizar teléfonos (prioridad 15/celular).
- **Código Externo:** Mapeado en `Patient`, `HealthInsurance` e `Intermedia` para sincronía con sistemas externos.

## Historial de Cambios Críticos (Índice de Pedidos)
1. **[Migración Pacientes]:** Carga masiva + Limpieza (Docs null, Fechas null).
2. **[Dualidad de Validación]:** DB admite nulos (flexibilidad), pero UI exige campos (rigurosidad).
3. **[Obras Sociales]:** Implementación de asociación múltiple con número de afiliado persistente.
4. **[Protocolos Veterinarios]:** Adaptación de la ficha para mascotas (Especie, Nombre) con nuevos análisis (Coagulograma).
5. **[PRP Workflow]:** Optimización de botones de acción rápida en tablas para cambios de estado directos.
6. **[Auditoría]:** Creación del sistema de logs para trazabilidad total de acciones por usuario.
7. **[UI/UX]:** Ajuste de Dashboard (3 columnas), Sidebar (Iconos y textos) y eliminación de estilos invasivos (fondo azul en botones).
8. **[Entidad Bioquímicos]:** Agregado de Email y ajuste de prioridad visual en formularios.
