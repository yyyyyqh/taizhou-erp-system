import { Router } from "express";
import { ProductController } from "./product.controller";

const router = Router();

router.post("/", ProductController.createProduct);
router.get("/", ProductController.getProducts);
router.post("/bulk", ProductController.bulkImport);

export default router;
