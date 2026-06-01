import { Router } from "express";
import { MrpController } from "./mrp.controller";

const router = Router();

router.post("/calculate", MrpController.calculateMrp);

export default router;
