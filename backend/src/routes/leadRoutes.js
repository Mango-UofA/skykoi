import { Router } from "express";
import Lead from "../models/Lead.js";

const router = Router();
const demoLeads = [];

router.post("/leads", async (req, res) => {
  try {
    const { name, email, company, message, source } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "name and email are required" });
    }

    try {
      const lead = await Lead.create({ name, email, company, message, source });
      return res.status(201).json({ message: "Lead captured", id: lead._id, mode: "mongodb" });
    } catch {
      const tempLead = {
        id: `demo-${Date.now()}`,
        name,
        email,
        company,
        message,
        source,
        createdAt: new Date().toISOString()
      };
      demoLeads.push(tempLead);
      return res.status(201).json({ message: "Lead captured (demo mode)", id: tempLead.id, mode: "memory" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to capture lead" });
  }
});

export default router;
