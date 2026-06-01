CREATE TABLE "bom_headers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version" varchar(50) DEFAULT 'V1.0' NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bom_items" DROP CONSTRAINT "bom_items_parent_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "bom_items" ADD COLUMN "bom_header_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "bom_headers" ADD CONSTRAINT "bom_headers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_header_id_bom_headers_id_fk" FOREIGN KEY ("bom_header_id") REFERENCES "public"."bom_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "bom_items" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "bom_items" DROP COLUMN "updated_at";