import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true },
    payload: { type: Object, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("SiteContent", siteContentSchema);
