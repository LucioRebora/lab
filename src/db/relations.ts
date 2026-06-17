import { relations } from "drizzle-orm/relations";
import { laboratory, abbreviation, additional, additionalPricesOsConfig, healthInsurance, aspect, auditLog, biochemist, budget, budgetItem, determination, calculatorStep, subDetermination, cover, currentAccount, patient, equipment, equipmentToLaboratory, equipmentConfig, externalRecord, method, section, unit, doctor, notifiedUser, manlabExport, manlabOrder, result, patientHealthInsurance, payment, pricesOsConfig, protocolNote, protocol, user, mapperCm260, subResult, tag, worksheet, worksheetPrintLog, setting, additionalApplyed, referenceValue } from "./schema";

export const abbreviationRelations = relations(abbreviation, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [abbreviation.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const laboratoryRelations = relations(laboratory, ({many}) => ({
	abbreviations: many(abbreviation),
	additionals: many(additional),
	additionalPricesOsConfigs: many(additionalPricesOsConfig),
	aspects: many(aspect),
	auditLogs: many(auditLog),
	biochemists: many(biochemist),
	budgets: many(budget),
	calculatorSteps: many(calculatorStep),
	covers: many(cover),
	currentAccounts: many(currentAccount),
	equipmentToLaboratories: many(equipmentToLaboratory),
	equipmentConfigs: many(equipmentConfig),
	healthInsurances: many(healthInsurance),
	externalRecords: many(externalRecord),
	determinations: many(determination),
	doctors: many(doctor),
	notifiedUsers: many(notifiedUser),
	methods: many(method),
	payments: many(payment),
	pricesOsConfigs: many(pricesOsConfig),
	protocolNotes: many(protocolNote),
	patients: many(patient),
	protocols: many(protocol),
	mapperCm260s: many(mapperCm260),
	units: many(unit),
	subResults: many(subResult),
	sections: many(section),
	worksheets: many(worksheet),
	results: many(result),
	tags: many(tag),
	settings: many(setting),
	users: many(user),
	additionalApplyeds: many(additionalApplyed),
	subDeterminations: many(subDetermination),
	referenceValues: many(referenceValue),
}));

export const additionalRelations = relations(additional, ({one, many}) => ({
	laboratory: one(laboratory, {
		fields: [additional.laboratoryId],
		references: [laboratory.id]
	}),
	additionalPricesOsConfigs: many(additionalPricesOsConfig),
	budgetItems: many(budgetItem),
	additionalApplyeds: many(additionalApplyed),
}));

export const additionalPricesOsConfigRelations = relations(additionalPricesOsConfig, ({one}) => ({
	additional: one(additional, {
		fields: [additionalPricesOsConfig.additionalId],
		references: [additional.id]
	}),
	healthInsurance: one(healthInsurance, {
		fields: [additionalPricesOsConfig.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	laboratory: one(laboratory, {
		fields: [additionalPricesOsConfig.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const healthInsuranceRelations = relations(healthInsurance, ({one, many}) => ({
	additionalPricesOsConfigs: many(additionalPricesOsConfig),
	budgets: many(budget),
	budgetItems: many(budgetItem),
	laboratory: one(laboratory, {
		fields: [healthInsurance.laboratoryId],
		references: [laboratory.id]
	}),
	patientHealthInsurances: many(patientHealthInsurance),
	pricesOsConfigs: many(pricesOsConfig),
	results: many(result),
	additionalApplyeds: many(additionalApplyed),
}));

export const aspectRelations = relations(aspect, ({one, many}) => ({
	laboratory: one(laboratory, {
		fields: [aspect.laboratoryId],
		references: [laboratory.id]
	}),
	determinations: many(determination),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [auditLog.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const biochemistRelations = relations(biochemist, ({one, many}) => ({
	laboratory: one(laboratory, {
		fields: [biochemist.laboratoryId],
		references: [laboratory.id]
	}),
	protocols: many(protocol),
}));

export const budgetRelations = relations(budget, ({one, many}) => ({
	healthInsurance: one(healthInsurance, {
		fields: [budget.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	laboratory: one(laboratory, {
		fields: [budget.laboratoryId],
		references: [laboratory.id]
	}),
	budgetItems: many(budgetItem),
}));

export const budgetItemRelations = relations(budgetItem, ({one}) => ({
	additional: one(additional, {
		fields: [budgetItem.additionalId],
		references: [additional.id]
	}),
	budget: one(budget, {
		fields: [budgetItem.budgetId],
		references: [budget.id]
	}),
	determination: one(determination, {
		fields: [budgetItem.determinationId],
		references: [determination.id]
	}),
	healthInsurance: one(healthInsurance, {
		fields: [budgetItem.healthInsuranceId],
		references: [healthInsurance.id]
	}),
}));

export const determinationRelations = relations(determination, ({one, many}) => ({
	budgetItems: many(budgetItem),
	aspect: one(aspect, {
		fields: [determination.aspectId],
		references: [aspect.id]
	}),
	laboratory: one(laboratory, {
		fields: [determination.laboratoryId],
		references: [laboratory.id]
	}),
	method: one(method, {
		fields: [determination.methodId],
		references: [method.id]
	}),
	section: one(section, {
		fields: [determination.sectionId],
		references: [section.id]
	}),
	unit: one(unit, {
		fields: [determination.unitId],
		references: [unit.id]
	}),
	pricesOsConfigs: many(pricesOsConfig),
	results: many(result),
	subDeterminations: many(subDetermination),
}));

export const calculatorStepRelations = relations(calculatorStep, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [calculatorStep.laboratoryId],
		references: [laboratory.id]
	}),
	subDetermination: one(subDetermination, {
		fields: [calculatorStep.subDeterminationId],
		references: [subDetermination.id]
	}),
}));

export const subDeterminationRelations = relations(subDetermination, ({one, many}) => ({
	calculatorSteps: many(calculatorStep),
	mapperCm260s: many(mapperCm260),
	subResults: many(subResult),
	determination: one(determination, {
		fields: [subDetermination.determinationId],
		references: [determination.id]
	}),
	laboratory: one(laboratory, {
		fields: [subDetermination.laboratoryId],
		references: [laboratory.id]
	}),
	unit: one(unit, {
		fields: [subDetermination.unitId],
		references: [unit.id]
	}),
	referenceValues: many(referenceValue),
}));

export const coverRelations = relations(cover, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [cover.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const currentAccountRelations = relations(currentAccount, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [currentAccount.laboratoryId],
		references: [laboratory.id]
	}),
	patient: one(patient, {
		fields: [currentAccount.patientId],
		references: [patient.id]
	}),
}));

export const patientRelations = relations(patient, ({one, many}) => ({
	currentAccounts: many(currentAccount),
	healthInsurances: many(patientHealthInsurance),
	payments: many(payment),
	laboratory: one(laboratory, {
		fields: [patient.laboratoryId],
		references: [laboratory.id]
	}),
	notifiedUser: one(notifiedUser, {
		fields: [patient.notifiedUserId],
		references: [notifiedUser.id]
	}),
	protocols: many(protocol),
}));

export const equipmentToLaboratoryRelations = relations(equipmentToLaboratory, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentToLaboratory.a],
		references: [equipment.id]
	}),
	laboratory: one(laboratory, {
		fields: [equipmentToLaboratory.b],
		references: [laboratory.id]
	}),
}));

export const equipmentRelations = relations(equipment, ({many}) => ({
	equipmentToLaboratories: many(equipmentToLaboratory),
	equipmentConfigs: many(equipmentConfig),
	mapperCm260s: many(mapperCm260),
}));

export const equipmentConfigRelations = relations(equipmentConfig, ({one}) => ({
	equipment: one(equipment, {
		fields: [equipmentConfig.equipmentId],
		references: [equipment.id]
	}),
	laboratory: one(laboratory, {
		fields: [equipmentConfig.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const externalRecordRelations = relations(externalRecord, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [externalRecord.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const methodRelations = relations(method, ({one, many}) => ({
	determinations: many(determination),
	laboratory: one(laboratory, {
		fields: [method.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const sectionRelations = relations(section, ({one, many}) => ({
	determinations: many(determination),
	tag: one(tag, {
		fields: [section.etiqueta],
		references: [tag.codigo]
	}),
	worksheet: one(worksheet, {
		fields: [section.hojaTrabajo],
		references: [worksheet.codigo]
	}),
	laboratory: one(laboratory, {
		fields: [section.laboratoryId],
		references: [laboratory.id]
	}),
	worksheetPrintLogs: many(worksheetPrintLog),
	results: many(result),
}));

export const unitRelations = relations(unit, ({one, many}) => ({
	determinations: many(determination),
	laboratory: one(laboratory, {
		fields: [unit.laboratoryId],
		references: [laboratory.id]
	}),
	subDeterminations: many(subDetermination),
}));

export const doctorRelations = relations(doctor, ({one, many}) => ({
	laboratory: one(laboratory, {
		fields: [doctor.laboratoryId],
		references: [laboratory.id]
	}),
	protocols: many(protocol),
}));

export const notifiedUserRelations = relations(notifiedUser, ({one, many}) => ({
	laboratory: one(laboratory, {
		fields: [notifiedUser.laboratoryId],
		references: [laboratory.id]
	}),
	patients: many(patient),
	protocols_notifiedUserId: many(protocol, {
		relationName: "protocol_notifiedUserId_notifiedUser_id"
	}),
	protocols_notifiedUserPortadaId: many(protocol, {
		relationName: "protocol_notifiedUserPortadaId_notifiedUser_id"
	}),
}));

export const manlabOrderRelations = relations(manlabOrder, ({one}) => ({
	manlabExport: one(manlabExport, {
		fields: [manlabOrder.manlabExportId],
		references: [manlabExport.id]
	}),
	result: one(result, {
		fields: [manlabOrder.resultId],
		references: [result.id]
	}),
}));

export const manlabExportRelations = relations(manlabExport, ({many}) => ({
	manlabOrders: many(manlabOrder),
}));

export const resultRelations = relations(result, ({one, many}) => ({
	manlabOrders: many(manlabOrder),
	subResults: many(subResult),
	determination: one(determination, {
		fields: [result.determinationId],
		references: [determination.id]
	}),
	healthInsurance: one(healthInsurance, {
		fields: [result.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	laboratory: one(laboratory, {
		fields: [result.laboratoryId],
		references: [laboratory.id]
	}),
	protocol: one(protocol, {
		fields: [result.protocolId],
		references: [protocol.id]
	}),
	section: one(section, {
		fields: [result.sectionId],
		references: [section.id]
	}),
}));

export const patientHealthInsuranceRelations = relations(patientHealthInsurance, ({one}) => ({
	healthInsurance: one(healthInsurance, {
		fields: [patientHealthInsurance.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	patient: one(patient, {
		fields: [patientHealthInsurance.patientId],
		references: [patient.id]
	}),
}));

export const paymentRelations = relations(payment, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [payment.laboratoryId],
		references: [laboratory.id]
	}),
	patient: one(patient, {
		fields: [payment.patientId],
		references: [patient.id]
	}),
}));

export const pricesOsConfigRelations = relations(pricesOsConfig, ({one}) => ({
	determination: one(determination, {
		fields: [pricesOsConfig.determinationId],
		references: [determination.id]
	}),
	healthInsurance: one(healthInsurance, {
		fields: [pricesOsConfig.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	laboratory: one(laboratory, {
		fields: [pricesOsConfig.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const protocolNoteRelations = relations(protocolNote, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [protocolNote.laboratoryId],
		references: [laboratory.id]
	}),
	protocol: one(protocol, {
		fields: [protocolNote.protocolId],
		references: [protocol.id]
	}),
	user: one(user, {
		fields: [protocolNote.userId],
		references: [user.id]
	}),
}));

export const protocolRelations = relations(protocol, ({one, many}) => ({
	protocolNotes: many(protocolNote),
	biochemist: one(biochemist, {
		fields: [protocol.biochemistId],
		references: [biochemist.id]
	}),
	doctor: one(doctor, {
		fields: [protocol.doctorId],
		references: [doctor.id]
	}),
	laboratory: one(laboratory, {
		fields: [protocol.laboratoryId],
		references: [laboratory.id]
	}),
	notifiedUser_notifiedUserId: one(notifiedUser, {
		fields: [protocol.notifiedUserId],
		references: [notifiedUser.id],
		relationName: "protocol_notifiedUserId_notifiedUser_id"
	}),
	notifiedUser_notifiedUserPortadaId: one(notifiedUser, {
		fields: [protocol.notifiedUserPortadaId],
		references: [notifiedUser.id],
		relationName: "protocol_notifiedUserPortadaId_notifiedUser_id"
	}),
	patient: one(patient, {
		fields: [protocol.patientId],
		references: [patient.id]
	}),
	results: many(result),
	additionalApplyeds: many(additionalApplyed),
}));

export const userRelations = relations(user, ({one, many}) => ({
	protocolNotes: many(protocolNote),
	worksheetPrintLogs: many(worksheetPrintLog),
	laboratory: one(laboratory, {
		fields: [user.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const mapperCm260Relations = relations(mapperCm260, ({one}) => ({
	equipment: one(equipment, {
		fields: [mapperCm260.equipmentId],
		references: [equipment.id]
	}),
	laboratory: one(laboratory, {
		fields: [mapperCm260.laboratoryId],
		references: [laboratory.id]
	}),
	subDetermination: one(subDetermination, {
		fields: [mapperCm260.subDeterminationId],
		references: [subDetermination.id]
	}),
}));

export const subResultRelations = relations(subResult, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [subResult.laboratoryId],
		references: [laboratory.id]
	}),
	result: one(result, {
		fields: [subResult.resultId],
		references: [result.id]
	}),
	subDetermination: one(subDetermination, {
		fields: [subResult.subDeterminationId],
		references: [subDetermination.id]
	}),
}));

export const tagRelations = relations(tag, ({one, many}) => ({
	sections: many(section),
	laboratory: one(laboratory, {
		fields: [tag.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const worksheetRelations = relations(worksheet, ({one, many}) => ({
	sections: many(section),
	laboratory: one(laboratory, {
		fields: [worksheet.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const worksheetPrintLogRelations = relations(worksheetPrintLog, ({one}) => ({
	section: one(section, {
		fields: [worksheetPrintLog.sectionId],
		references: [section.id]
	}),
	user: one(user, {
		fields: [worksheetPrintLog.userId],
		references: [user.id]
	}),
}));

export const settingRelations = relations(setting, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [setting.laboratoryId],
		references: [laboratory.id]
	}),
}));

export const additionalApplyedRelations = relations(additionalApplyed, ({one}) => ({
	additional: one(additional, {
		fields: [additionalApplyed.additionalId],
		references: [additional.id]
	}),
	healthInsurance: one(healthInsurance, {
		fields: [additionalApplyed.healthInsuranceId],
		references: [healthInsurance.id]
	}),
	laboratory: one(laboratory, {
		fields: [additionalApplyed.laboratoryId],
		references: [laboratory.id]
	}),
	protocol: one(protocol, {
		fields: [additionalApplyed.protocolId],
		references: [protocol.id]
	}),
}));

export const referenceValueRelations = relations(referenceValue, ({one}) => ({
	laboratory: one(laboratory, {
		fields: [referenceValue.laboratoryId],
		references: [laboratory.id]
	}),
	subDetermination: one(subDetermination, {
		fields: [referenceValue.subDeterminationId],
		references: [subDetermination.id]
	}),
}));