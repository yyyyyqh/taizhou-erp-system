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
          price: data.price.toString(),
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
        price: products.price,
        stock: inventory.stock,
        warehouseLocation: inventory.warehouseLocation,
        attributes: products.attributes,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .orderBy(desc(products.createdAt));
  }
}
