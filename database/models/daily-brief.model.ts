import { Schema, model, models, type Document, type Model } from "mongoose";

export interface DailyBriefDocument extends Document {
  userId: string;
  email: string;
  dateKey: string;
  headline: string;
  briefHtml: string;
  regime: "risk_on" | "neutral" | "risk_off";
  createdAt: Date;
  updatedAt: Date;
}

const DailyBriefSchema = new Schema<DailyBriefDocument>(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    headline: { type: String, required: true, trim: true },
    briefHtml: { type: String, required: true },
    regime: { type: String, enum: ["risk_on", "neutral", "risk_off"], default: "neutral", index: true },
  },
  { timestamps: true }
);

DailyBriefSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailyBrief: Model<DailyBriefDocument> =
  (models?.DailyBrief as Model<DailyBriefDocument>) || model<DailyBriefDocument>("DailyBrief", DailyBriefSchema);
