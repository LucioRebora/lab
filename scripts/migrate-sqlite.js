#!/usr/bin/env bun

/**
 * SQLite to Prisma Migration Script
 * 
 * This script migrates data from the legacy SQLite database (datos.db)
 * to the new Prisma/PostgreSQL database in the correct dependency order.
 * 
 * Usage:
 *   bun scripts/migrate-sqlite.js [options]
 * 
 * Options:
 *   --dry-run    Preview what would be migrated without inserting
 *   --batch=N    Set batch size (default: 1000)
 *   --table=T    Migrate specific table only
 */

import { Database } from "bun:sqlite";
import { PrismaClient } from "@prisma/client";
import * as readline from "readline";
import * as fs from "fs";
import { stdin, stdout } from "process";

const prisma = new PrismaClient();
const SQLITE_DB_PATH = "./datos.db";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const batchSizeArg = args.find((arg) => arg.startsWith("--batch="));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split("=")[1], 10) : 1000;
const specificTableArg = args.find((arg) => arg.startsWith("--table="));
const SPECIFIC_TABLE = specificTableArg ? specificTableArg.split("=")[1] : null;

// Global statistics
const globalStats = {
  startTime: null,
  tables: {},
};

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Fetch available laboratories from Prisma
 */
async function fetchLaboratories() {
  console.log("\n🔍 Fetching available laboratories...\n");
  
  const labs = await prisma.laboratory.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  if (labs.length === 0) {
    console.error("❌ No laboratories found in the database.");
    console.error("   Please create a laboratory first.");
    process.exit(1);
  }

  return labs;
}

/**
 * Prompt user to select a laboratory
 */
async function selectLaboratory(labs) {
  console.log("🏥 Available Laboratories:");
  console.log("─".repeat(50));
  
  labs.forEach((lab, index) => {
    console.log(`  ${index + 1}. ${lab.nombre} (${lab.id})`);
  });
  
  console.log("─".repeat(50));

  while (true) {
    const answer = await prompt("\nSelect laboratory (number): ");
    const selection = parseInt(answer, 10);

    if (selection >= 1 && selection <= labs.length) {
      const selectedLab = labs[selection - 1];
      console.log(`\n✅ Selected: ${selectedLab.nombre}\n`);
      return selectedLab.id;
    }

    console.log("❌ Invalid selection. Please try again.");
  }
}

/**
 * Confirm migration
 */
async function confirmMigration() {
  if (isDryRun) {
    console.log("\n🔍 DRY RUN MODE ENABLED");
    console.log("   No data will be inserted. This is a preview only.\n");
    return true;
  }

  console.log("\n⚠️  WARNING: This will insert data into the database.");
  const answer = await prompt("Do you want to continue? (yes/no): ");
  
  if (answer.toLowerCase() !== "yes") {
    console.log("\n❌ Migration cancelled.");
    process.exit(0);
  }

  return false;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toLocaleString("en-US");
}

/**
 * Format elapsed time
 */
function formatElapsedTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Print progress bar
 */
