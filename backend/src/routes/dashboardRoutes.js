import { Router } from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import { getAwsConfig } from "../config/aws.js";
import { getAwsStatus } from "../services/awsService.js";
import { uploadArtifactToS3 } from "../services/s3Service.js";
import { generateWishResponse } from "../services/wishService.js";
import { verifyAuthToken } from "../utils/auth.js";

const router = Router();
const activeWorkspaceRuns = new Set();

function isDbAvailable() {
  return mongoose.connection.readyState === 1;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

async function requireAuth(req, res, next) {
  try {
    if (!isDbAvailable()) {
      return res.status(503).json({ message: "Database unavailable. Configure MongoDB and try again." });
    }

    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyAuthToken(token, process.env.AUTH_TOKEN_SECRET || "dev-secret-change-me");
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

function buildInitialMessages(name) {
  return [
    {
      role: "assistant",
      content: `SkyKoi is online for ${name}. Ask for research, code, copy, analysis, product planning, or a step-by-step execution plan.`,
      createdAt: new Date(Date.now() - 1000 * 60 * 8)
    }
  ];
}

function buildInitialActivity(name) {
  return [
    {
      kind: "deploy",
      title: 'Koi "Koi" created',
      detail: `Workspace initialized for ${name}`,
      tone: "violet",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
    },
    {
      kind: "runtime",
      title: "Demo runtime connected",
      detail: "Shared zero-cost demo runtime is ready",
      tone: "emerald",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    }
  ];
}

async function ensureWorkspace(user) {
  let workspace = await Workspace.findOne({ user: user._id });

  if (!workspace) {
    workspace = await Workspace.create({
      user: user._id,
      messages: buildInitialMessages(user.name),
      activity: buildInitialActivity(user.name)
    });
  }

  return workspace;
}

function timeAgo(date) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const units = [
    ["d", 86400],
    ["h", 3600],
    ["m", 60]
  ];

  for (const [label, size] of units) {
    if (seconds >= size) {
      return `${Math.floor(seconds / size)}${label} ago`;
    }
  }

  return `${seconds}s ago`;
}

function formatHoursLabel(hours) {
  const safeHours = Math.max(0, Math.floor(hours));
  const days = Math.floor(safeHours / 24);
  const remainder = safeHours % 24;
  return days > 0 ? `${days}d ${remainder}h` : `${remainder}h`;
}

function summarizePrompt(prompt) {
  const normalized = prompt.trim().replace(/\s+/g, " ");
  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function serializeMessages(workspace) {
  return [...workspace.messages]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((message) => ({
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      status: message.status,
      createdAt: message.createdAt
    }));
}

function serializeRuns(workspace) {
  return [...workspace.runs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((run) => ({
      id: run._id.toString(),
      title: run.title,
      prompt: run.prompt,
      status: run.status,
      provider: run.provider,
      summary: run.summary,
      progress: run.progress,
      steps: run.steps || [],
      logs: (run.logs || []).slice(-10),
      createdAt: run.createdAt
    }));
}

function serializeArtifacts(workspace) {
  return [...workspace.artifacts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((artifact) => ({
      id: artifact._id.toString(),
      runId: artifact.runId ? artifact.runId.toString() : null,
      title: artifact.title,
      type: artifact.type,
      language: artifact.language,
      preview: artifact.preview,
      content: artifact.content,
      storage: artifact.storage,
      createdAt: artifact.createdAt
    }));
}

function getWorkspaceModeLabel(workspace, awsStatus) {
  const activeRun = [...workspace.runs].find((run) => run.status === "queued" || run.status === "running");
  const config = getAwsConfig();

  if (activeRun?.status === "queued") {
    return "Queued";
  }

  if (activeRun?.status === "running") {
    return "Running";
  }

  return awsStatus.connected || config.bedrockApiKey ? "Bedrock" : "Fallback";
}

function serializeChatState(workspace, awsStatus) {
  const activeRun = [...workspace.runs].find((run) => run.status === "queued" || run.status === "running");

  return {
    workspace: {
      koiName: workspace.koiName,
      status: workspace.status,
      queuedLabel: activeRun ? activeRun.status.toUpperCase() : "READY",
      modeLabel: getWorkspaceModeLabel(workspace, awsStatus)
    },
    messages: serializeMessages(workspace),
    runs: serializeRuns(workspace),
    artifacts: serializeArtifacts(workspace)
  };
}

function serializeActivity(workspace) {
  return [...workspace.activity]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((item) => ({
      id: item._id.toString(),
      kind: item.kind,
      title: item.title,
      detail: item.detail,
      tone: item.tone,
      createdAt: item.createdAt,
      ageLabel: timeAgo(item.createdAt)
    }));
}

function serializeOverview(user, workspace, awsStatus) {
  const messageCount = workspace.messages.filter((message) => message.role !== "system").length;
  const lastUserMessage = [...workspace.messages].reverse().find((message) => message.role === "user");

  return {
    fleet: {
      koiCount: 1,
      live: workspace.status === "online" ? 1 : 0,
      sleeping: workspace.status === "sleeping" ? 1 : 0,
      down: workspace.status === "down" ? 1 : 0,
      monthCost: workspace.monthCost,
      uptimeHours: workspace.uptimeHours
    },
    koi: {
      name: workspace.koiName,
      plan: workspace.plan,
      status: workspace.status,
      userHandle: user.email,
      email: user.email,
      uptimeLabel: formatHoursLabel(workspace.uptimeHours),
      runtimeVersion: workspace.runtimeVersion,
      instanceType: workspace.instanceType,
      resources: {
        ramPercent: workspace.ramPercent,
        ramUsedGb: workspace.ramUsedGb,
        ramTotalGb: workspace.ramTotalGb,
        diskPercent: workspace.diskPercent,
        diskUsedGb: workspace.diskUsedGb,
        diskTotalGb: workspace.diskTotalGb
      },
      sessionCost: workspace.sessionCost,
      lastMessageLabel: lastUserMessage ? summarizePrompt(lastUserMessage.content) : "No msgs",
      requestCount: workspace.runCount,
      tokenUsage: workspace.tokenUsage
    },
    quickLinks: [
      { label: "Wishing Engine", href: "/dashboard/chat" },
      { label: "Connect Computer", href: "/dashboard/connect" },
      { label: "Settings", href: "/dashboard/settings" }
    ],
    cloud: {
      connected: awsStatus.connected,
      provider: "AWS",
      region: awsStatus.region,
      accountId: awsStatus.accountId || ""
    },
    recentActivity: serializeActivity(workspace),
    totalMessages: messageCount
  };
}

function serializeSettings(user, workspace, awsStatus) {
  const config = getAwsConfig();
  const connectedAccounts = workspace.connectedAccounts.map((account) => {
    if (account.provider === "AWS") {
      return {
        provider: "AWS",
        label: awsStatus.connected
          ? `Connected - ${awsStatus.region}${awsStatus.accountId ? ` - ${awsStatus.accountId}` : ""}`
          : config.bedrockApiKey
            ? `Bedrock API key configured - ${config.region}`
          : "Ready to connect",
        status: awsStatus.connected || config.bedrockApiKey ? "connected" : "available"
      };
    }

    return account;
  });

  return {
    profile: {
      name: user.name,
      email: user.email
    },
    settings: workspace.settings,
    connectedAccounts,
    aws: awsStatus
  };
}

function serializeConnect(workspace, awsStatus) {
  return {
    machine: {
      label: awsStatus.connected ? "AWS Cloud Runtime" : workspace.machineLabel,
      os: awsStatus.connected ? `AWS - ${awsStatus.region}` : workspace.machineOs,
      connected: awsStatus.connected || workspace.machineConnected
    },
    aws: awsStatus,
    tabs: ["Terminal", "Download"],
    platforms: ["Windows", "macOS", "Linux"],
    faq: [
      {
        question: "Why do I need to approve the connection?",
        answer: "The demo follows SkyKoi's trust model: your Koi should only get access after an explicit connection step."
      },
      {
        question: "What happens if I close the terminal?",
        answer: "For this zero-cost demo, the shared runtime stays available and you can reconnect from the same screen at any time."
      },
      {
        question: "Can I connect multiple computers?",
        answer: "The UI supports it conceptually, but this demo keeps a single connected machine so the flow stays predictable."
      },
      {
        question: "Does this work behind a firewall?",
        answer: "The production concept is yes, but for the demo we keep the pairing flow informational and local."
      }
    ]
  };
}

function serializeTeam(user) {
  return {
    workspaceName: "Personal",
    members: [
      {
        id: user._id.toString(),
        initials: (user.name || "S")
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0] || "")
          .join("")
          .toUpperCase(),
        email: user.email,
        role: "Owner",
        joinedLabel: "Apr 11"
      }
    ]
  };
}

function serializeBilling(workspace) {
  return {
    currentPlan: {
      name: "FREE",
      priceLabel: "$0/mo",
      status: "ACTIVE"
    },
    plans: [
      {
        name: "Starter",
        description: "Perfect for getting started",
        priceLabel: "$19",
        cadence: "/mo",
        features: ["Smart sleep mode", "Wakes up in ~30 seconds", "Standard model", "30 min voice calls/mo", "500K tokens/mo"]
      },
      {
        name: "Pro",
        description: "Most popular",
        priceLabel: "$49",
        cadence: "/mo",
        features: ["Always warm, no wait", "Instant responses", "Standard model", "2 hours voice calls/mo", "2M tokens/mo"]
      },
      {
        name: "Enterprise",
        description: "Maximum power",
        priceLabel: "$99",
        cadence: "/mo",
        features: ["Always on, never sleeps", "Smartest model", "Unlimited voice calls", "Connect your own computer", "10M tokens/mo"]
      }
    ],
    usage: [
      { label: "Tokens", value: workspace.tokenUsage ? workspace.tokenUsage.toLocaleString() : "0", suffix: "/ 1M" },
      { label: "Voice", value: "Unlimited" },
      { label: "API Requests", value: workspace.apiRequests.toLocaleString() }
    ],
    koi: {
      name: workspace.koiName,
      status: "ACTIVE",
      tier: "STARTER"
    }
  };
}

router.get("/overview", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  return res.json({ overview: serializeOverview(req.user, workspace, awsStatus) });
});

router.get("/chat", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  return res.json(serializeChatState(workspace, awsStatus));
});

function buildArtifactsForWish(prompt, reply, runId) {
  const lower = prompt.toLowerCase();
  const artifacts = [];

  artifacts.push({
    runId,
    title: "wish-summary.md",
    type: "notes",
    language: "markdown",
    content: `# Wish Summary\n\nPrompt: ${prompt}\n\n${reply}\n`,
    preview: "Primary summary generated from the wish.",
    storage: {
      provider: "mongo",
      bucket: "",
      key: "",
      url: ""
    }
  });

  if (/(landing|homepage|website|ui|design)/.test(lower)) {
    const content = `# Landing Page Plan

## Goal
${prompt}

## Structure
- Hero with clear value proposition
- Social proof or trust strip
- Features section with concise benefit copy
- CTA block and FAQ

## Delivery Notes
${reply}
`;

    artifacts.push({
      runId,
      title: "landing-page-plan.md",
      type: "plan",
      language: "markdown",
      content,
      preview: "Landing page structure, sections, and implementation notes.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    artifacts.push({
      runId,
      title: "landing-copy.txt",
      type: "copy",
      language: "text",
      content: `Hero headline ideas\n- Your AI, your machine, your rules\n- A Koi that builds while you sleep\n- From wish to working deliverable\n`,
      preview: "Sample landing-page copy variations.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    return artifacts;
  }

  if (/(api|backend|express|node|mongodb|database|auth)/.test(lower)) {
    const content = `// Suggested backend scaffold
import express from "express";

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default router;
`;

    artifacts.push({
      runId,
      title: "backend-scaffold.js",
      type: "code",
      language: "javascript",
      content,
      preview: "Starter Express route scaffold generated from the wish.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    artifacts.push({
      runId,
      title: "backend-notes.md",
      type: "plan",
      language: "markdown",
      content: `# Backend Notes\n\nPrompt: ${prompt}\n\nRecommended next step:\n- add schema validation\n- add auth middleware\n- add controller/service separation\n`,
      preview: "Implementation notes for the generated backend scaffold.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    return artifacts;
  }

  if (/(research|analysis|report|strategy|compare)/.test(lower)) {
    const content = `# Research Brief

Prompt: ${prompt}

Summary:
${reply}
`;

    artifacts.push({
      runId,
      title: "research-brief.md",
      type: "report",
      language: "markdown",
      content,
      preview: "Structured research brief generated from the latest run.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    artifacts.push({
      runId,
      title: "decision-checklist.md",
      type: "notes",
      language: "markdown",
      content: `# Decision Checklist\n\n- confirm objective\n- compare constraints\n- choose implementation path\n- validate risk\n`,
      preview: "Companion checklist for the research output.",
      storage: {
        provider: "mongo",
        bucket: "",
        key: "",
        url: ""
      }
    });

    return artifacts;
  }

  return artifacts;
}

function buildRunSteps() {
  return [
    { label: "Queued", status: "completed" },
    { label: "Reasoning", status: "pending" },
    { label: "Generating output", status: "pending" },
    { label: "Saving artifact", status: "pending" }
  ];
}

function pushRunLog(run, label, detail = "", tone = "neutral") {
  run.logs.push({
    label,
    detail,
    tone,
    at: new Date()
  });
}

function updateRunStepStates(run, currentIndex, failure = false) {
  run.steps = run.steps.map((step, index) => {
    if (index < currentIndex) {
      return { ...step, status: "completed" };
    }

    if (index === currentIndex) {
      return { ...step, status: failure ? "failed" : "running" };
    }

    return { ...step, status: "pending" };
  });
}

async function processWishRun({ workspaceId, runId, user, prompt }) {
  if (activeWorkspaceRuns.has(String(workspaceId))) {
    return;
  }

  activeWorkspaceRuns.add(String(workspaceId));

  try {
    let workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return;
    }

    const run = workspace.runs.id(runId);

    if (!run) {
      return;
    }

    run.status = "running";
    run.progress = 20;
    updateRunStepStates(run, 1);
    pushRunLog(run, "Run started", "Preparing model context and recent conversation.", "info");
    workspace.activity.unshift({
      kind: "wish",
      title: "Wish running",
      detail: summarizePrompt(prompt),
      tone: "blue"
    });
    await workspace.save();

    const awsStatus = await getAwsStatus();
    const generated = await generateWishResponse({
      prompt,
      workspace,
      user,
      awsStatus
    });

    workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return;
    }

    const currentRun = workspace.runs.id(runId);

    if (!currentRun) {
      return;
    }

    currentRun.progress = 68;
    updateRunStepStates(currentRun, 2);
    pushRunLog(currentRun, "Reasoning complete", "Model response received. Building saved output.", "success");
    workspace.messages.push({ role: "assistant", content: generated.reply });
    const artifacts = buildArtifactsForWish(prompt, generated.reply, currentRun._id);
    pushRunLog(currentRun, "Artifacts prepared", `${artifacts.length} output(s) ready to save.`, "info");

    for (const artifact of artifacts) {
      const storage = await uploadArtifactToS3({
        userId: user.id,
        artifactId: String(currentRun._id),
        filename: artifact.title,
        content: artifact.content,
        contentType: artifact.language === "javascript" ? "application/javascript; charset=utf-8" : "text/plain; charset=utf-8"
      });
      artifact.storage = {
        provider: storage.provider,
        bucket: storage.bucket,
        key: storage.key,
        url: storage.url
      };
      pushRunLog(
        currentRun,
        storage.uploaded ? "Artifact uploaded" : "Artifact stored locally",
        `${artifact.title}${storage.uploaded ? ` - ${storage.url}` : " - Stored in workspace database"}`,
        storage.uploaded ? "success" : "warning"
      );
      workspace.artifacts.unshift(artifact);
    }
    currentRun.status = "completed";
    currentRun.provider = generated.engine?.provider || "local";
    currentRun.summary = summarizePrompt(generated.reply);
    currentRun.progress = 100;
    currentRun.steps = currentRun.steps.map((step) => ({ ...step, status: "completed" }));
    pushRunLog(currentRun, "Run completed", "Wish finished successfully.", "success");
    workspace.activity.unshift(generated.activity);
    workspace.wishCount += 1;
    workspace.runCount += 1;
    workspace.tokenUsage += generated.tokenEstimate;
    workspace.apiRequests += 1;
    workspace.sessionCost = Number((workspace.sessionCost + generated.tokenEstimate / 100000).toFixed(2));
    workspace.monthCost = Number((workspace.monthCost + generated.tokenEstimate / 50000).toFixed(2));
    workspace.ramPercent = Math.max(10, Math.min(72, workspace.ramPercent + 2));
    workspace.diskPercent = Math.max(12, Math.min(88, workspace.diskPercent + 1));
    workspace.uptimeHours += 1;

    await workspace.save();
  } catch (error) {
    const workspace = await Workspace.findById(workspaceId);

    if (workspace) {
      const run = workspace.runs.id(runId);

      if (run) {
        run.status = "failed";
        run.summary = "The wish run failed before producing a final result.";
        run.progress = 100;
        updateRunStepStates(run, 1, true);
        pushRunLog(run, "Run failed", "The workflow exited before completion.", "error");
      }

      workspace.messages.push({
        role: "assistant",
        content: "The wish run failed before completing. Please try again."
      });
      workspace.activity.unshift({
        kind: "wish",
        title: "Wish failed",
        detail: summarizePrompt(prompt),
        tone: "rose"
      });
      await workspace.save();
    }
  } finally {
    activeWorkspaceRuns.delete(String(workspaceId));
  }
}

router.post("/chat/messages", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  const config = getAwsConfig();
  const content = String(req.body?.content || "").trim();

  if (!content) {
    return res.status(400).json({ message: "Message content is required" });
  }

  const hasActiveRun = workspace.runs.some((run) => run.status === "queued" || run.status === "running");

  if (hasActiveRun) {
    return res.status(409).json({ message: "A wish is already running. Wait for it to finish before starting another." });
  }

  workspace.messages.push({ role: "user", content });
  workspace.runs.unshift({
    title: "Wish queued",
    prompt: content,
    status: "queued",
    provider: awsStatus.connected || config.bedrockApiKey ? "bedrock" : "local",
    summary: "Waiting to begin execution",
    progress: 5,
    steps: buildRunSteps(),
    logs: [
      {
        label: "Wish accepted",
        detail: summarizePrompt(content),
        tone: "info",
        at: new Date()
      }
    ]
  });
  workspace.activity.unshift({
    kind: "wish",
    title: "Wish queued",
    detail: summarizePrompt(content),
    tone: "violet"
  });

  await workspace.save();

  const runId = workspace.runs[0]?._id;

  processWishRun({
    workspaceId: workspace._id,
    runId,
    user: {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email
    },
    prompt: content
  });

  return res.status(202).json({
    ...serializeChatState(workspace, awsStatus),
    overview: serializeOverview(req.user, workspace, awsStatus)
  });
});

router.post("/chat/reset", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();

  workspace.messages = buildInitialMessages(req.user.name);
  workspace.activity.unshift({
    kind: "reset",
    title: "Memory reset",
    detail: "Conversation history cleared for demo session",
    tone: "rose"
  });
  workspace.runCount = 0;
  workspace.wishCount = 0;
  workspace.tokenUsage = 0;
  workspace.apiRequests = 0;
  workspace.sessionCost = 0;
  workspace.runs = [];
  workspace.artifacts = [];

  await workspace.save();

  return res.json({
    message: "Memory reset",
    ...serializeChatState(workspace, awsStatus),
    overview: serializeOverview(req.user, workspace, awsStatus)
  });
});

router.get("/chat/artifacts/:artifactId", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const artifact = workspace.artifacts.id(req.params.artifactId);

  if (!artifact) {
    return res.status(404).json({ message: "Artifact not found" });
  }

  return res.json({
    artifact: {
      id: artifact._id.toString(),
      title: artifact.title,
      type: artifact.type,
      language: artifact.language,
      content: artifact.content,
      storage: artifact.storage,
      createdAt: artifact.createdAt
    }
  });
});

