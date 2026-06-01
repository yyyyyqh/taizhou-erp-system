import {
  pgTable,
  uuid,
  varchar,
  decimal,
  jsonb,
  timestamp,
  integer,
  check,
  uniqueIndex,
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

// 库存表
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id)
      .notNull(),
    warehouseId: uuid("warehouse_id")
      .references(() => warehouses.id)
      .notNull(),
    stock: integer("stock").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // 确保同一个物料在同一个仓库里只有唯一的一条记录
    unqStock: uniqueIndex("unq_product_warehouse").on(
      t.productId,
      t.warehouseId,
    ),
  }),
);

// 库存台账流水表
export const inventoryLedger = pgTable("inventory_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  warehouseId: uuid("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'IN' 或 'OUT'
  quantity: integer("quantity").notNull(),
  balance: integer("balance").notNull(),
  referenceNo: varchar("reference_no", { length: 100 }), // 关联单号 (PO/PrdO/调拨单)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bomHeaders = pgTable("bom_headers", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(), // 生产目标(FERT/HALB)
  version: varchar("version", { length: 50 }).notNull().default("V1.0"), // 版本号，如 V1.0, V2.1
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // 状态：DRAFT(草稿/等待录入), ACTIVE(已生效), ARCHIVED(已废弃)
  effectiveDate: timestamp("effective_date").defaultNow().notNull(), // 生效时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bomItems = pgTable("bom_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  bomHeaderId: uuid("bom_header_id")
    .references(() => bomHeaders.id, { onDelete: "cascade" })
    .notNull(),
  childId: uuid("child_id")
    .references(() => products.id)
    .notNull(), // 子件(ROH/HALB)
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(), // 消耗数量
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

// ------ 仓库表 ------
export const warehouses = pgTable("warehouses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // 如: W-MAIN, W-WIP
  name: varchar("name", { length: 100 }).notNull(), // 如: 原材料大仓, 组装线边仓
  type: varchar("type", { length: 20 }).notNull(), // 类型: MAIN, WIP, FG(成品)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
