import { Router } from "express";
import { BomController } from "./bom.controller";

const router = Router();

router.post("/", BomController.addBomItem);
router.get("/:parentId/tree", BomController.getBomTree);

export default router;
