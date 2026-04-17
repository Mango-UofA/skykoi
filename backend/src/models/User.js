import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    company: { type: String, trim: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "owner"
    },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
