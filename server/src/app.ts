import express from "express";
import productRoutes from "./modules/products/product.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import bomRoutes from "./modules/bom/bom.routes";
import mrpRoutes from "./modules/mrp/mrp.routes";
import purchaseRoutes from "./modules/purchase/purchase.routes";
import { errorHandler } from "./middlewares/error.middleware";
import productionRoutes from "./modules/production/production.routes";

const app = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/bom", bomRoutes);
app.use("/api/mrp", mrpRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/production", productionRoutes);

app.use(errorHandler);

export default app;
