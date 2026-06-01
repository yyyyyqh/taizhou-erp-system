import { Router } from "express";
import { BomController } from "./bom.controller";

const router = Router();

router.post("/", BomController.addBomItem);
router.get("/:parentId/tree", BomController.getBomTree);
router.get("/:parentId/single", BomController.getSingleLevelBom);
router.delete("/:id", BomController.removeBomItem);
router.post("/:parentId/publish", BomController.publishBom);

export default router;
