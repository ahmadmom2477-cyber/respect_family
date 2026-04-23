import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { nextSequence } from "./counter";

const channelRequestSchema = new Schema(
  {
    id: { type: Number, unique: true, index: true },
    username: { type: String, required: true },
    submitterName: { type: String, default: null },
    submitterEmail: { type: String, default: null },
    submitterUserId: { type: String, default: null },
    note: { type: String, default: null },
    status: { type: String, required: true, default: "pending" },
    createdAt: { type: Date, required: true, default: () => new Date() },
    decidedAt: { type: Date, default: null },
  },
  { collection: "channel_requests" },
);

channelRequestSchema.pre("save", async function (next) {
  if (this.isNew && (this.id === undefined || this.id === null)) {
    this.id = await nextSequence("channel_requests");
  }
  next();
});

export type ChannelRequest = InferSchemaType<typeof channelRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChannelRequestModel =
  (mongoose.models.ChannelRequest as mongoose.Model<ChannelRequest>) ||
  mongoose.model<ChannelRequest>("ChannelRequest", channelRequestSchema);
