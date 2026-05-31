import { Router } from "express";
import { ProductController } from "./product.controller";

const router = Router();

router.post("/", ProductController.createProduct);
router.get("/", ProductController.getProducts);
router.post("/bulk", ProductController.bulkImport);
router.put("/:id", ProductController.updateProduct);

export default router;
