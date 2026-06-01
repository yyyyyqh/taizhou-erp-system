import { Request, Response } from "express";
import { WarehouseService } from "./warehouse.service";
import { catchAsync } from "../../utils/catchAsync";

export class WarehouseController {
  static create = catchAsync(async (req: Request, res: Response) => {
    const data = await WarehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, data });
  });

  static list = catchAsync(async (req: Request, res: Response) => {
    const data = await WarehouseService.getWarehouseList();
    res.status(200).json({ success: true, data });
  });
}
