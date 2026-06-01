import { Request, Response } from "express";
import { PurchaseService } from "./purchase.service";
import { catchAsync } from "../../utils/catchAsync";

export class PurchaseController {
  static createPO = catchAsync(async (req: Request, res: Response) => {
    const result = await PurchaseService.createPO(req.body);
    res.status(201).json({ success: true, data: result });
  });

  static getPOList = catchAsync(async (req: Request, res: Response) => {
    const list = await PurchaseService.getPOList();
    res.status(200).json({ success: true, data: list });
  });

  static receivePO = catchAsync(async (req: Request, res: Response) => {
    const result = await PurchaseService.receivePO(req.params.id);
    res
      .status(200)
      .json({
        success: true,
        message: "收货入库成功，已记入台账",
        data: result,
      });
  });
}
