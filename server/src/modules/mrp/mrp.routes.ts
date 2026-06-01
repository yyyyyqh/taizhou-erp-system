import { Router } from "express";
import { MrpController } from "./mrp.controller";

const router = Router();
router.post("/run", MrpController.runMRP);

export default router;
