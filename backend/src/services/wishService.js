import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

import { getAwsConfig, hasBedrockCredentials } from "../config/aws.js";

const BEDROCK_FALLBACK_MODELS = [
  "amazon.nova-micro-v1:0",
  "amazon.nova-lite-v1:0",
  "meta.llama3-8b-instruct-v1:0"
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function summarizePrompt(prompt) {
  const normalized = prompt.trim().replace(/\s+/g, " ");
  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function buildDirectFallbackAnswer(prompt) {
  const lower = prompt.toLowerCase();

  if (/(joke|funny)/.test(lower)) {
    return "Why do programmers prefer dark mode? Because light attracts bugs.";
  }

  if (/(workout|fitness|exercise|gym)/.test(lower)) {
    return [
      "Here is a simple 90-day workout structure:",
      "",
      "Days 1-30",
      "- Focus on consistency: 3 strength days, 2 light cardio days, 2 recovery days each week.",
      "- Use full-body training with squats, presses, rows, hinges, and core work.",
      "",
      "Days 31-60",
      "- Increase intensity: move to upper/lower splits 4 days per week.",
      "- Add progressive overload and track reps, sets, and recovery.",
      "",
      "Days 61-90",
      "- Push performance: 4 strength days, 1 conditioning day, 2 recovery days.",
      "- Reassess goals weekly and deload in the final week if needed.",
      "",
      "If you want, I can turn this into a full week-by-week plan next."
    ].join("\n");
  }

  if (/(meal|diet|nutrition)/.test(lower)) {
    return [
      "I can help with that.",
      "",
      "A strong starting point is:",
      "- prioritize protein at each meal",
      "- keep calories aligned with your goal",
      "- use simple repeatable meals during the week",
      "- review energy, hunger, and recovery every 7 days"
    ].join("\n");
  }

  return null;
}

function buildFallbackWishResponse(prompt) {
  const lower = prompt.toLowerCase();
  const tokenEstimate = clamp(Math.round(prompt.length * 2.2), 140, 1400);
  const directAnswer = buildDirectFallbackAnswer(prompt);

  const playbooks = [
    {
      match: /(landing|homepage|website|clone|design|ui)/,
      title: "Website build sequence",
      actions: [
        "Audit the requested surface and extract the visual system.",
        "Break the work into sections, routes, and reusable pieces.",
        "Implement the highest-visibility parts first, then refine spacing and polish."
      ],
      outcome: "I can turn this into a production-ready frontend slice with matching copy, layout, and motion."
    },
    {
      match: /(api|backend|database|mongo|node|express|auth)/,
      title: "Backend delivery sequence",
      actions: [
        "Define the data model and the route contract first.",
        "Implement the service logic and persistence.",
        "Wire the frontend to the new endpoints and verify the main user flows."
      ],
      outcome: "This is a good fit for the Node/Mongo stack you already have."
    },
    {
      match: /(research|docs|compare|analysis|plan|strategy)/,
      title: "Research sequence",
      actions: [
        "Clarify the desired outcome and evaluation criteria.",
        "Collect the most relevant facts and constraints.",
        "Return a concise recommendation with tradeoffs and next actions."
      ],
      outcome: "I can structure this into an actionable brief instead of just raw notes."
    },
    {
      match: /(data|csv|json|report|excel|sheet)/,
      title: "Data workflow",
      actions: [
        "Inspect the input format and detect the key fields.",
        "Normalize, summarize, and extract the important signals.",
        "Produce a clean report, transformation, or dashboard-friendly output."
      ],
      outcome: "I can help turn scattered data into something usable for decision-making."
    }
  ];

  const selected = playbooks.find((entry) => entry.match.test(lower)) || {
    title: "Execution sequence",
    actions: [
      "Interpret the wish and reduce it to the smallest concrete deliverable.",
      "Choose the fastest path that still feels polished.",
      "Return a result, a short plan, and the next best improvement step."
    ],
    outcome: "This is a strong demo candidate and fits the Wishing Engine flow well."
  };

  const text = directAnswer
    ? [
        directAnswer,
        "",
        "Fallback mode note: this answer was produced by the local demo engine because Bedrock is unavailable for this run."
      ].join("\n")
    : [
        `Wish received: "${summarizePrompt(prompt)}"`,
        "",
        "Execution outline",
        ...selected.actions.map((step, index) => `${index + 1}. ${step}`),
        "",
        `Result direction: ${selected.outcome}`,
        "",
        "Fallback mode note: this response was produced by the local demo engine because Bedrock is unavailable for this run."
      ].join("\n");

  return {
    reply: text,
    tokenEstimate,
    activity: {
      kind: "wish",
      title: selected.title,
      detail: summarizePrompt(prompt),
      tone: "cyan"
    },
    engine: {
      modeLabel: "Fallback",
      provider: "local"
    }
  };
}

function createBedrockClient() {
  const config = getAwsConfig();

  return new BedrockRuntimeClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

async function callBedrockConverseWithApiKey({ modelId, system, messages, region, apiKey }) {
  const response = await fetch(
    `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/converse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        system,
        messages,
        inferenceConfig: {
          maxTokens: 700,
          temperature: 0.4
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.Message || `Bedrock HTTP request failed with status ${response.status}`
    );
    error.name = payload?.__type?.split("#").pop() || payload?.code || payload?.Code || "BedrockHttpError";
    throw error;
  }

  return payload;
}

function buildConversationMessages(workspace, prompt) {
  const rawHistory = [...workspace.messages]
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-8)
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: [{ text: message.content }]
    }));

  const firstUserIndex = rawHistory.findIndex((message) => message.role === "user");
  const history = firstUserIndex >= 0 ? rawHistory.slice(firstUserIndex) : [];

  history.push({
    role: "user",
    content: [{ text: prompt }]
  });

  return history;
}

function extractBedrockText(response) {
  const content = response?.output?.message?.content || [];
  return content
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}

function estimateTokens(prompt, reply) {
  return clamp(Math.round((prompt.length + reply.length) / 3.2), 180, 6000);
}

function getFailureMessage(error) {
  const code = error?.name || "";

  if (code === "AccessDeniedException" || code === "ValidationException") {
    return "Bedrock access is not enabled for the configured model yet.";
  }

  if (code === "ResourceNotFoundException") {
    return error?.message || "The configured Bedrock model is not available for this account yet.";
  }

  return "Bedrock request failed.";
}

function getBedrockCandidateModels(config) {
  return [config.bedrockModelId, ...BEDROCK_FALLBACK_MODELS].filter(
    (modelId, index, collection) => modelId && collection.indexOf(modelId) === index
  );
}

export async function generateWishResponse({ prompt, workspace, user, awsStatus }) {
  const config = getAwsConfig();
  const canUseBedrock = config.bedrockApiKey || awsStatus?.connected;

  if (!hasBedrockCredentials() || !canUseBedrock) {
    return buildFallbackWishResponse(prompt);
  }

  const client = config.bedrockApiKey ? null : createBedrockClient();
  const candidates = getBedrockCandidateModels(config);
  let lastError = null;

  for (const modelId of candidates) {
    try {
      const system = [
        {
          text:
            "You are SkyKoi's Wishing Engine for a demo product. Be concise, practical, execution-oriented, and helpful. When useful, give a short implementation plan, recommended next step, and any risks. For simple conversational asks like a joke, greeting, or one-off answer, respond directly without adding implementation-plan boilerplate. Avoid mentioning internal model policy or AWS unless directly relevant."
        }
      ];
      const messages = buildConversationMessages(workspace, prompt);
      const response = config.bedrockApiKey
        ? await callBedrockConverseWithApiKey({
            modelId,
            system,
            messages,
            region: config.region,
            apiKey: config.bedrockApiKey
          })
        : await client.send(
            new ConverseCommand({
              modelId,
              system,
              messages,
              inferenceConfig: {
                maxTokens: 700,
                temperature: 0.4
              }
            })
          );

      const reply = extractBedrockText(response);

      if (!reply) {
        throw new Error("Empty Bedrock response");
      }

      return {
        reply,
        tokenEstimate: estimateTokens(prompt, reply),
        activity: {
          kind: "wish",
          title: "AI wish completed",
          detail: summarizePrompt(prompt),
          tone: "cyan"
        },
        engine: {
          modeLabel: "Bedrock",
          provider: modelId
        }
      };
    } catch (error) {
      lastError = error;
    }
  }

  const fallback = buildFallbackWishResponse(prompt);

  return {
    ...fallback,
    reply: `${fallback.reply}\n\nAI status: ${getFailureMessage(lastError)}`,
    engine: {
      modeLabel: "Fallback",
      provider: "local"
    }
  };
}
