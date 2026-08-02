import { Router } from "express";
import { subscriptionPlanController } from "./subscription-plan.controller";
import { requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Public — active plans only (used by frontend PricingCards)
router.get("/", subscriptionPlanController.getActivePlans.bind(subscriptionPlanController));

// Admin — all plans with filters + pagination
router.get(
  "/admin",
  requireAdmin,
  subscriptionPlanController.getAllPlans.bind(subscriptionPlanController)
);

// Public — single plan by ID
router.get("/:id", subscriptionPlanController.getPlanById.bind(subscriptionPlanController));

// Admin mutations
router.post(
  "/",
  requireAdmin,
  subscriptionPlanController.createPlan.bind(subscriptionPlanController)
);

router.put(
  "/:id",
  requireAdmin,
  subscriptionPlanController.updatePlan.bind(subscriptionPlanController)
);

router.delete(
  "/:id",
  requireAdmin,
  subscriptionPlanController.deletePlan.bind(subscriptionPlanController)
);

router.patch(
  "/:id/status",
  requireAdmin,
  subscriptionPlanController.updateStatus.bind(subscriptionPlanController)
);

export default router;
