CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"contact_name" varchar(50),
	"contact_phone" varchar(20),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "bom_items" DROP CONSTRAINT "bom_items_bom_header_id_bom_headers_id_fk";
--> statement-breakpoint
ALTER TABLE "bom_headers" ALTER COLUMN "version" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "bom_headers" ALTER COLUMN "version" SET DEFAULT 'V1.0';--> statement-breakpoint
ALTER TABLE "bom_items" ALTER COLUMN "quantity" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "bom_items" ALTER COLUMN "quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "production_orders" ALTER COLUMN "order_number" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "production_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sku" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "attributes" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "po_number" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "price" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "supplier_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_header_id_bom_headers_id_fk" FOREIGN KEY ("bom_header_id") REFERENCES "public"."bom_headers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_headers" DROP COLUMN "effective_date";--> statement-breakpoint
ALTER TABLE "purchase_order_items" DROP COLUMN "unit_price";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN "supplier";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN "expected_date";