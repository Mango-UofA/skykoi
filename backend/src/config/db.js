import mongoose from "mongoose";

export async function connectDb(mongoUri) {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.error("MongoDB connection failed, continuing in demo mode:", error.message);
    return false;
  }
}
