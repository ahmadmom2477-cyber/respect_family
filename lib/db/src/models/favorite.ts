import mongoose, { Schema, type InferSchemaType } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    addedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "favorites" },
);

favoriteSchema.index({ userId: 1, username: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, addedAt: -1 });

export type Favorite = InferSchemaType<typeof favoriteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const FavoriteModel =
  (mongoose.models.Favorite as mongoose.Model<Favorite>) ||
  mongoose.model<Favorite>("Favorite", favoriteSchema);
