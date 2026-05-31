import { Request, Response } from "express";
import { BomService } from "./bom.service";
import { catchAsync } from "../../utils/catchAsync";

export class BomController {
  static addBomItem = catchAsync(async (req: Request, res: Response) => {
    const { parentId, childId, quantity } = req.body;

    if (parentId === childId) {
      return res.status(400).json({
        success: false,
        message: "不能将物料自身设为子件",
      });
    }

    const result = await BomService.addBomItem(parentId, childId, quantity);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  static getBomTree = catchAsync(async (req: Request, res: Response) => {
    const { parentId } = req.params;
    const tree = await BomService.getBomTree(parentId);

    res.status(200).json({
      success: true,
      data: tree,
    });
  });
}
