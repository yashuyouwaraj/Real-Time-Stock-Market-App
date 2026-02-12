import { Schema, model, models, type Document, type Model } from "mongoose";

export interface PortfolioPositionDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  quantity: number;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioPositionSchema = new Schema<PortfolioPositionDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    averageCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

PortfolioPositionSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const PortfolioPosition: Model<PortfolioPositionDocument> =
  (models?.PortfolioPosition as Model<PortfolioPositionDocument>) ||
  model<PortfolioPositionDocument>("PortfolioPosition", PortfolioPositionSchema);
