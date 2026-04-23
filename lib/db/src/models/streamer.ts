import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { nextSequence } from "./counter";

const streamerSchema = new Schema(
  {
    id: { type: Number, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    profilePictureUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    bio: { type: String, default: null },
    category: { type: String, default: null },
    isLive: { type: Boolean, required: true, default: false },
    followers: { type: Number, required: true, default: 0 },
    viewers: { type: Number, required: true, default: 0 },
    streamTitle: { type: String, default: null },
    promoted: { type: Boolean, required: true, default: false },
    addedAt: { type: Date, required: true, default: () => new Date() },
    lastSyncedAt: { type: Date, default: null },
  },
  { collection: "streamers" },
);

streamerSchema.pre("save", async function (next) {
  if (this.isNew && (this.id === undefined || this.id === null)) {
    this.id = await nextSequence("streamers");
  }
  next();
});

export type Streamer = InferSchemaType<typeof streamerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StreamerModel =
  (mongoose.models.Streamer as mongoose.Model<Streamer>) ||
  mongoose.model<Streamer>("Streamer", streamerSchema);
