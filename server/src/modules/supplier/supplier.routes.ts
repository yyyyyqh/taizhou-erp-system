import { Router } from "express";
import { SupplierController } from "./supplier.controller";

const router = Router();

router.post("/", SupplierController.create);
router.get("/", SupplierController.list);

export default router;
