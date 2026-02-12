import { Schema, model, models, type Document, type Model } from "mongoose";

export interface EarningsReminderDocument extends Document {
  userId: string;
  symbol: string;
  company: string;
  reminderDate: Date;
  note?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EarningsReminderSchema = new Schema<EarningsReminderDocument>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    reminderDate: { type: Date, required: true, index: true },
    note: { type: String, trim: true, default: "" },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EarningsReminderSchema.index({ userId: 1, symbol: 1, reminderDate: 1 }, { unique: true });

export const EarningsReminder: Model<EarningsReminderDocument> =
  (models?.EarningsReminder as Model<EarningsReminderDocument>) ||
  model<EarningsReminderDocument>("EarningsReminder", EarningsReminderSchema);
