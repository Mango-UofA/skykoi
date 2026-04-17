import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["system", "user", "assistant"],
      required: true
    },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["complete", "streaming"],
      default: "complete"
    }
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    detail: { type: String, trim: true, default: "" },
    tone: {
      type: String,
      enum: ["emerald", "violet", "cyan", "amber", "rose", "blue"],
      default: "violet"
    }
  },
  { timestamps: true }
);

const connectedAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["connected", "available", "coming-soon"],
      default: "available"
    }
  },
  { _id: false }
);

const runSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "completed"
    },
    provider: { type: String, default: "local", trim: true },
    summary: { type: String, trim: true, default: "" },
    progress: { type: Number, default: 100 },
    steps: {
      type: [
        new mongoose.Schema(
          {
            label: { type: String, required: true, trim: true },
            status: {
              type: String,
              enum: ["pending", "running", "completed", "failed"],
              default: "pending"
            }
          },
          { _id: false }
        )
      ],
      default: []
    },
    logs: {
      type: [
        new mongoose.Schema(
          {
            label: { type: String, required: true, trim: true },
            detail: { type: String, trim: true, default: "" },
            tone: {
              type: String,
              enum: ["neutral", "info", "success", "warning", "error"],
              default: "neutral"
            },
            at: { type: Date, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

const artifactSchema = new mongoose.Schema(
  {
    runId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["plan", "code", "copy", "report", "notes"],
      default: "notes"
    },
    language: { type: String, trim: true, default: "" },
    content: { type: String, required: true },
    preview: { type: String, trim: true, default: "" },
    storage: {
      provider: { type: String, default: "mongo" },
      bucket: { type: String, default: "" },
      key: { type: String, default: "" },
      url: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    koiName: { type: String, default: "Koi", trim: true },
    status: {
      type: String,
      enum: ["online", "sleeping", "down"],
      default: "online"
    },
    plan: { type: String, default: "free", trim: true },
    runtimeVersion: { type: String, default: "v2026.3.119", trim: true },
    instanceType: { type: String, default: "t3.lg", trim: true },
    machineLabel: { type: String, default: "Cloud Server", trim: true },
    machineOs: { type: String, default: "Linux · demo", trim: true },
    machineConnected: { type: Boolean, default: true },
    ramPercent: { type: Number, default: 17 },
    ramUsedGb: { type: Number, default: 1.3 },
    ramTotalGb: { type: Number, default: 7.6 },
    diskPercent: { type: Number, default: 42 },
    diskUsedGb: { type: Number, default: 12 },
    diskTotalGb: { type: Number, default: 29 },
    uptimeHours: { type: Number, default: 103 },
    monthCost: { type: Number, default: 60.74 },
    sessionCost: { type: Number, default: 8.57 },
    wishCount: { type: Number, default: 0 },
    runCount: { type: Number, default: 0 },
    tokenUsage: { type: Number, default: 0 },
    apiRequests: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    settings: {
      theme: { type: String, default: "oled" },
      accent: { type: String, default: "violet" },
      density: { type: String, default: "comfortable" },
      timeFormat: { type: String, default: "12h" },
      notifications: { type: Boolean, default: true },
      reduceMotion: { type: Boolean, default: false },
      experienceMode: { type: String, default: "developer" }
    },
    connectedAccounts: {
      type: [connectedAccountSchema],
      default: [
        { provider: "GitHub", label: "Ready to connect", status: "available" },
        { provider: "AWS", label: "Ready to connect", status: "available" },
        { provider: "Slack", label: "Coming soon", status: "coming-soon" }
      ]
    },
    messages: { type: [messageSchema], default: [] },
    activity: { type: [activitySchema], default: [] },
    runs: { type: [runSchema], default: [] },
    artifacts: { type: [artifactSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);
