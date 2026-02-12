import { Schema, model, models, type Document, type Model } from "mongoose";

export type AlertRuleType =
  | "price_upper"
  | "price_lower"
  | "percent_move"
  | "volume_spike"
  | "gap_up"
  | "gap_down";

export interface AlertRuleDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  ruleType: AlertRuleType;
  threshold: number;
  cooldownMinutes: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<AlertRuleDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    ruleType: {
      type: String,
      required: true,
      enum: ["price_upper", "price_lower", "percent_move", "volume_spike", "gap_up", "gap_down"],
      index: true,
    },
    threshold: { type: Number, required: true },
    cooldownMinutes: { type: Number, default: 60, min: 0 },
    quietHoursStart: { type: String, trim: true, default: "" },
    quietHoursEnd: { type: String, trim: true, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AlertRuleSchema.index({ userId: 1, symbol: 1, ruleType: 1, threshold: 1 }, { unique: true });

export const AlertRule: Model<AlertRuleDocument> =
  (models?.AlertRule as Model<AlertRuleDocument>) || model<AlertRuleDocument>("AlertRule", AlertRuleSchema);
