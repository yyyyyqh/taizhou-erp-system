CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "inventory" DROP CONSTRAINT "stock_check";--> statement-breakpoint
ALTER TABLE "inventory_ledger" ALTER COLUMN "type" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "warehouse_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD COLUMN "warehouse_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD COLUMN "reference_no" varchar(100);--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_product_warehouse" ON "inventory" USING btree ("product_id","warehouse_id");--> statement-breakpoint
ALTER TABLE "inventory" DROP COLUMN "warehouse_location";--> statement-breakpoint
ALTER TABLE "inventory_ledger" DROP COLUMN "reference_id";