import { Router } from "express";
import { ProductionController } from "./production.controller";

const router = Router();

router.post("/", ProductionController.createOrder);
router.get("/", ProductionController.getOrderList);
router.post("/:id/complete", ProductionController.completeOrder);

export default router;
