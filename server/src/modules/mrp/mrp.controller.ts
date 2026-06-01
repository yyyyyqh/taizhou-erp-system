import { Request, Response } from "express";
import { MrpService } from "./mrp.service";
import { catchAsync } from "../../utils/catchAsync";

export class MrpController {
  static runMRP = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ success: false, message: "参数不完整" });
    }
    const result = await MrpService.calculateMRP(productId, Number(quantity));
    res.status(200).json({ success: true, data: result });
  });

  static autoCreate = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity, type } = req.body;
    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ success: false, message: "自动转单参数不足" });
    }
    const result = await MrpService.autoCreateDocument(
      productId,
      Number(quantity),
      type,
    );
    res.status(200).json({ success: true, data: result });
  });
}
