import express from "express";
import productRoutes from "./modules/products/product.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);

app.use(errorHandler);

export default app;
