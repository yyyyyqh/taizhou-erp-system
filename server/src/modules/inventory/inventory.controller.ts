import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { catchAsync } from "../../utils/catchAsync";

export class InventoryController {
  static processMovement = catchAsync(async (req: Request, res: Response) => {
    const { productId, type, quantity, referenceId } = req.body;
    const result = await InventoryService.recordStockMovement(
      productId,
      type,
      quantity,
      referenceId,
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  static getLedger = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const data = await InventoryService.getLedger(productId);
    res.status(200).json({
      success: true,
      data,
    });
  });
}
