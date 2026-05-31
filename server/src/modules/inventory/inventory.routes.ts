import { Router } from "express";
import { InventoryController } from "./inventory.controller";

const router = Router();

router.post("/movement", InventoryController.processMovement);
router.get("/:productId/ledger", InventoryController.getLedger);

export default router;
