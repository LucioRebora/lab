CREATE TYPE "public"."StringFormatType" AS ENUM('TEXT', 'INTEGER', 'DECIMAL_1', 'DECIMAL_2');--> statement-breakpoint
CREATE TABLE "LAB_abbreviation" (
	"id" text PRIMARY KEY NOT NULL,
	"result" text NOT NULL,
	"abbreviation" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_additional" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text,
	"code" text,
	"always_add" boolean DEFAULT false NOT NULL,
	"add_on_urgency" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_additional_applyed" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"protocol_id" text NOT NULL,
	"additional_id" text NOT NULL,
	"health_insurance_id" text,
	"fixed_amount" double precision DEFAULT 0,
	"sp_percentage" double precision DEFAULT 0,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_additional_prices_os_config" (
	"id" text PRIMARY KEY NOT NULL,
	"health_insurance_id" text NOT NULL,
	"additional_id" text NOT NULL,
	"fixed_amount" double precision DEFAULT 0,
	"sp_percentage" double precision DEFAULT 0,
	"in_list" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_aspect" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"external_code" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_audit_log" (
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
CREATE TABLE "LAB_biochemist" (
	"id" text PRIMARY KEY NOT NULL,
	"last_name" text NOT NULL,
	"name" text NOT NULL,
	"treatment" text,
	"code" text,
	"address" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"phone" text,
	"cellphone" text,
	"notes" text,
	"signer" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_budget" (
	"id" text PRIMARY KEY NOT NULL,
	"patient" text,
	"total" double precision NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"phone" text,
	"sent_at" timestamp(3),
	"laboratory_id" text,
	"health_insurance_id" text
);
--> statement-breakpoint
CREATE TABLE "LAB_budget_item" (
	"id" text PRIMARY KEY NOT NULL,
	"budget_id" text NOT NULL,
	"code" integer,
	"name" text NOT NULL,
	"ub" double precision,
	"value" double precision NOT NULL,
	"health_insurance_id" text NOT NULL,
	"health_insurance_name" text NOT NULL,
	"determination_id" text,
	"additional_id" text
);
--> statement-breakpoint
CREATE TABLE "LAB_calculator_step" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"sub_determination_id" text NOT NULL,
	"operation_type" text NOT NULL,
	"numeric_argument" double precision DEFAULT 0,
	"argument_id_sub_dete" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_cover" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text,
	"address" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"phone" text,
	"fax" text,
	"cellphone" text,
	"email" text,
	"comment1" text,
	"comment2" text,
	"comment3" text,
	"comment4" text,
	"comment5" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_current_account" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"date" timestamp(3),
	"concept" text,
	"debit" double precision DEFAULT 0 NOT NULL,
	"credit" double precision DEFAULT 0 NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"com_type" text,
	"com_id" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_determination" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text,
	"entry_message" text,
	"fixed_comment" text,
	"aspect" text,
	"sample_conditions" text,
	"print_worksheet" boolean DEFAULT true NOT NULL,
	"summarize_worksheet" boolean DEFAULT false NOT NULL,
	"worksheet_height" double precision,
	"section_id" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"aspect_id" text,
	"code" text,
	"external_code" text,
	"method_id" text,
	"unit_id" text,
	"report_method" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"cod_manlab" varchar(6),
	"print_history" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_doctor" (
	"id" text PRIMARY KEY NOT NULL,
	"last_name" text NOT NULL,
	"name" text NOT NULL,
	"treatment" text,
	"provincial_license" text,
	"address" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"phone" text,
	"cellphone" text,
	"notes" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"email" text,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_equipment_config" (
	"id" text PRIMARY KEY NOT NULL,
	"equipment_id" text NOT NULL,
	"laboratory_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_LAB_EquipmentToLaboratory" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_external_record" (
	"id" text PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"data" jsonb NOT NULL,
	"external_code" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_health_insurance" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cash" boolean DEFAULT false NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text,
	"selector_rtr" integer DEFAULT 0,
	"nbu_value" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "LAB_laboratory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"address" text,
	"postal_code" text,
	"city" text,
	"province" text,
	"country" text,
	"phone" text,
	"website" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"logo" text
);
--> statement-breakpoint
CREATE TABLE "LAB_manlab_export" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"client" integer NOT NULL,
	"count" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"resultIds" text[] DEFAULT '{"RAY"}',
	"status" text DEFAULT 'PENDING' NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_manlab_order" (
	"id" text PRIMARY KEY NOT NULL,
	"barcode" text,
	"label" text,
	"client" integer DEFAULT 0 NOT NULL,
	"cod_prestacion" text,
	"iva" text DEFAULT 'O',
	"comment" text,
	"diuresis" double precision DEFAULT 0 NOT NULL,
	"document_type" text,
	"document_number" text,
	"result_id" text NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"manlab_export_id" text
);
--> statement-breakpoint
CREATE TABLE "LAB_manlab_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_mapper_cm260" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"sub_determination_id" text NOT NULL,
	"technique" text,
	"laboratory_id" text NOT NULL,
	"equipment_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_method" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_notified_user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"last_name" text NOT NULL,
	"name" text,
	"external_code" text,
	"laboratory_id" text,
	"send_copy" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "LAB_patient" (
	"id" text PRIMARY KEY NOT NULL,
	"last_name" text NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"document_type" text NOT NULL,
	"document" text,
	"birth_date" timestamp(3),
	"age" integer,
	"email" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"postal_code" text,
	"between_streets" text,
	"province" text,
	"external_code" text,
	"report_key" text,
	"notified_user_id" text
);
--> statement-breakpoint
CREATE TABLE "LAB_patient_health_insurance" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"health_insurance_id" text NOT NULL,
	"affiliate_number" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"patient_id" text NOT NULL,
	"date" timestamp(3),
	"concept" text,
	"amount" double precision DEFAULT 0 NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_prices_os_config" (
	"id" text PRIMARY KEY NOT NULL,
	"health_insurance_id" text NOT NULL,
	"determination_id" text NOT NULL,
	"nbu_quantity" double precision DEFAULT 0,
	"fixed_amount" double precision DEFAULT 0,
	"precio" double precision DEFAULT 0,
	"in_list" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_protocol" (
	"id" text PRIMARY KEY NOT NULL,
	"sequential_number" text NOT NULL,
	"patient_id" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"doctor_id" text,
	"biochemist_id" text,
	"external_code" text,
	"notified_user_id" text,
	"notified_user_portada_id" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"complete" boolean DEFAULT false NOT NULL,
	"pcd_counter" boolean DEFAULT false NOT NULL,
	"created" boolean DEFAULT false NOT NULL,
	"label_printed" boolean DEFAULT false NOT NULL,
	"signed" boolean DEFAULT false NOT NULL,
	"printed" boolean DEFAULT false NOT NULL,
	"print_cover" boolean DEFAULT false NOT NULL,
	"sample_mry" text,
	"header_note" text,
	"footer_note" text,
	"to_create" boolean DEFAULT false NOT NULL,
	"to_print" boolean DEFAULT false NOT NULL,
	"to_review" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"deposit" double precision DEFAULT 0 NOT NULL,
	"to_publish" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_protocol_note" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"laboratory_id" text
);
--> statement-breakpoint
CREATE TABLE "LAB_reference_value" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"sub_determination_id" text NOT NULL,
	"category" text,
	"normal_values" text,
	"report_units" boolean DEFAULT true NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_result" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"protocol_id" text NOT NULL,
	"determination_id" text NOT NULL,
	"section_id" text,
	"health_insurance_id" text,
	"internal_comment" text,
	"assigned" boolean DEFAULT false NOT NULL,
	"label_printed" boolean DEFAULT false NOT NULL,
	"suspend" boolean DEFAULT false NOT NULL,
	"precio" double precision DEFAULT 0 NOT NULL,
	"owes_prescription" boolean DEFAULT false NOT NULL,
	"owes_order" boolean DEFAULT false NOT NULL,
	"authorization_number" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_section" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"worksheet" text,
	"etiqueta" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"laboratory_id" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_sub_determination" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"external_code" text,
	"determination_id" text NOT NULL,
	"unit_id" text,
	"laboratory_id" text,
	"calculate" boolean DEFAULT false NOT NULL,
	"report" boolean DEFAULT true NOT NULL,
	"report_2c" boolean DEFAULT false NOT NULL,
	"report_text_before" text,
	"report_cutoff_after" boolean DEFAULT false NOT NULL,
	"report_reference_value" boolean DEFAULT true NOT NULL,
	"minimum_value" text,
	"maximum_value" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"formato" "StringFormatType",
	"active" boolean DEFAULT true NOT NULL,
	"cod_manlab" varchar(6)
);
--> statement-breakpoint
CREATE TABLE "LAB_sub_result" (
	"id" text PRIMARY KEY NOT NULL,
	"external_code" text,
	"result_id" text NOT NULL,
	"sub_determination_id" text NOT NULL,
	"value" text,
	"comment" text,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"etiqueta" varchar(15) NOT NULL,
	"code" varchar(15) NOT NULL,
	"name" varchar(50) NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"external_code" text
);
--> statement-breakpoint
CREATE TABLE "LAB_user" (
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
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "LAB_worksheet" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(15) NOT NULL,
	"name" varchar(50) NOT NULL,
	"laboratory_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "LAB_worksheet_print_log" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"user_id" text NOT NULL,
	"result_ids" text[],
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "LAB_abbreviation" ADD CONSTRAINT "abbreviation_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional" ADD CONSTRAINT "additional_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_applyed" ADD CONSTRAINT "additional_applyed_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."LAB_additional"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_applyed" ADD CONSTRAINT "additional_applyed_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_applyed" ADD CONSTRAINT "additional_applyed_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_applyed" ADD CONSTRAINT "additional_applyed_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."LAB_protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."LAB_additional"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_additional_prices_os_config" ADD CONSTRAINT "additional_prices_os_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_aspect" ADD CONSTRAINT "aspect_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_audit_log" ADD CONSTRAINT "audit_log_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_biochemist" ADD CONSTRAINT "biochemist_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget" ADD CONSTRAINT "budget_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget" ADD CONSTRAINT "budget_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget_item" ADD CONSTRAINT "budget_item_additional_id_fkey" FOREIGN KEY ("additional_id") REFERENCES "public"."LAB_additional"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget_item" ADD CONSTRAINT "budget_item_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."LAB_budget"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget_item" ADD CONSTRAINT "budget_item_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."LAB_determination"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_budget_item" ADD CONSTRAINT "budget_item_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_calculator_step" ADD CONSTRAINT "calculator_step_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_calculator_step" ADD CONSTRAINT "calculator_step_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."LAB_sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_cover" ADD CONSTRAINT "cover_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_current_account" ADD CONSTRAINT "current_account_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_current_account" ADD CONSTRAINT "current_account_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."LAB_patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_determination" ADD CONSTRAINT "determination_aspect_id_fkey" FOREIGN KEY ("aspect_id") REFERENCES "public"."LAB_aspect"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_determination" ADD CONSTRAINT "determination_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_determination" ADD CONSTRAINT "determination_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "public"."LAB_method"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_determination" ADD CONSTRAINT "determination_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."LAB_section"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_determination" ADD CONSTRAINT "determination_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."LAB_unit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_doctor" ADD CONSTRAINT "doctor_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_equipment_config" ADD CONSTRAINT "equipment_config_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."LAB_equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_equipment_config" ADD CONSTRAINT "equipment_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_LAB_EquipmentToLaboratory" ADD CONSTRAINT "_EquipmentToLaboratory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."LAB_equipment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_LAB_EquipmentToLaboratory" ADD CONSTRAINT "_EquipmentToLaboratory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."LAB_laboratory"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_external_record" ADD CONSTRAINT "external_record_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_health_insurance" ADD CONSTRAINT "health_insurance_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_manlab_order" ADD CONSTRAINT "manlab_order_manlab_export_id_fkey" FOREIGN KEY ("manlab_export_id") REFERENCES "public"."LAB_manlab_export"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_manlab_order" ADD CONSTRAINT "manlab_order_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."LAB_result"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_mapper_cm260" ADD CONSTRAINT "mapper_cm260_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."LAB_equipment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_mapper_cm260" ADD CONSTRAINT "mapper_cm260_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_mapper_cm260" ADD CONSTRAINT "mapper_cm260_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."LAB_sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_method" ADD CONSTRAINT "method_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_notified_user" ADD CONSTRAINT "notified_user_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_patient" ADD CONSTRAINT "patient_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_patient" ADD CONSTRAINT "patient_notified_user_id_fkey" FOREIGN KEY ("notified_user_id") REFERENCES "public"."LAB_notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_patient_health_insurance" ADD CONSTRAINT "patient_health_insurance_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_patient_health_insurance" ADD CONSTRAINT "patient_health_insurance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."LAB_patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_payment" ADD CONSTRAINT "payment_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_payment" ADD CONSTRAINT "payment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."LAB_patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_prices_os_config" ADD CONSTRAINT "prices_os_config_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."LAB_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_prices_os_config" ADD CONSTRAINT "prices_os_config_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_prices_os_config" ADD CONSTRAINT "prices_os_config_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_biochemist_id_fkey" FOREIGN KEY ("biochemist_id") REFERENCES "public"."LAB_biochemist"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."LAB_doctor"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_notified_user_id_fkey" FOREIGN KEY ("notified_user_id") REFERENCES "public"."LAB_notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_notified_user_portada_id_fkey" FOREIGN KEY ("notified_user_portada_id") REFERENCES "public"."LAB_notified_user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol" ADD CONSTRAINT "protocol_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."LAB_patient"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol_note" ADD CONSTRAINT "protocol_note_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol_note" ADD CONSTRAINT "protocol_note_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."LAB_protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_protocol_note" ADD CONSTRAINT "protocol_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."LAB_user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_reference_value" ADD CONSTRAINT "reference_value_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_reference_value" ADD CONSTRAINT "reference_value_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."LAB_sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_result" ADD CONSTRAINT "result_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."LAB_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_result" ADD CONSTRAINT "result_health_insurance_id_fkey" FOREIGN KEY ("health_insurance_id") REFERENCES "public"."LAB_health_insurance"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_result" ADD CONSTRAINT "result_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_result" ADD CONSTRAINT "result_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "public"."LAB_protocol"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_result" ADD CONSTRAINT "result_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."LAB_section"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_section" ADD CONSTRAINT "section_etiqueta_laboratory_id_fkey" FOREIGN KEY ("etiqueta","laboratory_id") REFERENCES "public"."LAB_tag"("code","laboratory_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_section" ADD CONSTRAINT "section_hoja_trabajo_laboratory_id_fkey" FOREIGN KEY ("worksheet","laboratory_id") REFERENCES "public"."LAB_worksheet"("code","laboratory_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_section" ADD CONSTRAINT "section_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_setting" ADD CONSTRAINT "setting_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_determination" ADD CONSTRAINT "sub_determination_determination_id_fkey" FOREIGN KEY ("determination_id") REFERENCES "public"."LAB_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_determination" ADD CONSTRAINT "sub_determination_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_determination" ADD CONSTRAINT "sub_determination_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."LAB_unit"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_result" ADD CONSTRAINT "sub_result_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_result" ADD CONSTRAINT "sub_result_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."LAB_result"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_sub_result" ADD CONSTRAINT "sub_result_sub_determination_id_fkey" FOREIGN KEY ("sub_determination_id") REFERENCES "public"."LAB_sub_determination"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_tag" ADD CONSTRAINT "tag_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_unit" ADD CONSTRAINT "unit_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_user" ADD CONSTRAINT "user_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_worksheet" ADD CONSTRAINT "worksheet_laboratory_id_fkey" FOREIGN KEY ("laboratory_id") REFERENCES "public"."LAB_laboratory"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_worksheet_print_log" ADD CONSTRAINT "worksheet_print_log_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."LAB_section"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "LAB_worksheet_print_log" ADD CONSTRAINT "worksheet_print_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."LAB_user"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "abbreviation_resultado_codigo_externo_laboratory_id_key" ON "LAB_abbreviation" USING btree ("result" text_ops,"external_code" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_codigo_externo_key" ON "LAB_additional" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_nombre_laboratory_id_key" ON "LAB_additional" USING btree ("name" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_applyed_codigo_externo_key" ON "LAB_additional_applyed" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "additional_prices_os_config_health_insurance_id_additional__key" ON "LAB_additional_prices_os_config" USING btree ("health_insurance_id" text_ops,"additional_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "aspect_nombre_laboratory_id_key" ON "LAB_aspect" USING btree ("name" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "LAB_audit_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "audit_log_entity_id_entity_idx" ON "LAB_audit_log" USING btree ("entity_id" text_ops,"entity" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "calculator_step_codigo_externo_key" ON "LAB_calculator_step" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE INDEX "calculator_step_sub_determination_id_idx" ON "LAB_calculator_step" USING btree ("sub_determination_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "determination_codigo_externo_key" ON "LAB_determination" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "determination_nombre_codigo_externo_laboratory_id_key" ON "LAB_determination" USING btree ("name" text_ops,"external_code" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_codigo_externo_key" ON "LAB_doctor" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_config_equipment_id_laboratory_id_key" ON "LAB_equipment_config" USING btree ("equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "_EquipmentToLaboratory_AB_unique" ON "_LAB_EquipmentToLaboratory" USING btree ("A" text_ops,"B" text_ops);--> statement-breakpoint
CREATE INDEX "_LAB_EquipmentToLaboratory_B_index" ON "_LAB_EquipmentToLaboratory" USING btree ("B" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "external_record_nombre_tabla_codigo_externo_laboratory_id_key" ON "LAB_external_record" USING btree ("table_name" text_ops,"external_code" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "health_insurance_codigo_externo_key" ON "LAB_health_insurance" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "health_insurance_nombre_laboratory_id_key" ON "LAB_health_insurance" USING btree ("name" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "manlab_order_result_id_key" ON "LAB_manlab_order" USING btree ("result_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "manlab_setting_key_key" ON "LAB_manlab_setting" USING btree ("key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "mapper_cm260_codigo_externo_key" ON "LAB_mapper_cm260" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "mapper_cm260_sub_determination_id_equipment_id_laboratory_i_key" ON "LAB_mapper_cm260" USING btree ("sub_determination_id" text_ops,"equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE INDEX "mapper_cm260_tecnica_equipment_id_laboratory_id_idx" ON "LAB_mapper_cm260" USING btree ("technique" text_ops,"equipment_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "method_nombre_laboratory_id_key" ON "LAB_method" USING btree ("name" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "notified_user_email_laboratory_id_key" ON "LAB_notified_user" USING btree ("email" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_codigo_externo_key" ON "LAB_patient" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE INDEX "patient_documento_idx" ON "LAB_patient" USING btree ("document" text_ops);--> statement-breakpoint
CREATE INDEX "patient_laboratory_id_apellido_nombre_idx" ON "LAB_patient" USING btree ("laboratory_id" text_ops,"last_name" text_ops,"name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_health_insurance_codigo_externo_key" ON "LAB_patient_health_insurance" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_health_insurance_patient_id_health_insurance_id_key" ON "LAB_patient_health_insurance" USING btree ("patient_id" text_ops,"health_insurance_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_codigo_externo_key" ON "LAB_payment" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "prices_os_config_health_insurance_id_determination_id_labor_key" ON "LAB_prices_os_config" USING btree ("health_insurance_id" text_ops,"determination_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_codigo_externo_key" ON "LAB_protocol" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE INDEX "protocol_created_at_idx" ON "LAB_protocol" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "protocol_laboratory_id_status_idx" ON "LAB_protocol" USING btree ("laboratory_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_numero_secuencial_laboratory_id_key" ON "LAB_protocol" USING btree ("sequential_number" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "reference_value_codigo_externo_sub_determination_id_laborat_key" ON "LAB_reference_value" USING btree ("external_code" text_ops,"sub_determination_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "result_codigo_externo_key" ON "LAB_result" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE INDEX "result_protocol_id_idx" ON "LAB_result" USING btree ("protocol_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "section_nombre_laboratory_id_key" ON "LAB_section" USING btree ("name" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "setting_key_laboratory_id_key" ON "LAB_setting" USING btree ("key" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_determination_codigo_externo_determination_id_laborator_key" ON "LAB_sub_determination" USING btree ("external_code" text_ops,"determination_id" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_result_codigo_externo_key" ON "LAB_sub_result" USING btree ("external_code" text_ops);--> statement-breakpoint
CREATE INDEX "sub_result_result_id_idx" ON "LAB_sub_result" USING btree ("result_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sub_result_result_id_sub_determination_id_key" ON "LAB_sub_result" USING btree ("result_id" text_ops,"sub_determination_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unit_nombre_codigo_externo_laboratory_id_key" ON "LAB_unit" USING btree ("name" text_ops,"external_code" text_ops,"laboratory_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "LAB_user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "worksheet_print_log_section_id_idx" ON "LAB_worksheet_print_log" USING btree ("section_id" text_ops);