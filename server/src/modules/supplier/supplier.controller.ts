import { Request, Response } from "express";
import { SupplierService } from "./supplier.service";
import { catchAsync } from "../../utils/catchAsync";

export class SupplierController {
  static create = catchAsync(async (req: Request, res: Response) => {
    const data = await SupplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data });
  });

  static list = catchAsync(async (req: Request, res: Response) => {
    const data = await SupplierService.getSupplierList();
    res.status(200).json({ success: true, data });
  });
}
