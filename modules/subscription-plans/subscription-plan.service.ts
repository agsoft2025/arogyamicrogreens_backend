import {
  subscriptionPlanRepository,
  PlanFilters,
  PaginationOptions,
  PaginatedPlans,
} from "./subscription-plan.repository";
import { ISubscriptionPlan, ISubscriptionPlanDocument } from "./subscription-plan.model";

export class SubscriptionPlanError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "SubscriptionPlanError";
  }
}

export class SubscriptionPlanService {
  async createPlan(data: ISubscriptionPlan): Promise<ISubscriptionPlanDocument> {
    this.validatePlanData(data);

    // Featured mutex: if this plan is featured, unset others first
    if (data.featured) {
      await subscriptionPlanRepository.clearAllFeatured();
    }

    return subscriptionPlanRepository.create(data);
  }

  async getAllPlans(
    filters: PlanFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedPlans> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    return subscriptionPlanRepository.findAll(filters, { page, limit });
  }

  async getActivePlans(): Promise<ISubscriptionPlanDocument[]> {
    return subscriptionPlanRepository.findAllActive();
  }

  async getPlanById(id: string): Promise<ISubscriptionPlanDocument> {
    const plan = await subscriptionPlanRepository.findById(id);
    if (!plan) {
      throw new SubscriptionPlanError("Subscription plan not found", 404);
    }
    return plan;
  }

  async updatePlan(
    id: string,
    data: Partial<ISubscriptionPlan>
  ): Promise<ISubscriptionPlanDocument> {
    // Ensure plan exists
    await this.getPlanById(id);

    if (data.tier !== undefined || data.name !== undefined || data.price !== undefined) {
      this.validatePartialPlanData(data);
    }

    // Featured mutex: if setting featured=true, unset all others
    if (data.featured === true) {
      await subscriptionPlanRepository.clearFeaturedExcept(id);
    }

    const updated = await subscriptionPlanRepository.update(id, data);
    if (!updated) {
      throw new SubscriptionPlanError("Failed to update subscription plan", 500);
    }
    return updated;
  }

  async deletePlan(id: string): Promise<void> {
    await this.getPlanById(id);
    const deleted = await subscriptionPlanRepository.delete(id);
    if (!deleted) {
      throw new SubscriptionPlanError("Failed to delete subscription plan", 500);
    }
  }

  async updateStatus(
    id: string,
    status: "active" | "inactive"
  ): Promise<ISubscriptionPlanDocument> {
    await this.getPlanById(id);

    if (!["active", "inactive"].includes(status)) {
      throw new SubscriptionPlanError(
        'Invalid status. Must be "active" or "inactive"',
        400
      );
    }

    const updated = await subscriptionPlanRepository.updateStatus(id, status);
    if (!updated) {
      throw new SubscriptionPlanError("Failed to update plan status", 500);
    }
    return updated;
  }

  private validatePlanData(data: ISubscriptionPlan): void {
    if (!data.tier?.trim()) throw new SubscriptionPlanError("Tier is required");
    if (!data.name?.trim()) throw new SubscriptionPlanError("Name is required");
    if (!data.tagline?.trim()) throw new SubscriptionPlanError("Tagline is required");
    if (!data.price?.trim()) throw new SubscriptionPlanError("Price is required");
    if (!data.period?.trim()) throw new SubscriptionPlanError("Period is required");
    if (!["primary", "secondary"].includes(data.buttonStyle)) {
      throw new SubscriptionPlanError('Button style must be "primary" or "secondary"');
    }
    if (data.features?.length) {
      for (const feat of data.features) {
        if (!feat.text?.trim()) {
          throw new SubscriptionPlanError("Each feature must have a text value");
        }
        if (!["star", "gift", "none"].includes(feat.iconType)) {
          throw new SubscriptionPlanError('Feature iconType must be "star", "gift", or "none"');
        }
      }
    }
  }

  private validatePartialPlanData(data: Partial<ISubscriptionPlan>): void {
    if (data.tier !== undefined && !data.tier.trim()) {
      throw new SubscriptionPlanError("Tier cannot be empty");
    }
    if (data.name !== undefined && !data.name.trim()) {
      throw new SubscriptionPlanError("Name cannot be empty");
    }
    if (data.price !== undefined && !data.price.trim()) {
      throw new SubscriptionPlanError("Price cannot be empty");
    }
    if (
      data.buttonStyle !== undefined &&
      !["primary", "secondary"].includes(data.buttonStyle)
    ) {
      throw new SubscriptionPlanError('Button style must be "primary" or "secondary"');
    }
    if (data.features?.length) {
      for (const feat of data.features) {
        if (!feat.text?.trim()) {
          throw new SubscriptionPlanError("Each feature must have a text value");
        }
        if (!["star", "gift", "none"].includes(feat.iconType)) {
          throw new SubscriptionPlanError('Feature iconType must be "star", "gift", or "none"');
        }
      }
    }
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();
