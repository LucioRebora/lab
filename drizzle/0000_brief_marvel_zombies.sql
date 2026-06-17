-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."StringFormatType" AS ENUM('TEXT', 'INTEGER', 'DECIMAL_1', 'DECIMAL_2');--> statement-breakpoint
CREATE TABLE "abbreviation" (
	"id" text PRIMARY KEY NOT NULL,
	"resultado" text NOT NULL,
	"abreviatura" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "additional" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"abreviatura" text,
	"codigo" text,
	"agregar_siempre" boolean DEFAULT false NOT NULL,
	"agregar_en_urgencia" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "additional_prices_os_config" (
	"id" text PRIMARY KEY NOT NULL,
	"health_insurance_id" text NOT NULL,
	"additional_id" text NOT NULL,
	"monto_fijo" double precision DEFAULT 0,
	"porcentaje_sp" double precision DEFAULT 0,
	"en_lista" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aspect" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"codigo_externo" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_name" text,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"details" text,
	"metadata" jsonb,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"laboratory_id" text
);
--> statement-breakpoint
CREATE TABLE "biochemist" (
	"id" text PRIMARY KEY NOT NULL,
	"apellido" text NOT NULL,
	"nombre" text NOT NULL,
	"tratamiento" text,
	"codigo" text,
	"direccion" text,
	"ciudad" text,
	"provincia" text,
	"codigo_postal" text,
	"telefono" text,
	"celular" text,
	"notas" text,
	"firmante" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"paciente" text,
	"total" double precision NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"telefono" text,
	"sent_at" timestamp(3),
	"laboratory_id" text,
	"health_insurance_id" text
);
--> statement-breakpoint
CREATE TABLE "budget_item" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"codigo" integer,
	"nombre" text NOT NULL,
	"ub" double precision,
	"valor" double precision NOT NULL,
	"health_insurance_id" text NOT NULL,
	"health_insurance_nombre" text NOT NULL,
	"determination_id" text,
	"additional_id" text
);
--> statement-breakpoint
CREATE TABLE "calculator_step" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"sub_determination_id" text NOT NULL,
	"tipo_operacion" text NOT NULL,
	"argumento_numerico" double precision DEFAULT 0,
	"argumento_id_sub_dete" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cover" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"abreviatura" text,
	"direccion" text,
	"ciudad" text,
	"provincia" text,
	"codigo_postal" text,
	"telefono" text,
	"fax" text,
	"celular" text,
	"email" text,
	"comentario1" text,
	"comentario2" text,
	"comentario3" text,
	"comentario4" text,
	"comentario5" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "current_account" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"fecha" timestamp(3),
	"concepto" text,
	"debe" double precision DEFAULT 0 NOT NULL,
	"haber" double precision DEFAULT 0 NOT NULL,
	"saldo" double precision DEFAULT 0 NOT NULL,
	"tipo_com" text,
	"id_com" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_EquipmentToLaboratory" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_config" (
	"id" text PRIMARY KEY NOT NULL,
	"equipment_id" text NOT NULL,
	"laboratory_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_insurance" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"contado" boolean DEFAULT false NOT NULL,
	"cortada" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text,
	"selector_rtr" integer DEFAULT 0,
	"valor_nbu" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "external_record" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre_tabla" text NOT NULL,
	"datos" jsonb NOT NULL,
	"codigo_externo" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"procesado" integer DEFAULT 0 NOT NULL,
	"error" text,
	"intentos" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "determination" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"abreviatura" text,
	"mensaje_ingreso" text,
	"comentario_fijo" text,
	"aspecto" text,
	"condiciones_muestra" text,
	"imprimir_worksheet" boolean DEFAULT true NOT NULL,
	"resumir_worksheet" boolean DEFAULT false NOT NULL,
	"altura_worksheet" double precision,
	"section_id" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"aspect_id" text,
	"codigo" text,
	"codigo_externo" text,
	"method_id" text,
	"unit_id" text,
	"informar_metodo" boolean DEFAULT true NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"cod_manlab" varchar(6),
	"imprimir_historico" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor" (
	"id" text PRIMARY KEY NOT NULL,
	"apellido" text NOT NULL,
	"nombre" text NOT NULL,
	"tratamiento" text,
	"matricula_provincial" text,
	"direccion" text,
	"ciudad" text,
	"provincia" text,
	"codigo_postal" text,
	"telefono" text,
	"celular" text,
	"notas" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "laboratory" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text,
	"direccion" text,
	"codigo_postal" text,
	"ciudad" text,
	"provincia" text,
	"pais" text,
	"telefono" text,
	"sitio_web" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"logo" text
);
--> statement-breakpoint
CREATE TABLE "manlab_export" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"cliente" integer NOT NULL,
	"count" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"resultIds" text[] DEFAULT '{"RAY"}',
	"status" text DEFAULT 'PENDING' NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manlab_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notified_user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"apellido" text NOT NULL,
	"nombre" text,
	"codigo_externo" text,
	"laboratory_id" text,
	"enviar_una_copia" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"clave" text
);
--> statement-breakpoint
CREATE TABLE "manlab_order" (
	"id" text PRIMARY KEY NOT NULL,
	"barcode" text,
	"rotulo" text,
	"cliente" integer DEFAULT 0 NOT NULL,
	"cod_prestacion" text,
	"iva" text DEFAULT 'O',
	"comentario" text,
	"diuresis" double precision DEFAULT 0 NOT NULL,
	"tipo_documento" text,
	"numero_documento" text,
	"result_id" text NOT NULL,
	"enviado" boolean DEFAULT false NOT NULL,
	"fecha_enviado" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"manlab_export_id" text
);
--> statement-breakpoint
CREATE TABLE "patient_health_insurance" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"health_insurance_id" text NOT NULL,
	"nro_afiliado" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "method" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"patient_id" text NOT NULL,
	"fecha" timestamp(3),
	"concepto" text,
	"importe" double precision DEFAULT 0 NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices_os_config" (
	"id" text PRIMARY KEY NOT NULL,
	"health_insurance_id" text NOT NULL,
	"determination_id" text NOT NULL,
	"cantidad_nbu" double precision DEFAULT 0,
	"monto_fijo" double precision DEFAULT 0,
	"precio" double precision DEFAULT 0,
	"en_lista" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_note" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"laboratory_id" text
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" text PRIMARY KEY NOT NULL,
	"apellido" text NOT NULL,
	"nombre" text NOT NULL,
	"sexo" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"documento" text,
	"fecha_nacimiento" timestamp(3),
	"edad" integer,
	"email" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"telefono" text,
	"direccion" text,
	"ciudad" text,
	"codigo_postal" text,
	"entre_calles" text,
	"provincia" text,
	"codigo_externo" text,
	"clave_informe" text,
	"notified_user_id" text
);
--> statement-breakpoint
CREATE TABLE "protocol" (
	"id" text PRIMARY KEY NOT NULL,
	"numero_secuencial" text NOT NULL,
	"patient_id" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"doctor_id" text,
	"biochemist_id" text,
	"codigo_externo" text,
	"notified_user_id" text,
	"notified_user_portada_id" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"completo" boolean DEFAULT false NOT NULL,
	"contador_pcd" boolean DEFAULT false NOT NULL,
	"creado" boolean DEFAULT false NOT NULL,
	"etiqueta_impresa" boolean DEFAULT false NOT NULL,
	"firmado" boolean DEFAULT false NOT NULL,
	"impreso" boolean DEFAULT false NOT NULL,
	"imprimir_portada" boolean DEFAULT false NOT NULL,
	"muestra_mry" text,
	"nota_encabezado" text,
	"nota_pie" text,
	"para_crear" boolean DEFAULT false NOT NULL,
	"para_imprimir" boolean DEFAULT false NOT NULL,
	"para_revisar" boolean DEFAULT false NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"sena" double precision DEFAULT 0 NOT NULL,
	"para_publicar" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mapper_cm260" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"sub_determination_id" text NOT NULL,
	"tecnica" text,
	"laboratory_id" text NOT NULL,
	"equipment_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "sub_result" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"result_id" text NOT NULL,
	"sub_determination_id" text NOT NULL,
	"valor" text,
	"comentario" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"hoja_trabajo" text,
	"etiqueta" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"codigo_externo" text
);
--> statement-breakpoint
CREATE TABLE "worksheet_print_log" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"user_id" text NOT NULL,
	"result_ids" text[],
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worksheet" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo" varchar(15) NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "result" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"protocol_id" text NOT NULL,
	"determination_id" text NOT NULL,
	"section_id" text,
	"health_insurance_id" text,
	"comentario_interno" text,
	"asignado" boolean DEFAULT false NOT NULL,
	"etiqueta_impresa" boolean DEFAULT false NOT NULL,
	"suspender" boolean DEFAULT false NOT NULL,
	"precio" double precision DEFAULT 0 NOT NULL,
	"debe_receta" boolean DEFAULT false NOT NULL,
	"debe_orden" boolean DEFAULT false NOT NULL,
	"num_autorizacion" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"etiqueta" varchar(15) NOT NULL,
	"codigo" varchar(15) NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"laboratory_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'USER' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"laboratory_id" text,
	"image" text,
	"telefono" text
);
--> statement-breakpoint
CREATE TABLE "additional_applyed" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"protocol_id" text NOT NULL,
	"additional_id" text NOT NULL,
	"health_insurance_id" text,
	"monto_fijo" double precision DEFAULT 0,
	"porcentaje_sp" double precision DEFAULT 0,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_determination" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"codigo_externo" text,
	"determination_id" text NOT NULL,
	"unit_id" text,
	"laboratory_id" text,
	"calcular" boolean DEFAULT false NOT NULL,
	"informar" boolean DEFAULT true NOT NULL,
	"informar2_c" boolean DEFAULT false NOT NULL,
	"informar_texto_antes" text,
	"informar_corte_despues" boolean DEFAULT false NOT NULL,
	"informar_vr" boolean DEFAULT true NOT NULL,
	"valor_minimo" text,
	"valor_maximo" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"formato" "StringFormatType",
	"activa" boolean DEFAULT true NOT NULL,
	"cod_manlab" varchar(6)
);
--> statement-breakpoint
CREATE TABLE "reference_value" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_externo" text,
	"sub_determination_id" text NOT NULL,
	"categoria" text,
	"valores_normales" text,
	"informar_unidades" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "abbreviation" ADD CONSTRAINT "abbreviation_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional" ADD CONSTRAINT "additional_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."additional"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "aspect" ADD CONSTRAINT "aspect_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "biochemist" ADD CONSTRAINT "biochemist_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_item" ADD CONSTRAINT "budget_item_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."additional"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_item" ADD CONSTRAINT "budget_item_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_item" ADD CONSTRAINT "budget_item_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."determination"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "budget_item" ADD CONSTRAINT "budget_item_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "calculator_step" ADD CONSTRAINT "calculator_step_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "calculator_step" ADD CONSTRAINT "calculator_step_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cover" ADD CONSTRAINT "cover_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "current_account" ADD CONSTRAINT "current_account_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "current_account" ADD CONSTRAINT "current_account_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_EquipmentToLaboratory" ADD CONSTRAINT "_EquipmentToLaboratory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_EquipmentToLaboratory" ADD CONSTRAINT "_EquipmentToLaboratory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."laboratory"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_config" ADD CONSTRAINT "equipment_config_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipment_config" ADD CONSTRAINT "equipment_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "health_insurance" ADD CONSTRAINT "health_insurance_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "external_record" ADD CONSTRAINT "external_record_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "determination" ADD CONSTRAINT "determination_aspect_id_fkey" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspect"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "determination" ADD CONSTRAINT "determination_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "determination" ADD CONSTRAINT "determination_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "public"."method"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "determination" ADD CONSTRAINT "determination_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "determination" ADD CONSTRAINT "determination_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notified_user" ADD CONSTRAINT "notified_user_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "manlab_order" ADD CONSTRAINT "manlab_order_manlab_export_id_fkey" FOREIGN KEY ("manlab_export_id") REFERENCES "public"."manlab_export"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "manlab_order" ADD CONSTRAINT "manlab_order_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."result"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_health_insurance" ADD CONSTRAINT "patient_health_insurance_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_health_insurance" ADD CONSTRAINT "patient_health_insurance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "method" ADD CONSTRAINT "method_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "prices_os_config" ADD CONSTRAINT "prices_os_config_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "prices_os_config" ADD CONSTRAINT "prices_os_config_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "prices_os_config" ADD CONSTRAINT "prices_os_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol_note" ADD CONSTRAINT "protocol_note_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol_note" ADD CONSTRAINT "protocol_note_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol_note" ADD CONSTRAINT "protocol_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_notified_user_id_fkey" FOREIGN KEY ("notified_user_id") REFERENCES "public"."notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_biochemist_id_fkey" FOREIGN KEY ("biochemist_id") REFERENCES "public"."biochemist"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_notified_user_id_fkey" FOREIGN KEY ("notified_user_id") REFERENCES "public"."notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_notified_user_portada_id_fkey" FOREIGN KEY ("notified_user_portada_id") REFERENCES "public"."notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mapper_cm260" ADD CONSTRAINT "mapper_cm260_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mapper_cm260" ADD CONSTRAINT "mapper_cm260_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mapper_cm260" ADD CONSTRAINT "mapper_cm260_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_result" ADD CONSTRAINT "sub_result_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_result" ADD CONSTRAINT "sub_result_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."result"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_result" ADD CONSTRAINT "sub_result_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_etiqueta_laboratory_id_fkey" FOREIGN KEY ("etiqueta","laboratory_id") REFERENCES "public"."tag"("codigo","laboratory_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_hoja_trabajo_laboratory_id_fkey" FOREIGN KEY ("hoja_trabajo","laboratory_id") REFERENCES "public"."worksheet"("codigo","laboratory_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "worksheet_print_log" ADD CONSTRAINT "worksheet_print_log_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "worksheet_print_log" ADD CONSTRAINT "worksheet_print_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "worksheet" ADD CONSTRAINT "worksheet_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "setting" ADD CONSTRAINT "setting_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_applyed" ADD CONSTRAINT "additional_applyed_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."additional"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_applyed" ADD CONSTRAINT "additional_applyed_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_applyed" ADD CONSTRAINT "additional_applyed_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "additional_applyed" ADD CONSTRAINT "additional_applyed_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_determination" ADD CONSTRAINT "sub_determination_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_determination" ADD CONSTRAINT "sub_determination_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sub_determination" ADD CONSTRAINT "sub_determination_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reference_value" ADD CONSTRAINT "reference_value_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reference_value" ADD CONSTRAINT "reference_value_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "abbreviation_resultado_codigo_externo_laboratory_id_key" ON "abbreviation" USING btree ("resultado" text_ops,"codigo_externo" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_codigo_externo_key" ON "additional" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_nombre_laboratory_id_key" ON "additional" USING btree ("nombre" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_prices_os_config_health_insurance_id_additional__key" ON "additional_prices_os_config" USING btree ("health_insurance_id" text_ops,"additional_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "aspect_nombre_laboratory_id_key" ON "aspect" USING btree ("nombre" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "audit_log_entity_id_entity_idx" ON "audit_log" USING btree ("entity_id" text_ops,"entity" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "calculator_step_codigo_externo_key" ON "calculator_step" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE INDEX "calculator_step_sub_determination_id_idx" ON "calculator_step" USING btree ("sub_determination_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_EquipmentToLaboratory_AB_unique" ON "_EquipmentToLaboratory" USING btree ("A" text_ops,"B" text_ops);--> statement-breakpoint
CREATE INDEX "_EquipmentToLaboratory_B_index" ON "_EquipmentToLaboratory" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_config_equipment_id_laboratory_id_key" ON "equipment_config" USING btree ("equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "health_insurance_codigo_externo_key" ON "health_insurance" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "health_insurance_nombre_laboratory_id_key" ON "health_insurance" USING btree ("nombre" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "external_record_nombre_tabla_codigo_externo_laboratory_id_key" ON "external_record" USING btree ("nombre_tabla" text_ops,"codigo_externo" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "determination_codigo_externo_key" ON "determination" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "determination_nombre_codigo_externo_laboratory_id_key" ON "determination" USING btree ("nombre" text_ops,"codigo_externo" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_codigo_externo_key" ON "doctor" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "manlab_setting_key_key" ON "manlab_setting" USING btree ("key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "notified_user_email_laboratory_id_key" ON "notified_user" USING btree ("email" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "manlab_order_result_id_key" ON "manlab_order" USING btree ("result_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_health_insurance_codigo_externo_key" ON "patient_health_insurance" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_health_insurance_patient_id_health_insurance_id_key" ON "patient_health_insurance" USING btree ("patient_id" text_ops,"health_insurance_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "method_nombre_laboratory_id_key" ON "method" USING btree ("nombre" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_codigo_externo_key" ON "payment" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "prices_os_config_health_insurance_id_determination_id_labor_key" ON "prices_os_config" USING btree ("health_insurance_id" text_ops,"determination_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_codigo_externo_key" ON "patient" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE INDEX "patient_documento_idx" ON "patient" USING btree ("documento" text_ops);--> statement-breakpoint
CREATE INDEX "patient_laboratory_id_apellido_nombre_idx" ON "patient" USING btree ("laboratory_id" text_ops,"apellido" text_ops,"nombre" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_codigo_externo_key" ON "protocol" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE INDEX "protocol_created_at_idx" ON "protocol" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "protocol_laboratory_id_status_idx" ON "protocol" USING btree ("laboratory_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_numero_secuencial_laboratory_id_key" ON "protocol" USING btree ("numero_secuencial" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "mapper_cm260_codigo_externo_key" ON "mapper_cm260" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "mapper_cm260_sub_determination_id_equipment_id_laboratory_i_key" ON "mapper_cm260" USING btree ("sub_determination_id" text_ops,"equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE INDEX "mapper_cm260_tecnica_equipment_id_laboratory_id_idx" ON "mapper_cm260" USING btree ("tecnica" text_ops,"equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unit_nombre_codigo_externo_laboratory_id_key" ON "unit" USING btree ("nombre" text_ops,"codigo_externo" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_result_codigo_externo_key" ON "sub_result" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE INDEX "sub_result_result_id_idx" ON "sub_result" USING btree ("result_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_result_result_id_sub_determination_id_key" ON "sub_result" USING btree ("result_id" text_ops,"sub_determination_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "section_nombre_laboratory_id_key" ON "section" USING btree ("nombre" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE INDEX "worksheet_print_log_section_id_idx" ON "worksheet_print_log" USING btree ("section_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "result_codigo_externo_key" ON "result" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE INDEX "result_protocol_id_idx" ON "result" USING btree ("protocol_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "setting_key_laboratory_id_key" ON "setting" USING btree ("key" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_applyed_codigo_externo_key" ON "additional_applyed" USING btree ("codigo_externo" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_determination_codigo_externo_determination_id_laborator_key" ON "sub_determination" USING btree ("codigo_externo" text_ops,"determination_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "reference_value_codigo_externo_sub_determination_id_laborat_key" ON "reference_value" USING btree ("codigo_externo" text_ops,"sub_determination_id" text_ops,"laboratory_id" text_ops);
*/