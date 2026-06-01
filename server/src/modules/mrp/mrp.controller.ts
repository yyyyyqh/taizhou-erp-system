import { Request, Response } from "express";
import { MrpService } from "./mrp.service";
import { catchAsync } from "../../utils/catchAsync";

export class MrpController {
  static calculateMrp = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity, dueDate } = req.body;

    if (!productId || !quantity || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "请提供目标物料ID、目标数量(quantity)和期望交付日期(dueDate)",
      });
    }

    const mrpResult = await MrpService.calculateMrp({
      productId,
      quantity: Number(quantity),
      dueDate: new Date(dueDate),
    });

    res.status(200).json({
      success: true,
      message: "MRP 运算成功",
      data: mrpResult,
    });
  });
}
