import mongoose from "mongoose";
import SubscriptionPlan, {
  ISubscriptionPlan,
  ISubscriptionPlanDocument,
} from "./subscription-plan.model";

export interface PlanFilters {
  status?: "active" | "inactive";
  featured?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedPlans {
  plans: ISubscriptionPlanDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SubscriptionPlanRepository {
  async create(data: ISubscriptionPlan): Promise<ISubscriptionPlanDocument> {
    const plan = new SubscriptionPlan(data);
    return plan.save();
  }

  async findAll(
    filters: PlanFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedPlans> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.featured !== undefined) query.featured = filters.featured;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { tier: { $regex: filters.search, $options: "i" } },
        { tagline: { $regex: filters.search, $options: "i" } },
      ];
    }

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(query)
        .sort({ displayOrder: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean<ISubscriptionPlanDocument[]>(),
      SubscriptionPlan.countDocuments(query),
    ]);

    return {
      plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllActive(): Promise<ISubscriptionPlanDocument[]> {
    return SubscriptionPlan.find({ status: "active" })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean<ISubscriptionPlanDocument[]>();
  }

  async findById(id: string): Promise<ISubscriptionPlanDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return SubscriptionPlan.findById(id).lean<ISubscriptionPlanDocument>();
  }

  async update(
    id: string,
    data: Partial<ISubscriptionPlan>
  ): Promise<ISubscriptionPlanDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return SubscriptionPlan.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean<ISubscriptionPlanDocument>();
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await SubscriptionPlan.findByIdAndDelete(id);
    return result !== null;
  }

  async updateStatus(
    id: string,
    status: "active" | "inactive"
  ): Promise<ISubscriptionPlanDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean<ISubscriptionPlanDocument>();
  }

  /** Unset featured on ALL plans except the given id */
  async clearFeaturedExcept(exceptId: string): Promise<void> {
    await SubscriptionPlan.updateMany(
      { _id: { $ne: new mongoose.Types.ObjectId(exceptId) }, featured: true },
      { $set: { featured: false } }
    );
  }

  /** Unset featured on ALL plans */
  async clearAllFeatured(): Promise<void> {
    await SubscriptionPlan.updateMany(
      { featured: true },
      { $set: { featured: false } }
    );
  }
}

export const subscriptionPlanRepository = new SubscriptionPlanRepository();