router.get("/settings", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  return res.json(serializeSettings(req.user, workspace, awsStatus));
});

router.get("/connect", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  return res.json(serializeConnect(workspace, awsStatus));
});

router.get("/team", requireAuth, async (req, res) => {
  await ensureWorkspace(req.user);
  return res.json(serializeTeam(req.user));
});

router.get("/billing", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  return res.json(serializeBilling(workspace));
});

router.patch("/settings", requireAuth, async (req, res) => {
  const workspace = await ensureWorkspace(req.user);
  const awsStatus = await getAwsStatus();
  const nextSettings = req.body || {};

  workspace.settings.theme = nextSettings.theme || workspace.settings.theme;
  workspace.settings.accent = nextSettings.accent || workspace.settings.accent;
  workspace.settings.density = nextSettings.density || workspace.settings.density;
  workspace.settings.timeFormat = nextSettings.timeFormat || workspace.settings.timeFormat;

  if (typeof nextSettings.notifications === "boolean") {
    workspace.settings.notifications = nextSettings.notifications;
  }

  if (typeof nextSettings.reduceMotion === "boolean") {
    workspace.settings.reduceMotion = nextSettings.reduceMotion;
  }

  if (typeof nextSettings.experienceMode === "string" && nextSettings.experienceMode.trim()) {
    workspace.settings.experienceMode = nextSettings.experienceMode.trim();
  }

  workspace.activity.unshift({
    kind: "settings",
    title: "Workspace preferences updated",
    detail: `${workspace.settings.theme} - ${workspace.settings.accent} - ${workspace.settings.density}`,
    tone: "amber"
  });

  await workspace.save();

  return res.json(serializeSettings(req.user, workspace, awsStatus));
});

export default router;
