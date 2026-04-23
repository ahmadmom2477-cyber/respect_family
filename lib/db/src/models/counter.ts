import mongoose, { Schema } from "mongoose";

interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CounterModel =
  (mongoose.models.Counter as mongoose.Model<CounterDoc>) ||
  mongoose.model<CounterDoc>("Counter", counterSchema);

export async function nextSequence(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return doc!.seq;
}
