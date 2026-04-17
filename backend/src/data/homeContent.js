const homeContent = {
  brand: {
    name: "SkyKoi",
    tagline: "Your Own AI Agent With Its Own Computer",
    subtagline:
      "Chat, call, and build with an autonomous AI operator that can research, code, and deliver finished work.",
    primaryCta: "Get Your Agent",
    secondaryCta: "See It In Action"
  },
  nav: ["Features", "Pricing", "Enterprise", "Docs", "Login"],
  stats: [
    { label: "60s", text: "From signup to live agent" },
    { label: "24/7", text: "Always-on availability" },
    { label: "100+", text: "Connected tools and integrations" },
    { label: "$19", text: "Starting monthly price" }
  ],
  capabilities: [
    {
      title: "Multi-Agent Gateway",
      description: "Ship websites, code, reports, and ops workflows autonomously.",
      bullets: ["Autonomous planning", "Code + docs delivery", "API and DB execution"]
    },
    {
      title: "Fast Launch",
      description: "From plan selection to active agent in under a minute.",
      bullets: ["One-click cloud setup", "Voice-ready from minute one", "Smart hibernation"]
    },
    {
      title: "Enterprise Security",
      description: "Isolated machines, encrypted data, and complete auditability.",
      bullets: ["Dedicated compute", "AES-256", "SOC 2-aligned controls"]
    }
  ],
  integrations: [
    "Slack",
    "Discord",
    "WhatsApp",
    "Teams",
    "GitHub",
    "GitLab",
    "Jira",
    "Linear",
    "MongoDB",
    "PostgreSQL",
    "AWS",
    "Vercel",
    "Netlify",
    "Docker"
  ],
  pricing: {
    monthly: [
      {
        name: "Starter",
        price: 19,
        cta: "Get Started",
        features: [
          "Dedicated AI agent",
          "Sleeps when idle",
          "30 minutes voice per month",
          "Multi-channel messaging"
        ]
      },
      {
        name: "Pro",
        price: 49,
        cta: "Start Free Trial",
        featured: true,
        features: [
          "Everything in Starter",
          "Always-warm runtime",
          "2 hours voice per month",
          "Priority support"
        ]
      },
      {
        name: "Enterprise",
        price: 99,
        cta: "Contact Sales",
        features: [
          "Everything in Pro",
          "Never-sleep dedicated machine",
          "Unlimited voice",
          "Custom integrations"
        ]
      }
    ]
  }
};

export default homeContent;
