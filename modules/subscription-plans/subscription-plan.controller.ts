import { Request, Response, NextFunction } from "express";
import { subscriptionPlanService, SubscriptionPlanError } from "./subscription-plan.service";

export class SubscriptionPlanController {
  /** GET /subscription-plans — public, returns active plans only (no auth) */
  async getActivePlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await subscriptionPlanService.getActivePlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      next(error);
    }
  }

  /** GET /subscription-plans/admin — admin, returns all plans with filters + pagination */
  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, featured, search, page, limit } = req.query as Record<string, string>;

      const filters = {
        ...(status && { status: status as "active" | "inactive" }),
        ...(featured !== undefined && { featured: featured === "true" }),
        ...(search && { search }),
      };

      const pagination = {
        page: parseInt(page ?? "1", 10),
        limit: parseInt(limit ?? "20", 10),
      };

      const result = await subscriptionPlanService.getAllPlans(filters, pagination);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** GET /subscription-plans/:id */
  async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionPlanService.getPlanById(req.params.id as string);
      res.json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  /** POST /subscription-plans — requireAdmin */
  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionPlanService.createPlan(req.body);
      res.status(201).json({ success: true, message: "Subscription plan created", data: plan });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /subscription-plans/:id — requireAdmin */
  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await subscriptionPlanService.updatePlan(req.params.id as string, req.body);
      res.json({ success: true, message: "Subscription plan updated", data: plan });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /subscription-plans/:id — requireAdmin */
  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subscriptionPlanService.deletePlan(req.params.id as string);
      res.json({ success: true, message: "Subscription plan deleted" });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /subscription-plans/:id/status — requireAdmin */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const plan = await subscriptionPlanService.updateStatus(req.params.id as string, status);
      res.json({ success: true, message: "Plan status updated", data: plan });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionPlanController = new SubscriptionPlanController();
