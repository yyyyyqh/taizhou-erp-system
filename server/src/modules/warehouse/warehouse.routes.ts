import { Router } from "express";
import { WarehouseController } from "./warehouse.controller";

const router = Router();

router.post("/", WarehouseController.create);
router.get("/", WarehouseController.list);

export default router;
