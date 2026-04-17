import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    company: { type: String, trim: true },
    message: { type: String, trim: true },
    source: {
      type: String,
      enum: ["cta", "pricing", "contact"],
      default: "cta"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
