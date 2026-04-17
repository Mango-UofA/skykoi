import { useEffect, useMemo } from "react";
import { Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage.jsx";
import DashboardBillingPage from "./components/dashboard/DashboardBillingPage.jsx";
import DashboardChatPage from "./components/dashboard/DashboardChatSkyKoiEnhancedPage.jsx";
import DashboardConnectPage from "./components/dashboard/DashboardConnectPage.jsx";
import DashboardOverviewPage from "./components/dashboard/DashboardOverviewPage.jsx";
import DashboardSettingsPage from "./components/dashboard/DashboardSettingsPage.jsx";
import DashboardTeamPage from "./components/dashboard/DashboardTeamPage.jsx";

import homeHtml from "./mirror/home.html?raw";
import featuresHtml from "./mirror/features.html?raw";
import pricingHtml from "./mirror/pricing.html?raw";
import enterpriseHtml from "./mirror/enterprise.html?raw";

const docsHtmlModules = import.meta.glob("./mirror/docs/*.html", {
  eager: true,
  import: "default",
  query: "?raw",
});

const docsRoutes = [
  "/docs",
  "/docs/quick-start",
  "/docs/how-it-works",
  "/docs/platform-overview",
  "/docs/agent-runtime",
  "/docs/gateway-architecture",
  "/docs/instance-isolation",
  "/docs/aws-integration",
  "/docs/deployment-model",
  "/docs/scaling",
  "/docs/channel-overview",
  "/docs/channel-setup",
  "/docs/tools-overview",
  "/docs/aws-management",
  "/docs/business-automation",
  "/docs/custom-skills",
  "/docs/api-overview",
  "/docs/security-model",
  "/docs/api-keys",
  "/docs/billing-overview",
  "/docs/usage-tracking",
];

function useDocumentChrome(title) {
  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;
    const previousBodyStyle = document.body.getAttribute("style");

    document.title = title;
    document.documentElement.className = "dark";
    document.body.className = "__className_f367f3 antialiased";
    document.body.style.backgroundColor = "#000000";
    document.body.style.color = "#ffffff";

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
      if (previousBodyStyle === null) {
        document.body.removeAttribute("style");
      } else {
        document.body.setAttribute("style", previousBodyStyle);
      }
    };
  }, [title]);
}

function sanitizeMarkup(raw) {
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const source = bodyMatch ? bodyMatch[1] : raw;

  return source
    .replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/gi, "")
    .replace(/<\/body>\s*<\/html>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<template[^>]*><\/template>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<div class="absolute inset-0 bg-black"><\/div>/g, "")
    .replace(/https:\/\/skykoi\.com/g, "")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/overview/g, "/dashboard/overview")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/chat/g, "/dashboard/chat")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/connect/g, "/dashboard/connect")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/team/g, "/dashboard/team")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/billing/g, "/dashboard/billing")
    .replace(/https:\/\/www\.skykoi\.com\/dashboard\/settings/g, "/dashboard/settings")
    .replace(/href="\/dashboard"/g, 'href="/dashboard/overview"')
    .replace(/href="\/docs" target="_blank" rel="noopener noreferrer"/g, 'href="/docs"')
    .replace(/href="\/signup\?plan=enterprise"/g, 'href="/signup"')
    .replace(/href="\/dashboard\/chat"/g, 'href="/signup"')
    .replace(/href="https:\/\/accounts\.skykoi\.com\/[^"]*"/g, 'href="/login"')
    .replace(/href="https:\/\/www\.skykoi\.com\/signup[^"]*"/g, 'href="/signup"')
    .replace(/href="https:\/\/www\.skykoi\.com\/login[^"]*"/g, 'href="/login"')
    .replace(/style="[^"]*opacity:0[^"]*"/g, "")
    .replace(/style="[^"]*height:-[^"]*"/g, 'style="height:8px"')
    .replace(/<span class="text-2xl mb-3 block">[^<]+<\/span>/g, '<span class="mirror-feature-icon" aria-hidden="true"></span>')
    .replace(/<span class="text-xl flex-shrink-0">[^<]+<\/span>/g, '<span class="mirror-inline-icon" aria-hidden="true"></span>')
    .replace(/<span class="text-violet-400">[^<]+<\/span>/g, '<span class="text-violet-400">✦</span>')
    .replace(/Â/g, "")
    .replace(/â„¢/g, "™")
    .replace(/Â©/g, "©")
    .replace(/Â·/g, "·")
    .replace(/âœ¦/g, "✦")
    .replace(/âœ“/g, "✓")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€¦/g, "…")
    .replace(/â€˜/g, "‘")
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€|â€\u009d/g, "”")
    .replace(/â€"/g, "”")
    .replace(/â€/g, '"')
    .replace(/Ãƒâ€šÃ‚Â·/g, "·")
    .replace(/Ãƒâ€šÃ‚Â/g, "")
    .replace(/Ã‚Â/g, "")
    .replace(/â€º/g, "›")
    .replace(/â€¹/g, "‹")
    .replace(/â†’/g, "→")
    .replace(/ðŸŒ|ðŸ“|âŒ¨ï¸|ðŸ”Œ|ðŸ’¤|ðŸ“ˆ|ðŸ”„|ðŸ”|ðŸ“‹|ðŸ¢|ðŸ”’ï¸|ï¸/g, "");
}

