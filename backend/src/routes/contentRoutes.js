import { Router } from "express";
import homeContent from "../data/homeContent.js";
import SiteContent from "../models/SiteContent.js";

const router = Router();

router.get("/home", async (_req, res) => {
  try {
    const record = await SiteContent.findOne({ page: "home" }).lean();
    return res.json(record?.payload || homeContent);
  } catch (error) {
    return res.json(homeContent);
  }
});

router.put("/home", async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ message: "payload object is required" });
    }

    const updated = await SiteContent.findOneAndUpdate(
      { page: "home" },
      { payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save content" });
  }
});

export default router;
