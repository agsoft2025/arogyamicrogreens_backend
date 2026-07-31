import mongoose, { Document, Schema } from "mongoose";

export interface IReviewSettings {
  /** Master switch — if false, no rating widgets are rendered anywhere */
  reviewsEnabled: boolean;
  /** Show star rating widget on product listing cards */
  showRatingOnCards: boolean;
  /** Show star rating on the product detail page */
  showRatingOnDetailPage: boolean;
  /** Show review count "(124)" alongside the star rating */
  showReviewCount: boolean;
  /** Products with rating below this value will not show the widget (0 = show all) */
  minimumRatingToShow: number;
  updatedAt?: Date;
}

export interface IReviewSettingsDocument extends IReviewSettings, Document {}

const ReviewSettingsSchema = new Schema<IReviewSettingsDocument>(
  {
    reviewsEnabled:        { type: Boolean, default: true },
    showRatingOnCards:     { type: Boolean, default: true },
    showRatingOnDetailPage:{ type: Boolean, default: true },
    showReviewCount:       { type: Boolean, default: true },
    minimumRatingToShow:   { type: Number, min: 0, max: 5, default: 0 },
  },
  {
    timestamps: true,
    collection: "reviewsettings",
  }
);

const ReviewSettings = mongoose.model<IReviewSettingsDocument>(
  "ReviewSettings",
  ReviewSettingsSchema
);

export default ReviewSettings;
