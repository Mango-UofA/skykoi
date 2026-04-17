import dotenv from "dotenv";
import mongoose from "mongoose";
import SiteContent from "./models/SiteContent.js";
import homeContent from "./data/homeContent.js";

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skykoi_clone";

async function seed() {
  await mongoose.connect(uri);
  await SiteContent.findOneAndUpdate(
    { page: "home" },
    { payload: homeContent },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Seed completed");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
