import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provision the MongoDB Atlas cluster?",
  );
}

const MONGODB_URI = process.env.MONGODB_URI;

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

export { mongoose };
export * from "./models";
export { nextSequence } from "./models/counter";
