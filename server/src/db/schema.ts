import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  decimal,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. 供应商主数据表
// ==========================================
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // 供应商编码 VEN-XXXXXX
  name: varchar("name", { length: 100 }).notNull(), // 供应商全称
  contactName: varchar("contact_name", { length: 50 }), // 联系人
  contactPhone: varchar("contact_phone", { length: 20 }), // 联系电话
  status: varchar("status", { length: 20 }).default("ACTIVE").notNull(), // ACTIVE / INACTIVE
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 2. 物料/商品主数据表
// ==========================================
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // FERT(成品) / HALB(半成品) / ROH(原材料)
  price: decimal("price", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  safetyStock: integer("safety_stock").notNull().default(0),
  leadTime: integer("lead_time").notNull().default(0),
  attributes: jsonb("attributes").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 3. BOM 头表 (状态机生命周期)
// ==========================================
export const bomHeaders = pgTable("bom_headers", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  version: varchar("version", { length: 20 }).notNull().default("V1.0"),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT / ACTIVE
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 4. BOM 行表 (层级配方)
// ==========================================
export const bomItems = pgTable("bom_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  bomHeaderId: uuid("bom_header_id")
    .references(() => bomHeaders.id)
    .notNull(),
  childId: uuid("child_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// ==========================================
// 5. 物理/逻辑仓库定义表
// ==========================================
export const warehouses = pgTable("warehouses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // W-MAIN, W-WIP, W-FG
  name: varchar("name", { length: 100 }).notNull(), // 原材料大仓, 车间线边仓...
  type: varchar("type", { length: 20 }).notNull(), // MAIN / WIP / FG
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 6. 实时库存表 (多仓物理隔离维度)
// ==========================================
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
    unqStock: uniqueIndex("unq_product_warehouse").on(
      t.productId,
      t.warehouseId,
    ), // 复合唯一索引
  }),
);

// ==========================================
// 7. 库存台账流水表
// ==========================================
export const inventoryLedger = pgTable("inventory_ledger", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  warehouseId: uuid("warehouse_id")
    .references(() => warehouses.id)
    .notNull(),
  type: varchar("type", { length: 10 }).notNull(), // IN / OUT / INIT
  quantity: integer("quantity").notNull(),
  balance: integer("balance").notNull(),
  referenceNo: varchar("reference_no", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 8. 采购订单主表 (关联供应商实体)
// ==========================================
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(), // 强绑定主数据 ID
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(), // DRAFT / COMPLETED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 9. 采购订单明细表
// ==========================================
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  poId: uuid("po_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
});

// ==========================================
// 10. 生产工单表
// ==========================================
export const productionOrders = pgTable("production_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  status: varchar("status", { length: 20 }).default("DRAFT").notNull(), // DRAFT / COMPLETED
  startDate: timestamp("start_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
