import { Request, Response } from "express";
import { InventoryService } from "./inventory.service";
import { catchAsync } from "../../utils/catchAsync";

export class InventoryController {
  static processMovement = catchAsync(async (req: Request, res: Response) => {
    const { productId, type, quantity, referenceId } = req.body;

    const mainWh = await InventoryService.getWarehouseByCode("W-MAIN");

    const result = await InventoryService.recordStockMovement(
      productId,
      mainWh.id,
      type,
      Number(quantity),
      referenceId || "MANUAL-ADJ",
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

  // 库存调拨
  static transferStock = catchAsync(async (req: Request, res: Response) => {
    const { productId, fromWhCode, toWhCode, quantity } = req.body;
    await InventoryService.transferStock(
      productId,
      fromWhCode,
      toWhCode,
      Number(quantity),
    );
    res.status(200).json({ success: true, message: "库存调拨成功" });
  });
}
