import { pgTable, uniqueIndex, foreignKey, text, timestamp, boolean, doublePrecision, index, jsonb, integer, varchar, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const stringFormatType = pgEnum("StringFormatType", ['TEXT', 'INTEGER', 'DECIMAL_1', 'DECIMAL_2'])


export const abbreviation = pgTable("LAB_abbreviation", {
	id: text().primaryKey().notNull(),
	resultado: text("result").notNull(),
	abreviatura: text("abbreviation").notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
}, (table) => [
uniqueIndex("abbreviation_resultado_codigo_externo_laboratory_id_key").using("btree", table.resultado.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "abbreviation_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("abbreviation_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const additional = pgTable("LAB_additional", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	abreviatura: text("abbreviation"),
	codigo: text("code"),
	agregarSiempre: boolean("always_add").default(false).notNull(),
	agregarEnUrgencia: boolean("add_on_urgency").default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
}, (table) => [
uniqueIndex("additional_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("additional_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "additional_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("additional_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const additionalPricesOsConfig = pgTable("LAB_additional_prices_os_config", {
	id: text().primaryKey().notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	additionalId: text("additional_id").notNull(),
	montoFijo: doublePrecision("fixed_amount").default(0),
	porcentajeSp: doublePrecision("sp_percentage").default(0),
	enLista: boolean("in_list").default(true).notNull(),
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
	index("additionalPricesOsConfig_additional_id_idx").using("btree", table.additionalId),
	index("additionalPricesOsConfig_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const aspect = pgTable("LAB_aspect", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	descripcion: text("description"),
	codigoExterno: text("external_code"),
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
	index("aspect_laboratory_id_idx").using("btree", table.laboratoryId)
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
	index("auditLog_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const biochemist = pgTable("LAB_biochemist", {
	id: text().primaryKey().notNull(),
	apellido: text("last_name").notNull(),
	nombre: text("name").notNull(),
	tratamiento: text("treatment"),
	codigo: text("code"),
	direccion: text("address"),
	ciudad: text("city"),
	provincia: text("province"),
	codigoPostal: text("postal_code"),
	telefono: text("phone"),
	celular: text("cellphone"),
	notas: text("notes"),
	firmante: boolean("signer").default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	codigoExterno: text("external_code"),
}, (table) => [
foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "biochemist_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("biochemist_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const budget = pgTable("LAB_budget", {
	id: text().primaryKey().notNull(),
	paciente: text("patient"),
	total: doublePrecision().notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	telefono: text("phone"),
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
	index("budget_health_insurance_id_idx").using("btree", table.healthInsuranceId),
	index("budget_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const budgetItem = pgTable("LAB_budget_item", {
	id: text().primaryKey().notNull(),
	budgetId: text("budget_id").notNull(),
	codigo: integer("code"),
	nombre: text("name").notNull(),
	ub: doublePrecision(),
	valor: doublePrecision("value").notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	healthInsuranceNombre: text("health_insurance_name").notNull(),
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
	index("budgetItem_additional_id_idx").using("btree", table.additionalId),
	index("budgetItem_budget_id_idx").using("btree", table.budgetId),
	index("budgetItem_determination_id_idx").using("btree", table.determinationId),
	index("budgetItem_health_insurance_id_idx").using("btree", table.healthInsuranceId)
]);

export const calculatorStep = pgTable("LAB_calculator_step", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	subDeterminationId: text("sub_determination_id").notNull(),
	tipoOperacion: text("operation_type").notNull(),
	argumentoNumerico: doublePrecision("numeric_argument").default(0),
	argumentoIdSubDete: text("argument_id_sub_dete"),
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
	index("calculatorStep_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const cover = pgTable("LAB_cover", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	abreviatura: text("abbreviation"),
	direccion: text("address"),
	ciudad: text("city"),
	provincia: text("province"),
	codigoPostal: text("postal_code"),
	telefono: text("phone"),
	fax: text(),
	celular: text("cellphone"),
	email: text(),
	comentario1: text("comment1"),
	comentario2: text("comment2"),
	comentario3: text("comment3"),
	comentario4: text("comment4"),
	comentario5: text("comment5"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "cover_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("cover_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const currentAccount = pgTable("LAB_current_account", {
	id: text().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	fecha: timestamp("date", { precision: 3, mode: 'string' }),
	concepto: text("concept"),
	debe: doublePrecision("debit").default(0).notNull(),
	haber: doublePrecision("credit").default(0).notNull(),
	saldo: doublePrecision("balance").default(0).notNull(),
	tipoCom: text("com_type"),
	idCom: text("com_id"),
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
	index("currentAccount_laboratory_id_idx").using("btree", table.laboratoryId),
	index("currentAccount_patient_id_idx").using("btree", table.patientId)
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
	index("equipmentToLaboratory_B_idx").using("btree", table.b)
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
	index("equipmentConfig_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const healthInsurance = pgTable("LAB_health_insurance", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	contado: boolean("cash").default(false).notNull(),
	cortada: boolean("suspended").default(false).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
	selectorRtr: integer("selector_rtr").default(0),
	valorNbu: doublePrecision("nbu_value").default(0),
}, (table) => [
uniqueIndex("health_insurance_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	uniqueIndex("health_insurance_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "health_insurance_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("healthInsurance_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const externalRecord = pgTable("LAB_external_record", {
	id: text().primaryKey().notNull(),
	nombreTabla: text("table_name").notNull(),
	datos: jsonb("data").notNull(),
	codigoExterno: text("external_code"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	procesado: integer("processed").default(0).notNull(),
	error: text(),
	intentos: integer("attempts").default(0).notNull(),
}, (table) => [
uniqueIndex("external_record_nombre_tabla_codigo_externo_laboratory_id_key").using("btree", table.nombreTabla.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "external_record_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("externalRecord_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const determination = pgTable("LAB_determination", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	abreviatura: text("abbreviation"),
	mensajeIngreso: text("entry_message"),
	comentarioFijo: text("fixed_comment"),
	aspecto: text("aspect"),
	condicionesMuestra: text("sample_conditions"),
	imprimirWorksheet: boolean("print_worksheet").default(true).notNull(),
	resumirWorksheet: boolean("summarize_worksheet").default(false).notNull(),
	alturaWorksheet: doublePrecision("worksheet_height"),
	sectionId: text("section_id"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	aspectId: text("aspect_id"),
	codigo: text("code"),
	codigoExterno: text("external_code"),
	methodId: text("method_id"),
	unitId: text("unit_id"),
	informarMetodo: boolean("report_method").default(true).notNull(),
	activa: boolean("active").default(true).notNull(),
	codManlab: varchar("cod_manlab", { length: 6 }),
	imprimirHistorico: boolean("print_history").default(false).notNull(),
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
	index("determination_aspect_id_idx").using("btree", table.aspectId),
	index("determination_laboratory_id_idx").using("btree", table.laboratoryId),
	index("determination_method_id_idx").using("btree", table.methodId),
	index("determination_section_id_idx").using("btree", table.sectionId),
	index("determination_unit_id_idx").using("btree", table.unitId)
]);

export const equipment = pgTable("LAB_equipment", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
});

export const doctor = pgTable("LAB_doctor", {
	id: text().primaryKey().notNull(),
	apellido: text("last_name").notNull(),
	nombre: text("name").notNull(),
	tratamiento: text("treatment"),
	matriculaProvincial: text("provincial_license"),
	direccion: text("address"),
	ciudad: text("city"),
	provincia: text("province"),
	codigoPostal: text("postal_code"),
	telefono: text("phone"),
	celular: text("cellphone"),
	notas: text("notes"),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	email: text(),
	codigoExterno: text("external_code"),
}, (table) => [
uniqueIndex("doctor_codigo_externo_key").using("btree", table.codigoExterno.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "doctor_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("equipment_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const laboratory = pgTable("LAB_laboratory", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	email: text(),
	direccion: text("address"),
	codigoPostal: text("postal_code"),
	ciudad: text("city"),
	provincia: text("province"),
	pais: text("country"),
	telefono: text("phone"),
	sitioWeb: text("website"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	logo: text(),
});

export const manlabExport = pgTable("LAB_manlab_export", {
	id: text().primaryKey().notNull(),
	filename: text().notNull(),
	cliente: integer("client").notNull(),
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
	apellido: text("last_name").notNull(),
	nombre: text("name"),
	codigoExterno: text("external_code"),
	laboratoryId: text("laboratory_id"),
	enviarUnaCopia: boolean("send_copy").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	clave: text("password"),
}, (table) => [
uniqueIndex("notified_user_email_laboratory_id_key").using("btree", table.email.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "notified_user_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("notifiedUser_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const manlabOrder = pgTable("LAB_manlab_order", {
	id: text().primaryKey().notNull(),
	barcode: text(),
	rotulo: text("label"),
	cliente: integer("client").default(0).notNull(),
	codPrestacion: text("cod_prestacion"),
	iva: text().default('O'),
	comentario: text("comment"),
	diuresis: doublePrecision("diuresis").default(0).notNull(),
	tipoDocumento: text("document_type"),
	numeroDocumento: text("document_number"),
	resultId: text("result_id").notNull(),
	enviado: boolean("sent").default(false).notNull(),
	fechaEnviado: timestamp("sent_at", { precision: 3, mode: 'string' }),
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
	index("manlabOrder_manlab_export_id_idx").using("btree", table.manlabExportId)
]);

export const patientHealthInsurance = pgTable("LAB_patient_health_insurance", {
	id: text().primaryKey().notNull(),
	patientId: text("patient_id").notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	nroAfiliado: text("affiliate_number"),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
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
	index("patientHealthInsurance_health_insurance_id_idx").using("btree", table.healthInsuranceId)
]);

export const method = pgTable("LAB_method", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
}, (table) => [
uniqueIndex("method_nombre_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "method_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("method_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const payment = pgTable("LAB_payment", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	patientId: text("patient_id").notNull(),
	fecha: timestamp("date", { precision: 3, mode: 'string' }),
	concepto: text("concept"),
	importe: doublePrecision("amount").default(0).notNull(),
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
	index("payment_laboratory_id_idx").using("btree", table.laboratoryId),
	index("payment_patient_id_idx").using("btree", table.patientId)
]);

export const pricesOsConfig = pgTable("LAB_prices_os_config", {
	id: text().primaryKey().notNull(),
	healthInsuranceId: text("health_insurance_id").notNull(),
	determinationId: text("determination_id").notNull(),
	cantidadNbu: doublePrecision("nbu_quantity").default(0),
	montoFijo: doublePrecision("fixed_amount").default(0),
	precio: doublePrecision().default(0),
	enLista: boolean("in_list").default(true).notNull(),
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
	index("pricesOsConfig_determination_id_idx").using("btree", table.determinationId),
	index("pricesOsConfig_laboratory_id_idx").using("btree", table.laboratoryId)
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
	index("protocolNote_laboratory_id_idx").using("btree", table.laboratoryId),
	index("protocolNote_protocol_id_idx").using("btree", table.protocolId),
	index("protocolNote_user_id_idx").using("btree", table.userId)
]);

export const patient = pgTable("LAB_patient", {
	id: text().primaryKey().notNull(),
	apellido: text("last_name").notNull(),
	nombre: text("name").notNull(),
	sexo: text("gender").notNull(),
	tipoDocumento: text("document_type").notNull(),
	documento: text("document"),
	fechaNacimiento: timestamp("birth_date", { precision: 3, mode: 'string' }),
	edad: integer("age"),
	email: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	telefono: text("phone"),
	direccion: text("address"),
	ciudad: text("city"),
	codigoPostal: text("postal_code"),
	entreCalles: text("between_streets"),
	provincia: text("province"),
	codigoExterno: text("external_code"),
	claveInforme: text("report_key"),
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
	index("patient_notified_user_id_idx").using("btree", table.notifiedUserId)
]);

export const protocol = pgTable("LAB_protocol", {
	id: text().primaryKey().notNull(),
	numeroSecuencial: text("sequential_number").notNull(),
	patientId: text("patient_id").notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	doctorId: text("doctor_id"),
	biochemistId: text("biochemist_id"),
	codigoExterno: text("external_code"),
	notifiedUserId: text("notified_user_id"),
	notifiedUserPortadaId: text("notified_user_portada_id"),
	status: text().default('NEW').notNull(),
	completo: boolean("complete").default(false).notNull(),
	contadorPcd: boolean("pcd_counter").default(false).notNull(),
	creado: boolean("created").default(false).notNull(),
	etiquetaImpresa: boolean("label_printed").default(false).notNull(),
	firmado: boolean("signed").default(false).notNull(),
	impreso: boolean("printed").default(false).notNull(),
	imprimirPortada: boolean("print_cover").default(false).notNull(),
	muestraMry: text("sample_mry"),
	notaEncabezado: text("header_note"),
	notaPie: text("footer_note"),
	paraCrear: boolean("to_create").default(false).notNull(),
	paraImprimir: boolean("to_print").default(false).notNull(),
	paraRevisar: boolean("to_review").default(false).notNull(),
	publicado: boolean("published").default(false).notNull(),
	sena: doublePrecision("deposit").default(0).notNull(),
	paraPublicar: boolean("to_publish").default(false).notNull(),
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
	index("protocol_biochemist_id_idx").using("btree", table.biochemistId),
	index("protocol_doctor_id_idx").using("btree", table.doctorId),
	index("protocol_notified_user_id_idx").using("btree", table.notifiedUserId),
	index("protocol_notified_user_portada_id_idx").using("btree", table.notifiedUserPortadaId),
	index("protocol_patient_id_idx").using("btree", table.patientId)
]);

export const mapperCm260 = pgTable("LAB_mapper_cm260", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	subDeterminationId: text("sub_determination_id").notNull(),
	tecnica: text("technique"),
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
	index("mapperCm260_equipment_id_idx").using("btree", table.equipmentId),
	index("mapperCm260_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const unit = pgTable("LAB_unit", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
}, (table) => [
uniqueIndex("unit_nombre_codigo_externo_laboratory_id_key").using("btree", table.nombre.asc().nullsLast().op("text_ops"), table.codigoExterno.asc().nullsLast().op("text_ops"), table.laboratoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "unit_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("unit_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const subResult = pgTable("LAB_sub_result", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	resultId: text("result_id").notNull(),
	subDeterminationId: text("sub_determination_id").notNull(),
	valor: text("value"),
	comentario: text("comment"),
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
	index("subResult_laboratory_id_idx").using("btree", table.laboratoryId),
	index("subResult_sub_determination_id_idx").using("btree", table.subDeterminationId)
]);

export const section = pgTable("LAB_section", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	hojaTrabajo: text("worksheet"),
	etiqueta: text(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	codigoExterno: text("external_code"),
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
	index("section_laboratory_id_idx").using("btree", table.laboratoryId),
	index("section_etiqueta_laboratory_id_idx").using("btree", table.etiqueta, table.laboratoryId),
	index("section_hoja_trabajo_laboratory_id_idx").using("btree", table.hojaTrabajo, table.laboratoryId)
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
	index("worksheetPrintLog_user_id_idx").using("btree", table.userId)
]);

export const worksheet = pgTable("LAB_worksheet", {
	id: text().primaryKey().notNull(),
	codigo: varchar("code", { length: 15 }).notNull(),
	nombre: varchar("name", { length: 50 }).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "worksheet_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("worksheet_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const result = pgTable("LAB_result", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	protocolId: text("protocol_id").notNull(),
	determinationId: text("determination_id").notNull(),
	sectionId: text("section_id"),
	healthInsuranceId: text("health_insurance_id"),
	comentarioInterno: text("internal_comment"),
	asignado: boolean("assigned").default(false).notNull(),
	etiquetaImpresa: boolean("label_printed").default(false).notNull(),
	suspender: boolean("suspend").default(false).notNull(),
	precio: doublePrecision().default(0).notNull(),
	debeReceta: boolean("owes_prescription").default(false).notNull(),
	debeOrden: boolean("owes_order").default(false).notNull(),
	numAutorizacion: text("authorization_number"),
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
	index("result_determination_id_idx").using("btree", table.determinationId),
	index("result_health_insurance_id_idx").using("btree", table.healthInsuranceId),
	index("result_laboratory_id_idx").using("btree", table.laboratoryId),
	index("result_section_id_idx").using("btree", table.sectionId)
]);

export const tag = pgTable("LAB_tag", {
	id: text().primaryKey().notNull(),
	etiqueta: varchar({ length: 15 }).notNull(),
	codigo: varchar("code", { length: 15 }).notNull(),
	nombre: varchar("name", { length: 50 }).notNull(),
	laboratoryId: text("laboratory_id"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "tag_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("tag_laboratory_id_idx").using("btree", table.laboratoryId)
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
	index("setting_laboratory_id_idx").using("btree", table.laboratoryId)
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
	telefono: text("phone"),
}, (table) => [
uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.laboratoryId],
			foreignColumns: [laboratory.id],
			name: "user_laboratory_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	index("user_laboratory_id_idx").using("btree", table.laboratoryId)
]);

export const additionalApplyed = pgTable("LAB_additional_applyed", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	protocolId: text("protocol_id").notNull(),
	additionalId: text("additional_id").notNull(),
	healthInsuranceId: text("health_insurance_id"),
	montoFijo: doublePrecision("fixed_amount").default(0),
	porcentajeSp: doublePrecision("sp_percentage").default(0),
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
	index("additionalApplyed_additional_id_idx").using("btree", table.additionalId),
	index("additionalApplyed_health_insurance_id_idx").using("btree", table.healthInsuranceId),
	index("additionalApplyed_laboratory_id_idx").using("btree", table.laboratoryId),
	index("additionalApplyed_protocol_id_idx").using("btree", table.protocolId)
]);

export const subDetermination = pgTable("LAB_sub_determination", {
	id: text().primaryKey().notNull(),
	nombre: text("name").notNull(),
	codigoExterno: text("external_code"),
	determinationId: text("determination_id").notNull(),
	unitId: text("unit_id"),
	laboratoryId: text("laboratory_id"),
	calcular: boolean("calculate").default(false).notNull(),
	informar: boolean("report").default(true).notNull(),
	informar2C: boolean("report_2c").default(false).notNull(),
	informarTextoAntes: text("report_text_before"),
	informarCorteDespues: boolean("report_cutoff_after").default(false).notNull(),
	informarVr: boolean("report_reference_value").default(true).notNull(),
	valorMinimo: text("minimum_value"),
	valorMaximo: text("maximum_value"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
	formato: stringFormatType(),
	activa: boolean("active").default(true).notNull(),
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
	index("subDetermination_determination_id_idx").using("btree", table.determinationId),
	index("subDetermination_laboratory_id_idx").using("btree", table.laboratoryId),
	index("subDetermination_unit_id_idx").using("btree", table.unitId)
]);

export const referenceValue = pgTable("LAB_reference_value", {
	id: text().primaryKey().notNull(),
	codigoExterno: text("external_code"),
	subDeterminationId: text("sub_determination_id").notNull(),
	categoria: text("category"),
	valoresNormales: text("normal_values"),
	informarUnidades: boolean("report_units").default(true).notNull(),
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
	index("referenceValue_laboratory_id_idx").using("btree", table.laboratoryId),
	index("referenceValue_sub_determination_id_idx").using("btree", table.subDeterminationId)
]);
