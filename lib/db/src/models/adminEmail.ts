import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { nextSequence } from "./counter";

const adminEmailSchema = new Schema(
  {
    id: { type: Number, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    addedAt: { type: Date, required: true, default: () => new Date() },
    addedBy: { type: String, default: null },
  },
  { collection: "admin_emails" },
);

adminEmailSchema.pre("save", async function (next) {
  if (this.isNew && (this.id === undefined || this.id === null)) {
    this.id = await nextSequence("admin_emails");
  }
  next();
});

export type AdminEmail = InferSchemaType<typeof adminEmailSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AdminEmailModel =
  (mongoose.models.AdminEmail as mongoose.Model<AdminEmail>) ||
  mongoose.model<AdminEmail>("AdminEmail", adminEmailSchema);
