import mongoose, { Document, Schema } from "mongoose";

export type IconType = "star" | "gift" | "none";
export type ButtonStyle = "primary" | "secondary";
export type PlanStatus = "active" | "inactive";
export type PlanCategory = "microgreens" | "microgreens-meal";

export interface PlanFeature {
  text: string;
  highlight: boolean;
  iconType: IconType;
}

export interface ISubscriptionPlan {
  tier: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  buttonStyle: ButtonStyle;
  badge: string;
  featured: boolean;
  displayOrder: number;
  status: PlanStatus;
  category: PlanCategory;
  features: PlanFeature[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionPlanDocument extends ISubscriptionPlan, Document {}

const PlanFeatureSchema = new Schema<PlanFeature>(
  {
    text: { type: String, required: true, trim: true },
    highlight: { type: Boolean, default: false },
    iconType: {
      type: String,
      enum: ["star", "gift", "none"] as IconType[],
      default: "none",
    },
  },
  { _id: false }
);

const SubscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    tier: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    period: { type: String, required: true, trim: true },
    buttonStyle: {
      type: String,
      enum: ["primary", "secondary"] as ButtonStyle[],
      default: "primary",
    },
    badge: { type: String, default: "", trim: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"] as PlanStatus[],
      default: "active",
    },
    category: {
      type: String,
      enum: ["microgreens", "microgreens-meal"] as PlanCategory[],
      default: "microgreens",
    },
    features: { type: [PlanFeatureSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "subscriptionplans",
  }
);

SubscriptionPlanSchema.index({ status: 1, displayOrder: 1 });
SubscriptionPlanSchema.index({ featured: 1 });

const SubscriptionPlan = mongoose.model<ISubscriptionPlanDocument>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);

export default SubscriptionPlan;