function printProgress(current, total, startTime) {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((percentage / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
  const elapsed = Date.now() - startTime;
  const rate = current / (elapsed / 1000);
  const eta = rate > 0 ? (total - current) / rate : 0;

  process.stdout.write(
    `\r${bar} ${percentage}% | ${formatNumber(current)}/${formatNumber(total)} | ` +
    `${formatNumber(Math.round(rate))}/s | ETA: ${formatElapsedTime(eta * 1000)}`
  );
}

/**
 * Generic migration function
 */
async function migrateTable(options) {
  const { name, sqlite, laboratoryId, sqliteQuery, prismaModel, mapRow, dependencies = {} } = options;
  
  console.log(`\n📦 Migrating ${name}...`);
  if (isDryRun) console.log("   Mode: DRY RUN");
  console.log(`   Batch size: ${formatNumber(BATCH_SIZE)}`);

  // Initialize stats
  const stats = {
    processed: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  globalStats.tables[name] = stats;

  // Get total count
  const countQuery = sqlite.query(`SELECT COUNT(*) as count FROM ${sqliteQuery.table}`);
  const totalCount = countQuery.get().count;
  console.log(`   Total records: ${formatNumber(totalCount)}\n`);

  if (totalCount === 0) {
    console.log(`   ⚠️  No records to migrate`);
    return;
  }

  // Load existing records for duplicate checking
  console.log("   Loading existing records...");
  const existingRecords = new Set(
    (await prismaModel.findMany({
      where: { laboratoryId },
      select: { codigoExterno: true },
    })).map((r) => r.codigoExterno).filter(Boolean)
  );
  console.log(`   Found ${formatNumber(existingRecords.size)} existing records`);

  // Build dependency maps
  const dependencyMaps = {};
  for (const [key, config] of Object.entries(dependencies)) {
    console.log(`   Loading ${key} map...`);
    const records = await config.model.findMany({
      where: { laboratoryId },
      select: { id: true, codigoExterno: true },
    });
    dependencyMaps[key] = new Map(records.map((r) => [r.codigoExterno, r.id]));
    console.log(`   ✓ ${key}: ${formatNumber(records.length)} mapped`);
  }
  console.log();

  // Query records
  const query = sqlite.query(sqliteQuery.sql);
  const startTime = Date.now();
  let batch = [];

  for (const row of query.iterate()) {
    stats.processed++;

    // Check if already exists
    const codigoExterno = String(row[sqliteQuery.idColumn]);
    if (existingRecords.has(codigoExterno)) {
      stats.skipped++;
      continue;
    }

    // Map row to Prisma data
    let data;
    try {
      data = mapRow(row, dependencyMaps, laboratoryId);
    } catch (error) {
      stats.failed++;
      stats.errors.push({ codigoExterno, reason: "mapping_error", details: error.message });
      continue;
    }

    // Skip if null (dependency missing)
    if (data === null) {
      stats.failed++;
      continue;
    }

    batch.push(data);

    // Process batch
    if (batch.length >= BATCH_SIZE) {
      if (!isDryRun) {
        try {
          await prismaModel.createMany({ data: batch, skipDuplicates: true });
        } catch (error) {
          stats.failed += batch.length;
          stats.errors.push({ batchSize: batch.length, reason: "insert_error", details: error.message });
        }
      }
      stats.inserted += batch.length;
      batch = [];
    }

    // Print progress
    if (stats.processed % 1000 === 0) {
      printProgress(stats.processed, totalCount, startTime);
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    if (!isDryRun) {
      try {
        await prismaModel.createMany({ data: batch, skipDuplicates: true });
      } catch (error) {
        stats.failed += batch.length;
        stats.errors.push({ batchSize: batch.length, reason: "insert_error", details: error.message });
      }
    }
    stats.inserted += batch.length;
  }

  printProgress(stats.processed, totalCount, startTime);
  console.log("\n");
}

/**
 * Migration definitions
 */
const migrations = {
  // TIER 1: Foundation tables
  methods: (sqlite, labId) => migrateTable({
    name: "Methods",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { table: "`DET Metodos`", sql: "SELECT IDMetodo, Nombre FROM `DET Metodos`", idColumn: "IDMetodo" },
    prismaModel: prisma.method,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDMetodo),
      nombre: row.Nombre,
      laboratoryId: labId,
    }),
  }),

  units: (sqlite, labId) => migrateTable({
    name: "Units",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { table: "`DET Unidades`", sql: "SELECT IDUnidad, Nombre FROM `DET Unidades`", idColumn: "IDUnidad" },
    prismaModel: prisma.unit,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDUnidad),
      nombre: row.Nombre,
      laboratoryId: labId,
    }),
  }),

  aspects: (sqlite, labId) => migrateTable({
    name: "Aspects",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { table: "`DET Aspectos`", sql: "SELECT IDAspecto, Nombre, Descripcion FROM `DET Aspectos`", idColumn: "IDAspecto" },
    prismaModel: prisma.aspect,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDAspecto),
      nombre: row.Nombre,
      descripcion: row.Descripcion,
      laboratoryId: labId,
    }),
  }),

  sections: (sqlite, labId) => migrateTable({
    name: "Sections",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { table: "`LAB Secciones`", sql: "SELECT IDSeccion, Nombre, UsarHDT, UsarETQ FROM `LAB Secciones`", idColumn: "IDSeccion" },
    prismaModel: prisma.section,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDSeccion),
      nombre: row.Nombre,
      hojaTrabajo: row.UsarHDT,
      etiqueta: row.UsarETQ,
      laboratoryId: labId,
    }),
  }),

  biochemists: (sqlite, labId) => migrateTable({
    name: "Biochemists",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`HMB Bioquimicos`", 
      sql: "SELECT IDBioquimico, Apellido, Nombre, Tratamiento, Codigo, Direccion, Ciudad, Provincia, CodigoPostal, Telefono, Celular, Notas FROM `HMB Bioquimicos`",
      idColumn: "IDBioquimico"
    },
    prismaModel: prisma.biochemist,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDBioquimico),
      apellido: row.Apellido || "",
      nombre: row.Nombre || "",
      tratamiento: row.Tratamiento,
      codigo: row.Codigo,
      direccion: row.Direccion,
      ciudad: row.Ciudad,
      provincia: row.Provincia,
      codigoPostal: row.CodigoPostal,
      telefono: row.Telefono,
      celular: row.Celular,
      notas: row.Notas,
      laboratoryId: labId,
    }),
  }),

  doctors: (sqlite, labId) => migrateTable({
    name: "Doctors",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`HMB Doctores`",
      sql: "SELECT IDDoctor, Apellido, Nombre, Tratamiento, MatriculaProvincial, Direccion, Ciudad, Provincia, CodigoPostal, Telefono, Celular, Notas FROM `HMB Doctores`",
      idColumn: "IDDoctor"
    },
    prismaModel: prisma.doctor,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDDoctor),
      apellido: row.Apellido || "",
      nombre: row.Nombre || "",
      tratamiento: row.Tratamiento,
      matriculaProvincial: row.MatriculaProvincial,
      direccion: row.Direccion,
      ciudad: row.Ciudad,
      provincia: row.Provincia,
      codigoPostal: row.CodigoPostal,
      telefono: row.Telefono,
      celular: row.Celular,
      notas: row.Notas,
      laboratoryId: labId,
    }),
  }),

  notifiedUsers: (sqlite, labId) => migrateTable({
    name: "NotifiedUsers",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`RLB Usuarios`",
      sql: "SELECT IDUsuario, Email, Apellido, Nombre, EnviarUnaCopia FROM `RLB Usuarios`",
      idColumn: "IDUsuario"
    },
    prismaModel: prisma.notifiedUser,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDUsuario),
      email: row.Email || `user${row.IDUsuario}@placeholder.com`,
      apellido: row.Apellido || "",
      nombre: row.Nombre || "",
      enviarUnaCopia: Boolean(row.EnviarUnaCopia),
      laboratoryId: labId,
    }),
  }),

  healthInsurances: (sqlite, labId) => migrateTable({
    name: "HealthInsurances",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`MND Obras Sociales`",
      sql: "SELECT IDObraSocial, Nombre, Codigo, Contado, Cortada, ValorNBU, SelectorRTR FROM `MND Obras Sociales`",
      idColumn: "IDObraSocial"
    },
    prismaModel: prisma.healthInsurance,
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDObraSocial),
      nombre: row.Nombre || `OS-${row.IDObraSocial}`,
      codigo: row.Codigo,
      contado: Boolean(row.Contado),
      cortada: Boolean(row.Cortada),
      valorNBU: row.ValorNBU || 0,
      selectorRTR: row.SelectorRTR || 0,
      laboratoryId: labId,
    }),
  }),

  // TIER 2: Patients
  patients: (sqlite, labId) => migrateTable({
    name: "Patients",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`HMB Pacientes`",
      sql: `SELECT IDPaciente, Apellido, Nombre, Sexo, FechaNacimiento, TipoDocumento, NumDocumento, 
              Direccion, EntreCalles, Ciudad, Provincia, CodigoPostal, TelefonoCasa, TelefonoTrabajo, TelefonoOtro, IDUsuario
              FROM \`HMB Pacientes\``,
      idColumn: "IDPaciente"
    },
    prismaModel: prisma.patient,
    dependencies: { notifiedUsers: { model: prisma.notifiedUser } },
    mapRow: (row, deps, labId) => {
      const notifiedUserId = row.IDUsuario ? deps.notifiedUsers.get(String(row.IDUsuario)) : null;
      
      return {
        codigoExterno: String(row.IDPaciente),
        apellido: row.Apellido || "Sin Apellido",
        nombre: row.Nombre || "Sin Nombre",
        sexo: row.Sexo || "",
        tipoDocumento: row.TipoDocumento || "",
        documento: row.NumDocumento || String(row.IDPaciente),
        fechaNacimiento: row.FechaNacimiento ? new Date(row.FechaNacimiento) : null,
        direccion: row.Direccion,
        entreCalles: row.EntreCalles,
        ciudad: row.Ciudad,
        provincia: row.Provincia,
        codigoPostal: row.CodigoPostal,
        telefono: row.TelefonoCasa || row.TelefonoTrabajo || row.TelefonoOtro,
        notifiedUserId,
        laboratoryId: labId,
      };
    },
  }),

  // TIER 3: Determinations
  determinations: (sqlite, labId) => migrateTable({
    name: "Determinations",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`DET Determinaciones`",
      sql: `SELECT IDDeterminacion, Nombre, Abreviatura, IDMetodo, InformarMetodo, Codigo, 
              MensajeDeIngreso, ComentarioFijo, IDAspecto, CondicionesMuestra, IDSeccion,
              ImprimirEnHDT, ResumirEnHDT, AlturaEnHDT
              FROM \`DET Determinaciones\``,
      idColumn: "IDDeterminacion"
    },
    prismaModel: prisma.determination,
    dependencies: {
      sections: { model: prisma.section },
      aspects: { model: prisma.aspect },
      methods: { model: prisma.method },
    },
    mapRow: (row, deps, labId) => ({
      codigoExterno: String(row.IDDeterminacion),
      nombre: row.Nombre || `Det-${row.IDDeterminacion}`,
      abreviatura: row.Abreviatura,
      methodId: row.IDMetodo ? deps.methods.get(String(row.IDMetodo)) : null,
      informarMetodo: Boolean(row.InformarMetodo),
      codigo: row.Codigo,
      mensajeIngreso: row.MensajeDeIngreso,
      comentarioFijo: row.ComentarioFijo,
      aspectId: row.IDAspecto ? deps.aspects.get(String(row.IDAspecto)) : null,
      condicionesMuestra: row.CondicionesMuestra,
      sectionId: row.IDSeccion ? deps.sections.get(String(row.IDSeccion)) : null,
      imprimirWorksheet: Boolean(row.ImprimirEnHDT),
      resumirWorksheet: Boolean(row.ResumirEnHDT),
      alturaWorksheet: row.AlturaEnHDT,
      laboratoryId: labId,
    }),
  }),

  // TIER 4: SubDeterminations
  subDeterminations: (sqlite, labId) => migrateTable({
    name: "SubDeterminations",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`DET SubDeterminaciones`",
      sql: `SELECT IDSubDeterminacion, IDDeterminacion, Nombre, Formato, IDUnidad, Calcular, 
              Informar, Informar2C, InformarTextoAntes, InformarCorteDespues, InformarVR,
              ValorMinimo, ValorMaximo
              FROM \`DET SubDeterminaciones\``,
      idColumn: "IDSubDeterminacion"
    },
    prismaModel: prisma.subDetermination,
    dependencies: {
      determinations: { model: prisma.determination },
      units: { model: prisma.unit },
    },
    mapRow: (row, deps, labId) => {
      const determinationId = deps.determinations.get(String(row.IDDeterminacion));
      if (!determinationId) {
        throw new Error(`Determination ${row.IDDeterminacion} not found`);
      }
      
      return {
        codigoExterno: String(row.IDSubDeterminacion),
        determinationId,
        nombre: row.Nombre || `SubDet-${row.IDSubDeterminacion}`,
        formato: row.Formato,
        unitId: row.IDUnidad ? deps.units.get(String(row.IDUnidad)) : null,
        calcular: Boolean(row.Calcular),
        informar: Boolean(row.Informar),
        informar2C: Boolean(row.Informar2C),
        informarTextoAntes: row.InformarTextoAntes,
        informarCorteDespues: Boolean(row.InformarCorteDespues),
        informarVR: Boolean(row.InformarVR),
        valorMinimo: row.ValorMinimo,
        valorMaximo: row.ValorMaximo,
        laboratoryId: labId,
      };
    },
  }),

  // TIER 5: Protocols
  protocols: (sqlite, labId) => migrateTable({
    name: "Protocols",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`PRO Protocolos`",
      sql: `SELECT IDProtocolo, NumProtocolo, FechaIngreso, IDPaciente, IDPortada, IDDoctor, 
              IDBioquimicoFirmante, IDUsuarioPublicado, IDUsuarioPortadaPublicado
              FROM \`PRO Protocolos\``,
      idColumn: "IDProtocolo"
    },
    prismaModel: prisma.protocol,
    dependencies: {
      patients: { model: prisma.patient },
      doctors: { model: prisma.doctor },
      biochemists: { model: prisma.biochemist },
      notifiedUsers: { model: prisma.notifiedUser },
    },
    mapRow: (row, deps, labId) => {
      const patientId = deps.patients.get(String(row.IDPaciente));
      if (!patientId) {
        throw new Error(`Patient ${row.IDPaciente} not found`);
      }

      return {
        codigoExterno: String(row.IDProtocolo),
        numeroSecuencial: String(row.NumProtocolo || row.IDProtocolo),
        patientId,
        doctorId: row.IDDoctor ? deps.doctors.get(String(row.IDDoctor)) : null,
        biochemistId: row.IDBioquimicoFirmante ? deps.biochemists.get(String(row.IDBioquimicoFirmante)) : null,
        notifiedUserId: row.IDUsuarioPublicado ? deps.notifiedUsers.get(String(row.IDUsuarioPublicado)) : null,
        notifiedUserPortadaId: row.IDUsuarioPortadaPublicado ? deps.notifiedUsers.get(String(row.IDUsuarioPortadaPublicado)) : null,
        laboratoryId: labId,
      };
    },
  }),

  // TIER 6: Results
  results: (sqlite, labId) => migrateTable({
    name: "Results",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`PRO Resultados`",
      sql: `SELECT IDResultado, IDProtocolo, IDDeterminacion, CometarioInterno, IDSeccion,
              Asignado, EtiquetaImpresa, Suspender, IDObraSocial, Precio, DebeReceta, DebeOrden, NumAutorizacion
              FROM \`PRO Resultados\``,
      idColumn: "IDResultado"
    },
    prismaModel: prisma.result,
    dependencies: {
      protocols: { model: prisma.protocol },
      determinations: { model: prisma.determination },
      sections: { model: prisma.section },
      healthInsurances: { model: prisma.healthInsurance },
    },
    mapRow: (row, deps, labId) => {
      const protocolId = deps.protocols.get(String(row.IDProtocolo));
      const determinationId = deps.determinations.get(String(row.IDDeterminacion));
      
      if (!protocolId) {
        throw new Error(`Protocol ${row.IDProtocolo} not found`);
      }
      if (!determinationId) {
        throw new Error(`Determination ${row.IDDeterminacion} not found`);
      }

      return {
        codigoExterno: String(row.IDResultado),
        protocolId,
        determinationId,
        comentarioInterno: row.CometarioInterno,
        sectionId: row.IDSeccion ? deps.sections.get(String(row.IDSeccion)) : null,
        asignado: Boolean(row.Asignado),
        etiquetaImpresa: Boolean(row.EtiquetaImpresa),
        suspender: Boolean(row.Suspender),
        healthInsuranceId: row.IDObraSocial ? deps.healthInsurances.get(String(row.IDObraSocial)) : null,
        precio: row.Precio || 0,
        debeReceta: Boolean(row.DebeReceta),
        debeOrden: Boolean(row.DebeOrden),
        numAutorizacion: row.NumAutorizacion,
        laboratoryId: labId,
      };
    },
  }),

  // TIER 7: SubResults
  subResults: (sqlite, labId) => migrateTable({
    name: "SubResults",
    sqlite,
    laboratoryId: labId,
    sqliteQuery: { 
      table: "`PRO SubResultados`",
      sql: "SELECT IDSubResultado, IDResultado, IDSubDeterminacion, Resultado, Comentario FROM `PRO SubResultados` WHERE IDSubResultado > 3251276",
      idColumn: "IDSubResultado"
    },
    prismaModel: prisma.subResult,
    dependencies: {
      results: { model: prisma.result },
      subDeterminations: { model: prisma.subDetermination },
    },
    mapRow: (row, deps, labId) => {
      const resultId = deps.results.get(String(row.IDResultado));
      const subDeterminationId = deps.subDeterminations.get(String(row.IDSubDeterminacion));
      
      if (!resultId) {
        throw new Error(`Result ${row.IDResultado} not found`);
      }
      if (!subDeterminationId) {
        throw new Error(`SubDetermination ${row.IDSubDeterminacion} not found`);
      }

      return {
        codigoExterno: String(row.IDSubResultado),
        resultId,
        subDeterminationId,
        valor: row.Resultado,
        comentario: row.Comentario,
        laboratoryId: labId,
      };
    },
  }),
};

