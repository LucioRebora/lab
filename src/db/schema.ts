import { pgTable, uniqueIndex, foreignKey, text, timestamp, boolean, doublePrecision, index, jsonb, integer, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const stringFormatType = pgEnum("StringFormatType", ['TEXT', 'INTEGER', 'DECIMAL_1', 'DECIMAL_2'])


export const abbreviation = pgTable("LAB_abbreviation", {
	id: text().primaryKey().notNull(),
	resultado: text().notNull(),
	abreviatura: text().notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("abbreviation_resultado_codigo_externo_laboratory_id_key").using("btree", table.resultado.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "abbreviation_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const additional = pgTable("LAB_additional", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	abreviatura: text(),
	codigo: text(),
	agregarSiempre: boolean("agregar_siempre").default(false).notNull(),
	agregarEnUrgencia: boolean("agregar_en_urgencia").default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("additional_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("additional_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "additional_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const additionalPricesOsConfig = pgTable("LAB_additional_prices_os_config", {
	id: text().primaryKey().notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	additionalId: text("additional_id").notNull(),
	montoFijo: doublePrecision("monto_fijo").default(0),
	porcentajeSp: doublePrecision("porcentaje_sp").default(0),
	enLista: boolean("en_lista").default(true).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("additional_prices_os_config_health_insurance_id_additional__key").using("btree", table.healthInsuranceId.asc().nullsLast().op("text_ops"), table.additionalId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.additionalId],
			foreignColumns: [additional.id],
			name: "additional_prices_os_config_additional_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "additional_prices_os_config_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "additional_prices_os_config_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const aspect = pgTable("LAB_aspect", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	descripcion: text(),
	codigoExterno: text("codigo_externo"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("aspect_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "aspect_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const auditLog = pgTable("LAB_audit_log", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	userName: text("user_name"),
	action: text().notNull(),
	entity: text(),
	entityId: text("entity_id"),
	details: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	laboratoryId: text("laboratory_id"),
}, (table) => [
	index("audit_log_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_log_entity_id_entity_idx").using("btree", table.entityId.asc().nullsLast().op("text_ops"), table.entity.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "audit_log_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const biochemist = pgTable("LAB_biochemist", {
	id: text().primaryKey().notNull(),
	apellido: text().notNull(),
	nombre: text().notNull(),
	tratamiento: text(),
	codigo: text(),
	direccion: text(),
	ciudad: text(),
	provincia: text(),
	codigoPostal: text("codigo_postal"),
	telefono: text(),
	celular: text(),
	notas: text(),
	firmante: boolean().default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "biochemist_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const budget = pgTable("LAB_budget", {
	id: text().primaryKey().notNull(),
	paciente: text(),
	total: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	telefono: text(),
	sentAt: timestamp("sent_at", { precision: 3, mode: 'string' }),
	laboratoryId: text("laboratory_id"),
	healthInsuranceId: text("health_insurance_id"),
}, (table) => [
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "budget_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "budget_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const budgetItem = pgTable("LAB_budget_item", {
	id: text().primaryKey().notNull(),
	budgetId: text("budget_id").notNull(),
	codigo: integer(),
	nombre: text().notNull(),
	ub: doublePrecision(),
	valor: doublePrecision().notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	healthInsuranceNombre: text("health_insurance_nombre").notNull(),
	determinationId: text("determination_id"),
	additionalId: text("additional_id"),
}, (table) => [
	foreignKey({
			columns: [table.additionalId],
			foreignColumns: [additional.id],
			name: "budget_item_additional_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.budgetId],
			foreignColumns: [budget.id],
			name: "budget_item_budget_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.determinationId],
			foreignColumns: [determination.id],
			name: "budget_item_determination_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "budget_item_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const calculatorStep = pgTable("LAB_calculator_step", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	subDeterminationId: text("sub_determination_id").notNull(),
	tipoOperacion: text("tipo_operacion").notNull(),
	argumentoNumerico: doublePrecision("argumento_numerico").default(0),
	argumentoIdSubDete: text("argumento_id_sub_dete"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("calculator_step_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	index("calculator_step_sub_determination_id_idx").using("btree", table.subDeterminationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "calculator_step_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.subDeterminationId],
			foreignColumns: [subDetermination.id],
			name: "calculator_step_sub_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const cover = pgTable("LAB_cover", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	abreviatura: text(),
	direccion: text(),
	ciudad: text(),
	provincia: text(),
	codigoPostal: text("codigo_postal"),
	telefono: text(),
	fax: text(),
	celular: text(),
	email: text(),
	comentario1: text(),
	comentario2: text(),
	comentario3: text(),
	comentario4: text(),
	comentario5: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "cover_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const currentAccount = pgTable("LAB_current_account", {
	id: text().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	fecha: timestamp({ precision: 3, mode: 'string' }),
	concepto: text(),
	debe: doublePrecision().default(0).notNull(),
	haber: doublePrecision().default(0).notNull(),
	saldo: doublePrecision().default(0).notNull(),
	tipoCom: text("tipo_com"),
	idCom: text("id_com"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "current_account_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patient.id],
			name: "current_account_patient_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const equipmentToLaboratory = pgTable("_LAB_EquipmentToLaboratory", {
	a: text("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_EquipmentToLaboratory_AB_unique").using("btree", table.a.asc().nullsLast().op("text_ops"), table.b.asc().nullsLast().op("text_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [equipment.id],
			name: "_EquipmentToLaboratory_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [laboratory.id],
			name: "_EquipmentToLaboratory_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const equipmentConfig = pgTable("LAB_equipment_config", {
	id: text().primaryKey().notNull(),
	equipmentId: text("equipment_id").notNull(),
	laboratoryId: text("laboratory_id").notNull(),
	config: jsonb().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("equipment_config_equipment_id_laboratory_id_key").using("btree", table.equipmentId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.equipmentId],
			foreignColumns: [equipment.id],
			name: "equipment_config_equipment_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "equipment_config_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const healthInsurance = pgTable("LAB_health_insurance", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	contado: boolean().default(false).notNull(),
	cortada: boolean().default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
	selectorRtr: integer("selector_rtr").default(0),
	valorNbu: doublePrecision("valor_nbu").default(0),
}, (table) => [
	uniqueIndex("health_insurance_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("health_insurance_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "health_insurance_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const externalRecord = pgTable("LAB_external_record", {
	id: text().primaryKey().notNull(),
	nombreTabla: text("nombre_tabla").notNull(),
	datos: jsonb().notNull(),
	codigoExterno: text("codigo_externo"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	procesado: integer().default(0).notNull(),
	error: text(),
	intentos: integer().default(0).notNull(),
}, (table) => [
	uniqueIndex("external_record_nombre_tabla_codigo_externo_laboratory_id_key").using("btree", table.nombreTabla.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "external_record_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const determination = pgTable("LAB_determination", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	abreviatura: text(),
	mensajeIngreso: text("mensaje_ingreso"),
	comentarioFijo: text("comentario_fijo"),
	aspecto: text(),
	condicionesMuestra: text("condiciones_muestra"),
	imprimirWorksheet: boolean("imprimir_worksheet").default(true).notNull(),
	resumirWorksheet: boolean("resumir_worksheet").default(false).notNull(),
	alturaWorksheet: doublePrecision("altura_worksheet"),
	sectionId: text("section_id"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	aspectId: text("aspect_id"),
	codigo: text(),
	codigoExterno: text("codigo_externo"),
	methodId: text("method_id"),
	unitId: text("unit_id"),
	informarMetodo: boolean("informar_metodo").default(true).notNull(),
	activa: boolean().default(true).notNull(),
	codManlab: varchar("cod_manlab", { length: 6 }),
	imprimirHistorico: boolean("imprimir_historico").default(false).notNull(),
}, (table) => [
	uniqueIndex("determination_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("determination_nombre_codigo_externo_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.aspectId],
			foreignColumns: [aspect.id],
			name: "determination_aspect_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "determination_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.methodId],
			foreignColumns: [method.id],
			name: "determination_method_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [section.id],
			name: "determination_section_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [unit.id],
			name: "determination_unit_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const equipment = pgTable("LAB_equipment", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
});

export const doctor = pgTable("LAB_doctor", {
	id: text().primaryKey().notNull(),
	apellido: text().notNull(),
	nombre: text().notNull(),
	tratamiento: text(),
	matriculaProvincial: text("matricula_provincial"),
	direccion: text(),
	ciudad: text(),
	provincia: text(),
	codigoPostal: text("codigo_postal"),
	telefono: text(),
	celular: text(),
	notas: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("doctor_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "doctor_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const laboratory = pgTable("LAB_laboratory", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	email: text(),
	direccion: text(),
	codigoPostal: text("codigo_postal"),
	ciudad: text(),
	provincia: text(),
	pais: text(),
	telefono: text(),
	sitioWeb: text("sitio_web"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	logo: text(),
});

export const manlabExport = pgTable("LAB_manlab_export", {
	id: text().primaryKey().notNull(),
	filename: text().notNull(),
	cliente: integer().notNull(),
	count: integer().notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	resultIds: text().array().default(["RAY"]),
	status: text().default('PENDING').notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const manlabSetting = pgTable("LAB_manlab_setting", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("manlab_setting_key_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
]);

export const notifiedUser = pgTable("LAB_notified_user", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	apellido: text().notNull(),
	nombre: text(),
	codigoExterno: text("codigo_externo"),
	laboratoryId: text("laboratory_id"),
	enviarUnaCopia: boolean("enviar_una_copia").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	clave: text(),
}, (table) => [
	uniqueIndex("notified_user_email_laboratory_id_key").using("btree", table.email.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "notified_user_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const manlabOrder = pgTable("LAB_manlab_order", {
	id: text().primaryKey().notNull(),
	barcode: text(),
	rotulo: text(),
	cliente: integer().default(0).notNull(),
	codPrestacion: text("cod_prestacion"),
	iva: text().default('O'),
	comentario: text(),
	diuresis: doublePrecision().default(0).notNull(),
	tipoDocumento: text("tipo_documento"),
	numeroDocumento: text("numero_documento"),
	resultId: text("result_id").notNull(),
	enviado: boolean().default(false).notNull(),
	fechaEnviado: timestamp("fecha_enviado", { precision: 3, mode: 'string' }),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	manlabExportId: text("manlab_export_id"),
}, (table) => [
	uniqueIndex("manlab_order_result_id_key").using("btree", table.resultId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.manlabExportId],
			foreignColumns: [manlabExport.id],
			name: "manlab_order_manlab_export_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [result.id],
			name: "manlab_order_result_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const patientHealthInsurance = pgTable("LAB_patient_health_insurance", {
	id: text().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	nroAfiliado: text("nro_afiliado"),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("patient_health_insurance_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("patient_health_insurance_patient_id_health_insurance_id_key").using("btree", table.patientId.asc().nullsLast().op("text_ops"), table.healthInsuranceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "patient_health_insurance_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patient.id],
			name: "patient_health_insurance_patient_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const method = pgTable("LAB_method", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("method_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "method_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const payment = pgTable("LAB_payment", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	patientId: text("patient_id").notNull(),
	fecha: timestamp({ precision: 3, mode: 'string' }),
	concepto: text(),
	importe: doublePrecision().default(0).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("payment_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "payment_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patient.id],
			name: "payment_patient_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const pricesOsConfig = pgTable("LAB_prices_os_config", {
	id: text().primaryKey().notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	determinationId: text("determination_id").notNull(),
	cantidadNbu: doublePrecision("cantidad_nbu").default(0),
	montoFijo: doublePrecision("monto_fijo").default(0),
	precio: doublePrecision().default(0),
	enLista: boolean("en_lista").default(true).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("prices_os_config_health_insurance_id_determination_id_labor_key").using("btree", table.healthInsuranceId.asc().nullsLast().op("text_ops"), table.determinationId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.determinationId],
			foreignColumns: [determination.id],
			name: "prices_os_config_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "prices_os_config_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "prices_os_config_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const protocolNote = pgTable("LAB_protocol_note", {
	id: text().primaryKey().notNull(),
	protocolId: text("protocol_id").notNull(),
	userId: text("user_id").notNull(),
	text: text().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	laboratoryId: text("laboratory_id"),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "protocol_note_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.protocolId],
			foreignColumns: [protocol.id],
			name: "protocol_note_protocol_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "protocol_note_user_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const patient = pgTable("LAB_patient", {
	id: text().primaryKey().notNull(),
	apellido: text().notNull(),
	nombre: text().notNull(),
	sexo: text().notNull(),
	tipoDocumento: text("tipo_documento").notNull(),
	documento: text(),
	fechaNacimiento: timestamp("fecha_nacimiento", { precision: 3, mode: 'string' }),
	edad: integer(),
	email: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	telefono: text(),
	direccion: text(),
	ciudad: text(),
	codigoPostal: text("codigo_postal"),
	entreCalles: text("entre_calles"),
	provincia: text(),
	codigoExterno: text("codigo_externo"),
	claveInforme: text("clave_informe"),
	notifiedUserId: text("notified_user_id"),
}, (table) => [
	uniqueIndex("patient_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	index("patient_documento_idx").using("btree", table.documento.asc().nullsLast().op("text_ops")),
	index("patient_laboratory_id_apellido_nombre_idx").using("btree", table.laboratoryId.asc().nullsLast().op("text_ops"), table.apellido.asc().nullsLast().op("text_ops"), table.nombre.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "patient_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.notifiedUserId],
			foreignColumns: [notifiedUser.id],
			name: "patient_notified_user_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const protocol = pgTable("LAB_protocol", {
	id: text().primaryKey().notNull(),
	numeroSecuencial: text("numero_secuencial").notNull(),
	patientId: text("patient_id").notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	doctorId: text("doctor_id"),
	biochemistId: text("biochemist_id"),
	codigoExterno: text("codigo_externo"),
	notifiedUserId: text("notified_user_id"),
	notifiedUserPortadaId: text("notified_user_portada_id"),
	status: text().default('NEW').notNull(),
	completo: boolean().default(false).notNull(),
	contadorPcd: boolean("contador_pcd").default(false).notNull(),
	creado: boolean().default(false).notNull(),
	etiquetaImpresa: boolean("etiqueta_impresa").default(false).notNull(),
	firmado: boolean().default(false).notNull(),
	impreso: boolean().default(false).notNull(),
	imprimirPortada: boolean("imprimir_portada").default(false).notNull(),
	muestraMry: text("muestra_mry"),
	notaEncabezado: text("nota_encabezado"),
	notaPie: text("nota_pie"),
	paraCrear: boolean("para_crear").default(false).notNull(),
	paraImprimir: boolean("para_imprimir").default(false).notNull(),
	paraRevisar: boolean("para_revisar").default(false).notNull(),
	publicado: boolean().default(false).notNull(),
	sena: doublePrecision().default(0).notNull(),
	paraPublicar: boolean("para_publicar").default(false).notNull(),
}, (table) => [
	uniqueIndex("protocol_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	index("protocol_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("protocol_laboratory_id_status_idx").using("btree", table.laboratoryId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("protocol_numero_secuencial_laboratory_id_key").using("btree", table.numeroSecuencial.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.biochemistId],
			foreignColumns: [biochemist.id],
			name: "protocol_biochemist_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctor.id],
			name: "protocol_doctor_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "protocol_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.notifiedUserId],
			foreignColumns: [notifiedUser.id],
			name: "protocol_notified_user_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.notifiedUserPortadaId],
			foreignColumns: [notifiedUser.id],
			name: "protocol_notified_user_portada_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patient.id],
			name: "protocol_patient_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const mapperCm260 = pgTable("LAB_mapper_cm260", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	subDeterminationId: text("sub_determination_id").notNull(),
	tecnica: text(),
	laboratoryId: text("laboratory_id").notNull(),
	equipmentId: text("equipment_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("mapper_cm260_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("mapper_cm260_sub_determination_id_equipment_id_laboratory_i_key").using("btree", table.subDeterminationId.asc().nullsLast().op("text_ops"), table.equipmentId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	index("mapper_cm260_tecnica_equipment_id_laboratory_id_idx").using("btree", table.tecnica.asc().nullsLast().op("text_ops"), table.equipmentId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.equipmentId],
			foreignColumns: [equipment.id],
			name: "mapper_cm260_equipment_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "mapper_cm260_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.subDeterminationId],
			foreignColumns: [subDetermination.id],
			name: "mapper_cm260_sub_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const unit = pgTable("LAB_unit", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("unit_nombre_codigo_externo_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "unit_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const subResult = pgTable("LAB_sub_result", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	resultId: text("result_id").notNull(),
	subDeterminationId: text("sub_determination_id").notNull(),
	valor: text(),
	comentario: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("sub_result_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	index("sub_result_result_id_idx").using("btree", table.resultId.asc().nullsLast().op("text_ops")),
	uniqueIndex("sub_result_result_id_sub_determination_id_key").using("btree", table.resultId.asc().nullsLast().op("text_ops"), table.subDeterminationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "sub_result_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [result.id],
			name: "sub_result_result_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.subDeterminationId],
			foreignColumns: [subDetermination.id],
			name: "sub_result_sub_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const section = pgTable("LAB_section", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	hojaTrabajo: text("hoja_trabajo"),
	etiqueta: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("codigo_externo"),
}, (table) => [
	uniqueIndex("section_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.etiqueta, table.laboratoryId],
			foreignColumns: [tag.codigo, tag.laboratoryId],
			name: "section_etiqueta_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.hojaTrabajo, table.laboratoryId],
			foreignColumns: [worksheet.codigo, worksheet.laboratoryId],
			name: "section_hoja_trabajo_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "section_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const worksheetPrintLog = pgTable("LAB_worksheet_print_log", {
	id: text().primaryKey().notNull(),
	sectionId: text("section_id").notNull(),
	userId: text("user_id").notNull(),
	resultIds: text("result_ids").array(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("worksheet_print_log_section_id_idx").using("btree", table.sectionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [section.id],
			name: "worksheet_print_log_section_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "worksheet_print_log_user_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const worksheet = pgTable("LAB_worksheet", {
	id: text().primaryKey().notNull(),
	codigo: varchar({ length: 15 }).notNull(),
	nombre: varchar({ length: 50 }).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "worksheet_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const result = pgTable("LAB_result", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	protocolId: text("protocol_id").notNull(),
	determinationId: text("determination_id").notNull(),
	sectionId: text("section_id"),
	healthInsuranceId: text("health_insurance_id"),
	comentarioInterno: text("comentario_interno"),
	asignado: boolean().default(false).notNull(),
	etiquetaImpresa: boolean("etiqueta_impresa").default(false).notNull(),
	suspender: boolean().default(false).notNull(),
	precio: doublePrecision().default(0).notNull(),
	debeReceta: boolean("debe_receta").default(false).notNull(),
	debeOrden: boolean("debe_orden").default(false).notNull(),
	numAutorizacion: text("num_autorizacion"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("result_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	index("result_protocol_id_idx").using("btree", table.protocolId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.determinationId],
			foreignColumns: [determination.id],
			name: "result_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "result_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "result_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.protocolId],
			foreignColumns: [protocol.id],
			name: "result_protocol_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [section.id],
			name: "result_section_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const tag = pgTable("LAB_tag", {
	id: text().primaryKey().notNull(),
	etiqueta: varchar({ length: 15 }).notNull(),
	codigo: varchar({ length: 15 }).notNull(),
	nombre: varchar({ length: 50 }).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "tag_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const setting = pgTable("LAB_setting", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	description: text(),
	laboratoryId: text("laboratory_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("setting_key_laboratory_id_key").using("btree", table.key.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "setting_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const user = pgTable("LAB_user", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text(),
	role: text().default('USER').notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	laboratoryId: text("laboratory_id"),
	image: text(),
	telefono: text(),
}, (table) => [
	uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "user_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const additionalApplyed = pgTable("LAB_additional_applyed", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	protocolId: text("protocol_id").notNull(),
	additionalId: text("additional_id").notNull(),
	healthInsuranceId: text("health_insurance_id"),
	montoFijo: doublePrecision("monto_fijo").default(0),
	porcentajeSp: doublePrecision("porcentaje_sp").default(0),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("additional_applyed_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.additionalId],
			foreignColumns: [additional.id],
			name: "additional_applyed_additional_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.healthInsuranceId],
			foreignColumns: [healthInsurance.id],
			name: "additional_applyed_health_insurance_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "additional_applyed_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.protocolId],
			foreignColumns: [protocol.id],
			name: "additional_applyed_protocol_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const subDetermination = pgTable("LAB_sub_determination", {
	id: text().primaryKey().notNull(),
	nombre: text().notNull(),
	codigoExterno: text("codigo_externo"),
	determinationId: text("determination_id").notNull(),
	unitId: text("unit_id"),
	laboratoryId: text("laboratory_id"),
	calcular: boolean().default(false).notNull(),
	informar: boolean().default(true).notNull(),
	informar2C: boolean("informar2_c").default(false).notNull(),
	informarTextoAntes: text("informar_texto_antes"),
	informarCorteDespues: boolean("informar_corte_despues").default(false).notNull(),
	informarVr: boolean("informar_vr").default(true).notNull(),
	valorMinimo: text("valor_minimo"),
	valorMaximo: text("valor_maximo"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	formato: stringFormatType(),
	activa: boolean().default(true).notNull(),
	codManlab: varchar("cod_manlab", { length: 6 }),
}, (table) => [
	uniqueIndex("sub_determination_codigo_externo_determination_id_laborator_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops"), table.determinationId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.determinationId],
			foreignColumns: [determination.id],
			name: "sub_determination_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "sub_determination_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [unit.id],
			name: "sub_determination_unit_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const referenceValue = pgTable("LAB_reference_value", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("codigo_externo"),
	subDeterminationId: text("sub_determination_id").notNull(),
	categoria: text(),
	valoresNormales: text("valores_normales"),
	informarUnidades: boolean("informar_unidades").default(true).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("reference_value_codigo_externo_sub_determination_id_laborat_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops"), table.subDeterminationId.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "reference_value_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.subDeterminationId],
			foreignColumns: [subDetermination.id],
			name: "reference_value_sub_determination_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);
