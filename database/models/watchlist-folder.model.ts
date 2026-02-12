import { Schema, model, models, type Document, type Model } from "mongoose";

export interface WatchlistFolderDocument extends Document {
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: Date;
}

const WatchlistFolderSchema = new Schema<WatchlistFolderDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

WatchlistFolderSchema.index({ userId: 1, name: 1 }, { unique: true });

export const WatchlistFolder: Model<WatchlistFolderDocument> =
  (models?.WatchlistFolder as Model<WatchlistFolderDocument>) ||
  model<WatchlistFolderDocument>("WatchlistFolder", WatchlistFolderSchema);
