import { db } from "../../db/index";
import { products, inventory, inventoryLedger } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export class ProductService {
  static async createProductWithInventory(data: any) {
    return await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(products)
        .values({
          sku: data.sku,
          name: data.name,
          type: data.type || "FERT",
          price: data.price.toString(),
          leadTime: data.leadTime || 0,
          safetyStock: data.safetyStock || 0,
          attributes: data.attributes || {},
        })
        .returning();

      const initialStock = data.initialStock || 0;

      const [newInventory] = await tx
        .insert(inventory)
        .values({
          productId: newProduct.id,
          stock: initialStock,
          warehouseLocation: data.warehouseLocation || "默认主仓库",
        })
        .returning();

      if (initialStock > 0) {
        await tx.insert(inventoryLedger).values({
          productId: newProduct.id,
          type: "INIT",
          quantity: initialStock,
          balance: initialStock,
          referenceId: `INIT-${newProduct.sku}`,
        });
      }

      return { product: newProduct, inventory: newInventory };
    });
  }

  static async getProductList() {
    return await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        type: products.type,
        price: products.price,
        leadTime: products.leadTime,
        safetyStock: products.safetyStock,
        stock: inventory.stock,
        warehouseLocation: inventory.warehouseLocation,
        attributes: products.attributes,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .orderBy(desc(products.createdAt));
  }

  static async bulkImport(items: any[]) {
    return await db.transaction(async (tx) => {
      const insertedProducts = await tx
        .insert(products)
        .values(
          items.map((item) => ({
            sku: item.sku,
            name: item.name,
            type: item.type || "FERT",
            price: item.price?.toString() || "0",
            leadTime: item.leadTime || 0,
            safetyStock: item.safetyStock || 0,
          })),
        )
        .returning();

      const inventoryValues = insertedProducts.map((p) => ({
        productId: p.id,
        stock: 0,
        warehouseLocation: "待分配",
      }));

      if (inventoryValues.length > 0) {
        await tx.insert(inventory).values(inventoryValues);
      }

      return insertedProducts;
    });
  }
}