/**
 * Print final report
 */
function printFinalReport() {
  const totalElapsed = Date.now() - globalStats.startTime;
  
  console.log("\n" + "=".repeat(70));
  console.log("📊 MIGRATION COMPLETE - FINAL REPORT");
  console.log("=".repeat(70));
  console.log(`\nMode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Total time: ${formatElapsedTime(totalElapsed)}\n`);

  console.log("─".repeat(70));
  console.log("TABLE SUMMARY");
  console.log("─".repeat(70));
  console.log(`${"Table".padEnd(20)} ${"Processed".padStart(12)} ${"Inserted".padStart(12)} ${"Skipped".padStart(12)} ${"Failed".padStart(12)}`);
  console.log("─".repeat(70));

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const [name, stats] of Object.entries(globalStats.tables)) {
    console.log(
      `${name.padEnd(20)} ` +
      `${formatNumber(stats.processed).padStart(12)} ` +
      `${formatNumber(stats.inserted).padStart(12)} ` +
      `${formatNumber(stats.skipped).padStart(12)} ` +
      `${formatNumber(stats.failed).padStart(12)}`
    );
    totalProcessed += stats.processed;
    totalInserted += stats.inserted;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;
  }

  console.log("─".repeat(70));
  console.log(
    `${"TOTAL".padEnd(20)} ` +
    `${formatNumber(totalProcessed).padStart(12)} ` +
    `${formatNumber(totalInserted).padStart(12)} ` +
    `${formatNumber(totalSkipped).padStart(12)} ` +
    `${formatNumber(totalFailed).padStart(12)}`
  );
  console.log("=".repeat(70));

  // Save error logs
  const allErrors = [];
  for (const [name, stats] of Object.entries(globalStats.tables)) {
    if (stats.errors.length > 0) {
      allErrors.push({ table: name, errors: stats.errors.slice(0, 100) });
    }
  }

  if (allErrors.length > 0) {
    const errorLogPath = `./migration-errors-${Date.now()}.json`;
    fs.writeFileSync(errorLogPath, JSON.stringify(allErrors, null, 2));
    console.log(`\n📝 Error logs saved to: ${errorLogPath}`);
  }

  console.log("\n✅ Migration complete!\n");
}