function getDocsHtml(pathname) {
  const fileName =
    pathname === "/docs"
      ? "docs.html"
      : `docs__${pathname.replace(/^\/docs\//, "").replace(/\//g, "__")}.html`;

  return docsHtmlModules[`./mirror/docs/${fileName}`];
}

function MarketingMirror({ html, title, pageClass }) {
  useDocumentChrome(title);
  const content = useMemo(() => sanitizeMarkup(html), [html]);

  return <div className={`mirror-root ${pageClass}`} dangerouslySetInnerHTML={{ __html: content }} />;
}

function PlaceholderPage({ title, copy }) {
  useDocumentChrome(`SkyKoi - ${title}`);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-gray-400 mb-6">
          <span>{title}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight mb-6">
          {title}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">{copy}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-gray-100 rounded-full transition-all duration-300" href="/">
            Back Home
          </a>
          <a className="inline-flex items-center px-7 py-3.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300" href="/signup">
            Start Free
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingMirror html={homeHtml} pageClass="page-home" title="SkyKoi™ - Your Own AI Agent With Its Own Computer" />} />
      <Route path="/features" element={<MarketingMirror html={featuresHtml} pageClass="page-features" title="SkyKoi Features" />} />
      <Route path="/pricing" element={<MarketingMirror html={pricingHtml} pageClass="page-pricing" title="SkyKoi Pricing" />} />
      <Route path="/enterprise" element={<MarketingMirror html={enterpriseHtml} pageClass="page-enterprise" title="SkyKoi Enterprise" />} />
      {docsRoutes.map((path) => (
        <Route
          key={path}
          path={path}
          element={<MarketingMirror html={getDocsHtml(path)} pageClass="page-docs" title="SkyKoi Docs" />}
        />
      ))}
      <Route path="/dashboard" element={<DashboardOverviewPage />} />
      <Route path="/dashboard/overview" element={<DashboardOverviewPage />} />
      <Route path="/dashboard/chat" element={<DashboardChatPage />} />
      <Route path="/dashboard/connect" element={<DashboardConnectPage />} />
      <Route path="/dashboard/team" element={<DashboardTeamPage />} />
      <Route path="/dashboard/billing" element={<DashboardBillingPage />} />
      <Route path="/dashboard/settings" element={<DashboardSettingsPage />} />
      <Route path="/docs/api" element={<PlaceholderPage title="API Reference" copy="The current live docs tree exposes API Overview under the docs sidebar, and that page is now mirrored at /docs/api-overview." />} />
      <Route path="/demo" element={<PlaceholderPage title="Book a Demo" copy="Demo booking route placeholder." />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/about" element={<PlaceholderPage title="About" copy="Company page placeholder." />} />
      <Route path="/careers" element={<PlaceholderPage title="Careers" copy="Careers page placeholder." />} />
      <Route path="/contact" element={<PlaceholderPage title="Contact" copy="Contact page placeholder." />} />
      <Route path="/privacy" element={<PlaceholderPage title="Privacy" copy="Privacy page placeholder." />} />
      <Route path="/terms" element={<PlaceholderPage title="Terms" copy="Terms page placeholder." />} />
      <Route path="/security" element={<PlaceholderPage title="Security" copy="Security page placeholder." />} />
      <Route path="/blog" element={<PlaceholderPage title="Blog" copy="Blog page placeholder." />} />
      <Route path="/status" element={<PlaceholderPage title="Status" copy="Status page placeholder." />} />
      <Route path="/changelog" element={<PlaceholderPage title="Changelog" copy="Changelog page placeholder." />} />
      <Route path="*" element={<PlaceholderPage title="Page not found" copy="This route is not mirrored yet." />} />
    </Routes>
  );
}

export default App;
