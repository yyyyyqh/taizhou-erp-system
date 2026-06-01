import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { catchAsync } from "../../utils/catchAsync";

export class DashboardController {
  static getOverview = catchAsync(async (req: Request, res: Response) => {
    const data = await DashboardService.getOverview();
    res.status(200).json({ success: true, data });
  });
}
