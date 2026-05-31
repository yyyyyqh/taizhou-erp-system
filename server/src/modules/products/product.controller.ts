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
}
