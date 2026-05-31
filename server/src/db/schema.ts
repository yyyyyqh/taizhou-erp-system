import {
  pgTable,
  uuid,
  varchar,
  decimal,
  jsonb,
  timestamp,
  integer,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  attributes: jsonb("attributes").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    stock: integer("stock").notNull().default(0),
    warehouseLocation: varchar("warehouse_location", { length: 255 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      stockCheck: check("stock_check", sql`${table.stock} >= 0`),
    };
  },
);

export const inventoryLedger = pgTable("inventory_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull(),
  balance: integer("balance").notNull(),
  referenceId: varchar("reference_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
