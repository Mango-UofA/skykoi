import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Download,
  EyeOff,
  FileText,
  Info,
  Mic,
  Paperclip,
  PanelLeft,
  Phone,
  Send,
  Sparkles,
  X
} from "lucide-react";

import { getDashboardArtifact, getDashboardChat, sendDashboardMessage } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

const HERO_ART = `╔═╗ ╦╔═ ╦ ╦ ╦╔═ ╔═╗ ╦
╚═╗ ╠╩╗ ╚╦╝ ╠╩╗ ║ ║ ║
╚═╝ ╩ ╩  ╩  ╩ ╩ ╚═╝ ╩`;

const SUGGESTED_WISHES = [
  "Build a landing page for my product",
  "Generate a 90 day workout plan for me",
  "Write a backend API for user auth",
  "Analyze this idea and give me a launch plan"
];

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

function formatTime(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function hasActiveRun(runs) {
  return runs.some((run) => run.status === "queued" || run.status === "running");
}

function formatMessageBlocks(content) {
  return String(content || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseInlineMarkdown(text) {
  const segments = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const value = match[0];
    if (value.startsWith("**") && value.endsWith("**")) {
      segments.push({ type: "strong", value: value.slice(2, -2) });
    } else if (value.startsWith("`") && value.endsWith("`")) {
      segments.push({ type: "inline-code", value: value.slice(1, -1) });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}

function renderInlineContent(text) {
  return parseInlineMarkdown(text).map((segment, index) => {
    if (segment.type === "strong") {
      return <strong key={`${segment.value}-${index}`}>{segment.value}</strong>;
    }

    if (segment.type === "inline-code") {
      return <code key={`${segment.value}-${index}`}>{segment.value}</code>;
    }

    return <span key={`${segment.value}-${index}`}>{segment.value}</span>;
  });
}

function parseMessageContent(content) {
  const source = String(content || "");
  const parts = source.split(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g);
  const blocks = [];

  for (let index = 0; index < parts.length; index += 3) {
    const prose = parts[index];
    if (prose?.trim()) {
      formatMessageBlocks(prose).forEach((block) => {
        if (/^\*\*[^*]+\*\*:\s*/.test(block)) {
          const [, label, value] = block.match(/^\*\*([^*]+)\*\*:\s*([\s\S]*)$/) || [];
          if (label && value) {
            blocks.push({ type: "callout", label, value });
            return;
          }
        }

        blocks.push({ type: "paragraph", value: block });
      });
    }

    const language = parts[index + 1];
    const code = parts[index + 2];
    if (typeof code === "string") {
      blocks.push({
        type: "code",
        language: language || "",
        value: code.replace(/\n$/, "")
      });
    }
  }

  return blocks;
}

function MessageContent({ content }) {
  const blocks = parseMessageContent(content);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <div key={`code-${index}`} className="skykoi-message__code">
              {block.language ? <div className="skykoi-message__code-label">{block.language}</div> : null}
              <pre>
                <code>{block.value}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "callout") {
          return (
            <p key={`callout-${index}`} className="skykoi-message__callout">
              <strong>{block.label}:</strong> {renderInlineContent(block.value)}
            </p>
          );
        }

        return <p key={`paragraph-${index}`}>{renderInlineContent(block.value)}</p>;
      })}
    </>
  );
}

function getStatusLabel(run) {
  return `${run.status} - ${run.progress || 0}%`;
}

function getArtifactStorageLabel(artifact) {
  return artifact.storage?.provider === "s3" ? "Stored in S3" : "Stored in workspace";
}

function KoiChip() {
  return (
    <div className="skykoi-koi-chip">
      <div className="skykoi-koi-chip__icon">
        <Bot size={16} />
      </div>
      <div className="skykoi-koi-chip__copy">
        <strong>Koi</strong>
        <span>
          <i />
          Online
        </span>
      </div>
    </div>
  );
}

export default function DashboardChatSkyKoiEnhancedPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
  const [runs, setRuns] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [previewArtifact, setPreviewArtifact] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardChat(token)
      .then((data) => {
        setWorkspace(data.workspace);
        setMessages(data.messages);
        setRuns(data.runs || []);
        setArtifacts(data.artifacts || []);
        if (data.runs?.[0]?.id) {
          setSelectedRunId((current) => current || data.runs[0].id);
        }
      })
      .catch(() => {
        setError("Unable to load the Wishing Engine.");
      });
  }, [navigate]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    const token = getToken();

    if (!token || !hasActiveRun(runs)) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      getDashboardChat(token)
        .then((data) => {
          setWorkspace(data.workspace);
          setMessages(data.messages);
          setRuns(data.runs || []);
          setArtifacts(data.artifacts || []);
          if (data.runs?.[0]?.id) {
            setSelectedRunId((current) => current || data.runs[0].id);
          }
        })
        .catch(() => {
          setError("Unable to refresh the Wishing Engine state.");
        });
    }, 1800);

    return () => window.clearInterval(interval);
  }, [runs]);

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || isSending) {
      return;
    }

    const token = getToken();
    const optimisticId = `local-${Date.now()}`;
    setError("");
    setDraft("");
    setIsSending(true);
    setMessages((current) => [
      ...current,
      { id: optimisticId, role: "user", content, createdAt: new Date().toISOString(), status: "complete" }
    ]);

    try {
      const data = await sendDashboardMessage(token, content);
      setWorkspace(data.workspace || null);
      setMessages(data.messages);
      setRuns(data.runs || []);
      setArtifacts(data.artifacts || []);
      if (data.runs?.[0]?.id) {
        setSelectedRunId(data.runs[0].id);
        setIsPanelOpen(true);
      }
    } catch {
      setError("Your wish could not be processed right now.");
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  }

  async function handleDownloadArtifact(artifactId) {
    try {
      const token = getToken();
      const { artifact } = await getDashboardArtifact(token, artifactId);
      const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = artifact.title;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download that artifact.");
    }
  }

  async function handlePreviewArtifact(artifactId) {
    try {
      const token = getToken();
      const { artifact } = await getDashboardArtifact(token, artifactId);
      setPreviewArtifact(artifact);
    } catch {
      setError("Could not load that artifact preview.");
    }
  }

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) || runs[0] || null,
    [runs, selectedRunId]
  );
  const selectedArtifacts = selectedRun ? artifacts.filter((artifact) => artifact.runId === selectedRun.id) : [];
  const visibleArtifacts = selectedArtifacts.length ? selectedArtifacts : artifacts;
  const hasConversation = messages.length > 1;

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--chat dashboard-page--chat-skykoi">
        <div className="skykoi-chat">
          <div className="skykoi-chat__header">
            <button className="skykoi-chat__toolbar-button" type="button" aria-label="Open workspace panel" onClick={() => setIsPanelOpen(true)}>
              <PanelLeft size={16} />
            </button>
            <KoiChip />
            <div className="skykoi-chat__toolbar">
              <button className="skykoi-chat__toolbar-button" type="button" aria-label="Voice Call">
                <Phone size={16} />
              </button>
              <button className="skykoi-chat__toolbar-button" type="button" aria-label="Koi Info" onClick={() => setIsPanelOpen(true)}>
                <Info size={16} />
              </button>
              <button className="skykoi-chat__toolbar-button" type="button" aria-label="Chat Style">
                <Sparkles size={16} />
              </button>
              <button className="skykoi-chat__toolbar-button" type="button" aria-label="Verbose Mode">
                <EyeOff size={16} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="skykoi-chat__scroll">
            <div className="skykoi-chat__inner">
              {!hasConversation ? (
                <div className="skykoi-chat__hero">
                  <pre className="skykoi-chat__hero-art">{HERO_ART}</pre>
                  <p className="skykoi-chat__hero-label">WISHING ENGINE</p>
                  <p className="skykoi-chat__hero-sub">Type a wish below to begin</p>
                  <div className="skykoi-chat__suggestions">
                    {SUGGESTED_WISHES.map((wish) => (
                      <button key={wish} type="button" className="skykoi-chat__suggestion" onClick={() => setDraft(wish)}>
                        {wish}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="skykoi-chat__messages">
                  {messages.map((message) => (
                    <article key={message.id} className={`skykoi-message skykoi-message--${message.role}`}>
                      <div className="skykoi-message__meta">
                        <span>{message.role === "assistant" ? "Koi replied" : "You asked"}</span>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                      <div className="skykoi-message__body">
                        <MessageContent content={message.content} />
                      </div>
                    </article>
                  ))}
                  {isSending ? (
                    <article className="skykoi-message skykoi-message--assistant">
                      <div className="skykoi-message__meta">
                        <span>Koi replied</span>
                        <span>queued...</span>
                      </div>
                      <div className="skykoi-message__body">
                        <p>Creating a run and starting the wish workflow...</p>
                      </div>
                    </article>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="skykoi-chat__statusbar">
            <button className="skykoi-chat__status-pill skykoi-chat__status-pill--violet" type="button" onClick={() => setIsPanelOpen(true)}>
              {workspace?.queuedLabel || "Ready"}
            </button>
            <button className="skykoi-chat__status-pill skykoi-chat__status-pill--cyan" type="button" onClick={() => setIsPanelOpen(true)}>
              {workspace?.modeLabel || "Smart"}
            </button>
          </div>

          <form className="skykoi-composer" onSubmit={handleSubmit}>
            <button className="skykoi-composer__icon" type="button" aria-label="Attach file">
              <Paperclip size={16} />
            </button>
            <div className="skykoi-composer__field">
              <span className="skykoi-composer__prompt">wish <em>›</em></span>
              <textarea
                rows={1}
                placeholder="Ask for code, content, planning, analysis, or a build sequence..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <button className="skykoi-composer__icon" type="button" aria-label="Voice input">
              <Mic size={16} />
            </button>
            <button className="skykoi-composer__send" disabled={isSending || !draft.trim()} type="submit" aria-label="Send">
              <Send size={16} />
            </button>
          </form>

          {error ? <div className="dashboard-state dashboard-state--inline">{error}</div> : null}
        </div>

        <div className={`skykoi-ops ${isPanelOpen ? "is-open" : ""}`}>
          <button className="skykoi-ops__backdrop" type="button" aria-label="Close workspace panel" onClick={() => setIsPanelOpen(false)} />
          <aside className="skykoi-ops__panel">
            <div className="skykoi-ops__panel-head">
              <div>
                <strong>Workspace</strong>
                <span>Runs, outputs, and execution details</span>
              </div>
              <button className="skykoi-ops__close" type="button" onClick={() => setIsPanelOpen(false)} aria-label="Close panel">
                <X size={16} />
              </button>
            </div>

            <section className="skykoi-ops__section">
              <div className="skykoi-ops__section-title">Status</div>
              <div className="skykoi-ops__status">
                <span className="skykoi-chat__status-pill skykoi-chat__status-pill--violet">{workspace?.queuedLabel || "Ready"}</span>
                <span className="skykoi-chat__status-pill skykoi-chat__status-pill--cyan">{workspace?.modeLabel || "Smart"}</span>
              </div>
              <p className="skykoi-ops__status-copy">
                {selectedRun
                  ? `Current run: ${selectedRun.title.toLowerCase()}`
                  : hasConversation
                    ? "Conversation is active and ready for the next wish."
                    : "Start with a wish and this workspace will track runs, outputs, and execution details here."}
              </p>
            </section>

            {runs.length ? (
              <section className="skykoi-ops__section">
                <div className="skykoi-ops__section-title">Recent Runs</div>
                <div className="skykoi-ops__runs">
                  {runs.map((run) => (
                    <article
                      key={run.id}
                      className={`skykoi-ops__run ${selectedRun?.id === run.id ? "is-active" : ""}`}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <div className="skykoi-ops__run-head">
                        <strong>{run.title}</strong>
                        <span>{getStatusLabel(run)}</span>
                      </div>
                      <p>{run.prompt}</p>
                      <div className="skykoi-ops__run-meta">
                        <span>{run.provider}</span>
                        <span>{formatTime(run.createdAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {selectedRun ? (
              <section className="skykoi-ops__section">
                <div className="skykoi-ops__section-title">Run Detail</div>
                <div className="skykoi-ops__detail">
                  <div className="skykoi-ops__detail-head">
                    <strong>{selectedRun.title}</strong>
                    <span>{selectedRun.provider}</span>
                  </div>
                  <p className="skykoi-ops__detail-prompt">{selectedRun.prompt}</p>
                  <div className="skykoi-ops__timeline">
                    {(selectedRun.logs || []).map((log, index) => (
                      <div key={`${selectedRun.id}-${index}`} className="skykoi-ops__timeline-item">
                        <i className={`skykoi-ops__timeline-dot skykoi-ops__timeline-dot--${log.tone || "neutral"}`} />
                        <div>
                          <strong>{log.label}</strong>
                          {log.detail ? <span>{log.detail}</span> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {visibleArtifacts.length ? (
              <section className="skykoi-ops__section">
                <div className="skykoi-ops__section-title">Outputs</div>
                <div className="skykoi-ops__artifacts">
                  {visibleArtifacts.map((artifact) => (
                    <article key={artifact.id} className="skykoi-ops__artifact">
                      <div className="skykoi-ops__artifact-copy">
                        <strong>{artifact.title}</strong>
                        <span>{artifact.preview}</span>
                        <small>{getArtifactStorageLabel(artifact)}</small>
                      </div>
                      <div className="skykoi-ops__artifact-actions">
                        <button type="button" onClick={() => handlePreviewArtifact(artifact.id)}>
                          <FileText size={15} />
                          <span>Preview</span>
                        </button>
                        <button type="button" onClick={() => handleDownloadArtifact(artifact.id)}>
                          <Download size={15} />
                          <span>Download</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <section className="skykoi-ops__section">
                <div className="skykoi-ops__section-title">Outputs</div>
                <div className="skykoi-ops__empty">
                  <strong>No outputs yet</strong>
                  <span>Your generated files and summaries will appear here after a wish completes.</span>
                </div>
              </section>
            )}
          </aside>
        </div>

        {previewArtifact ? (
          <div className="dashboard-preview">
            <button className="dashboard-preview__backdrop" type="button" aria-label="Close preview" onClick={() => setPreviewArtifact(null)} />
            <div className="dashboard-preview__panel">
              <div className="dashboard-preview__head">
                <div className="dashboard-preview__meta">
                  <strong>{previewArtifact.title}</strong>
                  <span>{previewArtifact.type}{previewArtifact.language ? ` - ${previewArtifact.language}` : ""}</span>
                </div>
                <div className="dashboard-preview__actions">
                  <button type="button" onClick={() => handleDownloadArtifact(previewArtifact.id)}>
                    <Download size={15} />
                    <span>Download</span>
                  </button>
                  <button type="button" onClick={() => setPreviewArtifact(null)}>
                    Close
                  </button>
                </div>
              </div>
              <pre className="dashboard-preview__content">{previewArtifact.content}</pre>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
