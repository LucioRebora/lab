import { db } from "./db";
import * as schema from "../db/schema";
import { eq, and, or, inArray, notInArray, ne, isNull, isNotNull, like, gt, gte, lt, lte, sql, count } from "drizzle-orm";

const getUtc3Date = () => {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    return date;
};

const modelMap: Record<string, any> = {
    user: schema.user,
    budget: schema.budget,
    budgetItem: schema.budgetItem,
    laboratory: schema.laboratory,
    auditLog: schema.auditLog,
    setting: schema.setting,
    patient: schema.patient,
    healthInsurance: schema.healthInsurance,
    patientHealthInsurance: schema.patientHealthInsurance,
    biochemist: schema.biochemist,
    cover: schema.cover,
    doctor: schema.doctor,
    method: schema.method,
    unit: schema.unit,
    aspect: schema.aspect,
    section: schema.section,
    worksheetPrintLog: schema.worksheetPrintLog,
    determination: schema.determination,
    subDetermination: schema.subDetermination,
    referenceValue: schema.referenceValue,
    abbreviation: schema.abbreviation,
    additional: schema.additional,
    protocol: schema.protocol,
    notifiedUser: schema.notifiedUser,
    result: schema.result,
    subResult: schema.subResult,
    equipment: schema.equipment,
    mapperCm260: schema.mapperCm260,
    mapperCM260: schema.mapperCm260,
    equipmentConfig: schema.equipmentConfig,
    additionalApplyed: schema.additionalApplyed,
    additionalPricesOsConfig: schema.additionalPricesOsConfig,
    additionalPricesOSConfig: schema.additionalPricesOsConfig,
    pricesOsConfig: schema.pricesOsConfig,
    pricesOSConfig: schema.pricesOsConfig,
    payment: schema.payment,
    currentAccount: schema.currentAccount,
    calculatorStep: schema.calculatorStep,
    externalRecord: schema.externalRecord,
    protocolNote: schema.protocolNote,
    manlabExport: schema.manlabExport,
    manlabSetting: schema.manlabSetting,
    manlabOrder: schema.manlabOrder,
    tag: schema.tag,
    worksheet: schema.worksheet
};

function buildWhere(table: any, where: any): any {
    if (!where) return undefined;
    const conds: any[] = [];
    for (const [key, val] of Object.entries(where)) {
        if (key === 'OR') {
            if (Array.isArray(val)) {
                return or(...val.map(w => buildWhere(table, w)).filter(Boolean));
            }
        } else if (key === 'AND') {
            if (Array.isArray(val)) {
                return and(...val.map(w => buildWhere(table, w)).filter(Boolean));
            }
        } else {
            const column = table[key];
            if (!column) continue;
            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
                for (const [op, opVal] of Object.entries(val)) {
                    if (op === 'not') {
                        if (opVal === null) {
                            conds.push(isNotNull(column));
                        } else {
                            conds.push(ne(column, opVal));
                        }
                    } else if (op === 'in') {
                        if (Array.isArray(opVal)) {
                            if (opVal.length === 0) {
                                conds.push(sql`false`);
                            } else {
                                conds.push(inArray(column, opVal));
                            }
                        }
                    } else if (op === 'notIn') {
                        if (Array.isArray(opVal) && opVal.length > 0) {
                            conds.push(notInArray(column, opVal));
                        }
                    } else if (op === 'contains') {
                        conds.push(like(column, `%${opVal}%`));
                    } else if (op === 'startsWith') {
                        conds.push(like(column, `${opVal}%`));
                    } else if (op === 'endsWith') {
                        conds.push(like(column, `%${opVal}`));
                    } else if (op === 'gt') {
                        conds.push(gt(column, opVal));
                    } else if (op === 'gte') {
                        conds.push(gte(column, opVal));
                    } else if (op === 'lt') {
                        conds.push(lt(column, opVal));
                    } else if (op === 'lte') {
                        conds.push(lte(column, opVal));
                    }
                }
            } else {
                if (val === null) {
                    conds.push(isNull(column));
                } else {
                    conds.push(eq(column, val));
                }
            }
        }
    }
    return conds.length > 0 ? and(...conds) : undefined;
}

