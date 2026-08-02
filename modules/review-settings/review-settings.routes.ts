import { Router } from "express";
import { getReviewSettings, updateReviewSettings } from "./review-settings.controller";
import { requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

/** Public: any client can read current settings */
router.get("/", getReviewSettings);

/** Admin only: update settings */
router.put("/", requireAdmin, updateReviewSettings);

export default router;
