CREATE TABLE "bom_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"quantity" numeric(10, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type" varchar(20) DEFAULT 'FERT' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "lead_time" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "safety_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_child_id_products_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;