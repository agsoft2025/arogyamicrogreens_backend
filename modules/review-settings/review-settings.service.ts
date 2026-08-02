import ReviewSettings, { IReviewSettings, IReviewSettingsDocument } from "./review-settings.model";

export class ReviewSettingsService {
  /**
   * Returns the singleton settings document.
   * Creates it with defaults if it doesn't exist yet.
   */
  async getSettings(): Promise<IReviewSettingsDocument> {
    let settings = await ReviewSettings.findOne();
    if (!settings) {
      settings = await ReviewSettings.create({});
    }
    return settings;
  }

  /**
   * Updates the singleton document with partial data.
   */
  async updateSettings(data: Partial<IReviewSettings>): Promise<IReviewSettingsDocument> {
    const ALLOWED: (keyof IReviewSettings)[] = [
      "reviewsEnabled",
      "showRatingOnCards",
      "showRatingOnDetailPage",
      "showReviewCount",
      "minimumRatingToShow",
    ];

    // Whitelist fields
    const update: Partial<IReviewSettings> = {};
    for (const key of ALLOWED) {
      if (key in data) {
        (update as Record<string, unknown>)[key] = data[key];
      }
    }

    // Validate minimumRatingToShow
    if (
      update.minimumRatingToShow !== undefined &&
      (update.minimumRatingToShow < 0 || update.minimumRatingToShow > 5)
    ) {
      throw new Error("minimumRatingToShow must be between 0 and 5");
    }

    const settings = await ReviewSettings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    return settings!;
  }
}

export const reviewSettingsService = new ReviewSettingsService();
