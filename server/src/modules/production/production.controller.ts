import { Request, Response } from "express";
import { ProductionService } from "./production.service";
import { catchAsync } from "../../utils/catchAsync";

export class ProductionController {
  static createOrder = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductionService.createOrder(req.body);
    res.status(201).json({ success: true, data: result });
  });

  static getOrderList = catchAsync(async (req: Request, res: Response) => {
    const list = await ProductionService.getOrderList();
    res.status(200).json({ success: true, data: list });
  });

  static completeOrder = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductionService.completeOrder(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "完工汇报成功，库存已同步",
        data: result,
      });
  });
}