function buildFields(selectOrInclude: any, isSelect = true) {
    if (!selectOrInclude) return undefined;
    const columns: Record<string, boolean> = {};
    const withRelations: Record<string, any> = {};
    
    for (const [key, val] of Object.entries(selectOrInclude)) {
        if (val === true) {
            if (isSelect) {
                columns[key] = true;
            }
        } else if (typeof val === 'object' && val !== null) {
            const nested: any = {};
            if ((val as any).select) {
                const fields = buildFields((val as any).select, true);
                if (fields?.columns) nested.columns = fields.columns;
                if (fields?.withRelations) nested.with = fields.withRelations;
            } else if ((val as any).include) {
                const fields = buildFields((val as any).include, false);
                if (fields?.columns) nested.columns = fields.columns;
                if (fields?.withRelations) nested.with = fields.withRelations;
            }
            withRelations[key] = Object.keys(nested).length > 0 ? nested : true;
        }
    }
    return { 
        columns: Object.keys(columns).length > 0 ? columns : undefined, 
        withRelations: Object.keys(withRelations).length > 0 ? withRelations : undefined 
    };
}

class PrismaPromise<T> implements PromiseLike<T> {
    private fn: (tx?: any) => Promise<T>;
    constructor(fn: (tx?: any) => Promise<T>) {
        this.fn = fn;
    }
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.fn().then(onfulfilled, onrejected);
    }
    async execute(tx: any): Promise<T> {
        return this.fn(tx);
    }
}