/**
 * Main migration function
 */
async function main() {
  console.log("\n" + "═".repeat(70));
  console.log("  SQLite to Prisma Migration Tool");
  console.log("  Complete Dependency-Ordered Migration");
  console.log("═".repeat(70));

  // Show configuration
  console.log("\n📋 Configuration:");
  console.log(`   SQLite DB: ${SQLITE_DB_PATH}`);
  console.log(`   Batch size: ${formatNumber(BATCH_SIZE)}`);
  console.log(`   Mode: ${isDryRun ? "DRY RUN" : "LIVE"}`);
  if (SPECIFIC_TABLE) {
    console.log(`   Specific table: ${SPECIFIC_TABLE}`);
  }

  // Connect to SQLite
  console.log("\n🔌 Connecting to SQLite database...");
  let sqlite;
  try {
    sqlite = new Database(SQLITE_DB_PATH, { readonly: true });
    console.log("   ✅ Connected to SQLite");
  } catch (error) {
    console.error("   ❌ Failed to connect to SQLite:", error.message);
    process.exit(1);
  }

  try {
    // Select laboratory
    const labs = await fetchLaboratories();
    const laboratoryId = await selectLaboratory(labs);

    // Confirm
    await confirmMigration();

    // Start migration
    globalStats.startTime = Date.now();
    console.log("\n🚀 Starting migration...\n");

    if (SPECIFIC_TABLE) {
      // Migrate specific table only
      if (migrations[SPECIFIC_TABLE]) {
        await migrations[SPECIFIC_TABLE](sqlite, laboratoryId);
      } else {
        console.error(`❌ Unknown table: ${SPECIFIC_TABLE}`);
        console.log("Available tables:", Object.keys(migrations).join(", "));
        process.exit(1);
      }
    } else {
      // Migrate all tables in dependency order
      const migrationOrder = [
        "methods",
        "units",
        "aspects",
        "sections",
        "biochemists",
        "doctors",
        "notifiedUsers",
        "healthInsurances",
        "patients",
        "determinations",
        "subDeterminations",
        "protocols",
        "results",
        "subResults",
      ];

      for (const migrationName of migrationOrder) {
        await migrations[migrationName](sqlite, laboratoryId);
      }
    }

    // Print final report
    printFinalReport();

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

// Run main
main().catch((error) => {
  console.error("\n❌ Unhandled error:", error);
  process.exit(1);
});
