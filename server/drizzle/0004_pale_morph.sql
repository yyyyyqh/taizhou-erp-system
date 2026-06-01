CREATE TABLE "production_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"start_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;