import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { catchAsync } from "../../utils/catchAsync";

export class ProductController {
  static createProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.createProductWithInventory(req.body);
    res.status(201).json({
      success: true,
      message: "商品及库存初始化成功",
      data: result,
    });
  });

  static getProducts = catchAsync(async (req: Request, res: Response) => {
    const list = await ProductService.getProductList();
    res.status(200).json({
      success: true,
      data: list,
    });
  });

  static bulkImport = catchAsync(async (req: Request, res: Response) => {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "数据不能为空" });
    }
    const result = await ProductService.bulkImport(items);
    res.status(201).json({
      success: true,
      message: `成功导入 ${result.length} 条数据`,
      data: result,
    });
  });

  static updateProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductService.updateProduct(id, req.body);
    res.status(200).json({ success: true, message: "更新成功", data: result });
  });
}
