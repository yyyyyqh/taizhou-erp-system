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
  type: varchar("type", { length: 20 }).notNull().default("FERT"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  leadTime: integer("lead_time").notNull().default(0),
  safetyStock: integer("safety_stock").notNull().default(0),
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

export const bomItems = pgTable("bom_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id")
    .references(() => products.id)
    .notNull(),
  childId: uuid("child_id")
    .references(() => products.id)
    .notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: varchar("po_number", { length: 100 }).notNull().unique(), // 采购单号
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // 状态：PENDING(待收货), COMPLETED(已收货)
  supplier: varchar("supplier", { length: 255 }), // 供应商名称
  expectedDate: timestamp("expected_date"), // 预计交货期
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  poId: uuid("po_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

// ------ 生产工单表 ------
export const productionOrders = pgTable("production_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(), // 工单号
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(), // 生产目标物料
  quantity: integer("quantity").notNull(), // 计划生产数量
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // 状态：PENDING(待生产), COMPLETED(已完工)
  startDate: timestamp("start_date"), // 计划开工日期
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
