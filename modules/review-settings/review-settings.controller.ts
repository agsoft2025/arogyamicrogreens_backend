import { Request, Response } from "express";
import { reviewSettingsService } from "./review-settings.service";

/**
 * GET /api/v1/review-settings
 * Public — no auth required. Returns current review display settings.
 */
export async function getReviewSettings(req: Request, res: Response) {
  try {
    const settings = await reviewSettingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch review settings" });
  }
}

/**
 * PUT /api/v1/review-settings
 * Admin only. Updates review display settings.
 */
export async function updateReviewSettings(req: Request, res: Response) {
  try {
    const settings = await reviewSettingsService.updateSettings(req.body);
    res.json({ success: true, data: settings, message: "Review settings updated" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update review settings";
    res.status(400).json({ success: false, message: msg });
  }
}
