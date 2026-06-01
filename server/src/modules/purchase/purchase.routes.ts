import { Router } from "express";
import { PurchaseController } from "./purchase.controller";

const router = Router();

router.post("/", PurchaseController.createPO);
router.get("/", PurchaseController.getPOList);
router.post("/:id/receive", PurchaseController.receivePO);

export default router;
