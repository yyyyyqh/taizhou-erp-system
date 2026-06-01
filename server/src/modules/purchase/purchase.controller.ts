import { Request, Response } from "express";
import { PurchaseService } from "./purchase.service";
import { MrpService } from "../mrp/mrp.service"; // 👈 引入 MRP 服务
import { catchAsync } from "../../utils/catchAsync";

export class PurchaseController {
  // 处理 POST /api/purchase 的统一入口
  static createPO = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity, items } = req.body;

    // 💡 智能路由分流：如果发现没有 items 数组，说明是 MRP 的一键下单（扁平结构）
    if (!items && productId && quantity) {
      const result = await MrpService.autoCreateDocument(
        productId,
        Number(quantity),
        "ROH", // 采购单默认处理原材料
      );
      return res.status(200).json({ success: true, data: result });
    }

    // 如果有 items 数组，说明是前端手动弹窗创建的标准采购单
    const result = await PurchaseService.createPO(req.body);
    res.status(200).json({ success: true, data: result });
  });

  // 获取列表
  static getPOList = catchAsync(async (req: Request, res: Response) => {
    const result = await PurchaseService.getPOList();
    res.status(200).json({ success: true, data: result });
  });

  // 收货入库
  static receivePO = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PurchaseService.receivePO(id);
    res.status(200).json({ success: true, message: "收货成功", data: result });
  });
}