function createPrismaProxy(client: any) {
    return new Proxy({}, {
        get(target, prop) {
            if (prop === '$transaction') {
                return async (input: any) => {
                    if (typeof input === 'function') {
                        return client.transaction(async (tx: any) => {
                            const txPrisma = createPrismaProxy(tx);
                            return input(txPrisma);
                        });
                    } else if (Array.isArray(input)) {
                        return client.transaction(async (tx: any) => {
                            const results = [];
                            for (const item of input) {
                                if (item instanceof PrismaPromise) {
                                    results.push(await item.execute(tx));
                                } else {
                                    results.push(await item);
                                }
                            }
                            return results;
                        });
                    }
                };
            }

            const modelName = prop as string;
            const table = modelMap[modelName];
            if (!table) return undefined;

            const executeRead = async (tx: any, method: string, args: any = {}) => {
                const queryClient = tx || client;
                const drizzleWhere = buildWhere(table, args.where);
                let columns: any = undefined;
                let withRelations: any = undefined;
                if (args.select) {
                    const fields = buildFields(args.select, true);
                    if (fields) {
                        columns = fields.columns;
                        withRelations = fields.withRelations;
                    }
                } else if (args.include) {
                    const fields = buildFields(args.include, false);
                    if (fields) {
                        withRelations = fields.withRelations;
                    }
                }

                let drizzleOrderBy: any = undefined;
                if (args.orderBy) {
                    drizzleOrderBy = (t: any, { desc, asc }: any) => {
                        const list: any[] = [];
                        const handleOrder = (orderObj: any) => {
                            for (const [k, v] of Object.entries(orderObj)) {
                                if (t[k]) {
                                    list.push(v === 'desc' ? desc(t[k]) : asc(t[k]));
                                }
                            }
                        };
                        if (Array.isArray(args.orderBy)) {
                            args.orderBy.forEach(handleOrder);
                        } else {
                            handleOrder(args.orderBy);
                        }
                        return list;
                    };
                }

                const queryOptions: any = {};
                if (drizzleWhere !== undefined) queryOptions.where = drizzleWhere;
                if (columns !== undefined) queryOptions.columns = columns;
                if (withRelations !== undefined) queryOptions.with = withRelations;
                if (drizzleOrderBy !== undefined) queryOptions.orderBy = drizzleOrderBy;
                if (args.take !== undefined) queryOptions.limit = args.take;
                if (args.skip !== undefined) queryOptions.offset = args.skip;

                const queryModel = queryClient.query[modelName];
                if (!queryModel) {
                    throw new Error(`Drizzle query model ${modelName} not found.`);
                }

                if (method === 'findFirst' || method === 'findUnique') {
                    return queryModel.findFirst(queryOptions);
                } else {
                    return queryModel.findMany(queryOptions);
                }
            };

            return {
                findMany: (args: any) => new PrismaPromise(tx => executeRead(tx, 'findMany', args)),
                findFirst: (args: any) => new PrismaPromise(tx => executeRead(tx, 'findFirst', args)),
                findUnique: (args: any) => new PrismaPromise(tx => executeRead(tx, 'findUnique', args)),
                count: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const drizzleWhere = buildWhere(table, args.where);
                    const q = queryClient.select({ value: count() }).from(table);
                    if (drizzleWhere) q.where(drizzleWhere);
                    const res = await q;
                    return res[0]?.value || 0;
                }),
                create: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const data = { ...args.data };
                    
                    // Hook for created_at / updated_at
                    const dateNow = getUtc3Date();
                    if ('createdAt' in table && !data.createdAt) data.createdAt = dateNow;
                    if ('updatedAt' in table && !data.updatedAt) data.updatedAt = dateNow;
                    
                    const inserted = await queryClient.insert(table).values(data).returning();
                    const record = inserted[0];
                    if (!record) return null;
                    if (args.select || args.include) {
                        return executeRead(tx, 'findUnique', { where: { id: record.id }, select: args.select, include: args.include });
                    }
                    return record;
                }),
                createMany: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const rawData = Array.isArray(args.data) ? args.data : [args.data];
                    if (rawData.length === 0) return { count: 0 };
                    
                    const dateNow = getUtc3Date();
                    const data = rawData.map((d: any) => {
                        const copy = { ...d };
                        if ('createdAt' in table && !copy.createdAt) copy.createdAt = dateNow;
                        if ('updatedAt' in table && !copy.updatedAt) copy.updatedAt = dateNow;
                        return copy;
                    });
                    
                    const inserted = await queryClient.insert(table).values(data).returning();
                    return { count: inserted.length };
                }),
                update: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const drizzleWhere = buildWhere(table, args.where);
                    if (!drizzleWhere) throw new Error("Update requires a where clause");
                    
                    const data = { ...args.data };
                    if ('updatedAt' in table && !data.updatedAt) data.updatedAt = getUtc3Date();
                    
                    const updated = await queryClient.update(table).set(data).where(drizzleWhere).returning();
                    const record = updated[0];
                    if (!record) return null;
                    if (args.select || args.include) {
                        return executeRead(tx, 'findUnique', { where: { id: record.id }, select: args.select, include: args.include });
                    }
                    return record;
                }),
                updateMany: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const drizzleWhere = buildWhere(table, args.where);
                    
                    const data = { ...args.data };
                    if ('updatedAt' in table && !data.updatedAt) data.updatedAt = getUtc3Date();
                    
                    const q = queryClient.update(table).set(data);
                    if (drizzleWhere) q.where(drizzleWhere);
                    const updated = await q.returning();
                    return { count: updated.length };
                }),
                delete: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const drizzleWhere = buildWhere(table, args.where);
                    if (!drizzleWhere) throw new Error("Delete requires a where clause");
                    const deleted = await queryClient.delete(table).where(drizzleWhere).returning();
                    return deleted[0] || null;
                }),
                deleteMany: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const queryClient = tx || client;
                    const drizzleWhere = buildWhere(table, args.where);
                    const q = queryClient.delete(table);
                    if (drizzleWhere) q.where(drizzleWhere);
                    const deleted = await q.returning();
                    return { count: deleted.length };
                }),
                upsert: (args: any = {}) => new PrismaPromise(async (tx) => {
                    const record = await executeRead(tx, 'findUnique', { where: args.where });
                    if (record) {
                        // We extract the update execution:
                        const drizzleWhere = buildWhere(table, args.where);
                        if (!drizzleWhere) throw new Error("Upsert update requires a where clause");
                        const data = { ...args.update };
                        if ('updatedAt' in table && !data.updatedAt) data.updatedAt = getUtc3Date();
                        
                        const queryClient = tx || client;
                        const updated = await queryClient.update(table).set(data).where(drizzleWhere).returning();
                        const rec = updated[0];
                        if (!rec) return null;
                        if (args.select || args.include) {
                            return executeRead(tx, 'findUnique', { where: { id: rec.id }, select: args.select, include: args.include });
                        }
                        return rec;
                    } else {
                        const queryClient = tx || client;
                        const data = { ...args.create };
                        const dateNow = getUtc3Date();
                        if ('createdAt' in table && !data.createdAt) data.createdAt = dateNow;
                        if ('updatedAt' in table && !data.updatedAt) data.updatedAt = dateNow;
                        
                        const inserted = await queryClient.insert(table).values(data).returning();
                        const rec = inserted[0];
                        if (!rec) return null;
                        if (args.select || args.include) {
                            return executeRead(tx, 'findUnique', { where: { id: rec.id }, select: args.select, include: args.include });
                        }
                        return rec;
                    }
                })
            };
        }
    }) as any;
}

export const prisma = createPrismaProxy(db);
export type PrismaClient = typeof prisma;
