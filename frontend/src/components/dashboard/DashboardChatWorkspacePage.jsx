import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Download, EyeOff, FileText, Info, Mic, Paperclip, Phone, Send, Sparkles } from "lucide-react";

import { getDashboardArtifact, getDashboardChat, sendDashboardMessage } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

const HERO_ASCII = "SKYKOI";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

function formatTime(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function hasActiveRun(runs) {
  return runs.some((run) => run.status === "queued" || run.status === "running");
}

function getStatusLabel(run) {
  return `${run.status} - ${run.progress || 0}%`;
}

function formatMessageBlocks(content) {
  return String(content || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function getArtifactStorageLabel(artifact) {
  return artifact.storage?.provider === "s3" ? "Stored in S3" : "Stored in workspace";
}

export default function DashboardChatWorkspacePage() {
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

  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0] || null;
  const selectedArtifacts = selectedRun ? artifacts.filter((artifact) => artifact.runId === selectedRun.id) : [];
  const visibleArtifacts = selectedArtifacts.length ? selectedArtifacts : artifacts;

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--chat dashboard-page--chat-workspace">
        <div className="dashboard-chat__topbar">
          <div className="dashboard-chat__identity">
            <div className="dashboard-chat__identity-icon">
              <Bot size={18} />
            </div>
            <div>
              <div className="dashboard-chat__identity-name">{workspace?.koiName || "Koi"}</div>
              <div className="dashboard-chat__identity-status">
                <span className="dashboard-koi-card__status-dot" />
                <span>Online</span>
              </div>
            </div>
          </div>

          <div className="dashboard-chat__actions">
            <button className="dashboard-chat__action" type="button" aria-label="Voice Call">
              <Phone size={16} />
            </button>
            <button className="dashboard-chat__action" type="button" aria-label="Info">
              <Info size={16} />
            </button>
            <button className="dashboard-chat__action" type="button" aria-label="Chat Style">
              <Sparkles size={16} />
            </button>
            <button className="dashboard-chat__action" type="button" aria-label="Verbose Mode">
              <EyeOff size={16} />
            </button>
          </div>
        </div>

        <div className="dashboard-chat__stream">
          <div className="dashboard-chat__layout">
            <section ref={scrollRef} className="dashboard-chat__main">
              {messages.length <= 1 ? (
                <div className="dashboard-chat__hero">
                  <pre className="dashboard-chat__ascii">{HERO_ASCII}</pre>
                  <div className="dashboard-chat__hero-label">WISHING ENGINE</div>
                  <div className="dashboard-chat__hero-sub">Ask for code, research, planning, content, analysis, or execution steps.</div>
                </div>
              ) : null}

              <div className="dashboard-chat__messages">
                {messages.map((message) => (
                  <article key={message.id} className={`dashboard-message dashboard-message--${message.role}`}>
                    <div className="dashboard-message__meta">
                      <span>{message.role === "assistant" ? "Koi" : "You"}</span>
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                    <div className="dashboard-message__body">
                      {formatMessageBlocks(message.content).map((block, index) => (
                        <p key={`${message.id}-${index}`}>{block}</p>
                      ))}
                    </div>
                  </article>
                ))}

                {isSending ? (
                  <article className="dashboard-message dashboard-message--assistant">
                    <div className="dashboard-message__meta">
                      <span>Koi</span>
                      <span>queued...</span>
                    </div>
                    <div className="dashboard-message__body">
                      <p>Creating a run and starting the wish workflow...</p>
                    </div>
                  </article>
                ) : null}
              </div>
            </section>

            <aside className="dashboard-chat__sidebar">
              <section className="dashboard-chat__workbench dashboard-chat__workbench--compact">
                <div className="dashboard-chat__section-title">Workspace Status</div>
                <div className="dashboard-chat__status-card">
                  <div className="dashboard-chat__status-row">
                    <span className="dashboard-chat__pill dashboard-chat__pill--violet">{workspace?.queuedLabel || "Queued"}</span>
                    <span className="dashboard-chat__pill dashboard-chat__pill--cyan">{workspace?.modeLabel || "Smart"}</span>
                  </div>
                  <div className="dashboard-chat__status-note">
                    {selectedRun ? `Tracking ${selectedRun.title.toLowerCase()}` : "Ready for the next wish."}
                  </div>
                </div>
              </section>

              {selectedRun ? (
                <section className="dashboard-chat__workbench dashboard-chat__workbench--compact">
                  <div className="dashboard-chat__section-title">Run Detail</div>
                  <div className="dashboard-run-detail">
                    <div className="dashboard-run-detail__summary">
                      <strong>{selectedRun.title}</strong>
                      <span>{selectedRun.prompt}</span>
                    </div>
                    <div className="dashboard-run-detail__meta">
                      <span>{getStatusLabel(selectedRun)}</span>
                      <span>{selectedRun.provider}</span>
                    </div>
                    {selectedRun.logs?.length ? (
                      <div className="dashboard-run-detail__timeline">
                        {selectedRun.logs.map((log, index) => (
                          <div key={`${selectedRun.id}-detail-log-${index}`} className={`dashboard-run-detail__event dashboard-run-detail__event--${log.tone || "neutral"}`}>
                            <span className="dashboard-run-detail__event-dot" />
                            <div className="dashboard-run-detail__event-copy">
                              <strong>{log.label}</strong>
                              {log.detail ? <span>{log.detail}</span> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {runs.length ? (
                <section className="dashboard-chat__workbench dashboard-chat__workbench--compact">
                  <div className="dashboard-chat__section-title">Recent Runs</div>
                  <div className="dashboard-chat__runs">
                    {runs.map((run) => (
                      <article
                        key={run.id}
                        className={`dashboard-run-card ${selectedRun?.id === run.id ? "dashboard-run-card--active" : ""}`}
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <div className="dashboard-run-card__head">
                          <strong>{run.title}</strong>
                          <span className={`dashboard-run-card__status dashboard-run-card__status--${run.status}`}>
                            {getStatusLabel(run)}
                          </span>
                        </div>
                        <div className="dashboard-run-card__prompt">{run.prompt}</div>
                        {run.steps?.length ? (
                          <div className="dashboard-run-card__steps">
                            {run.steps.map((step) => (
                              <div key={`${run.id}-${step.label}`} className={`dashboard-run-card__step dashboard-run-card__step--${step.status}`}>
                                <span className="dashboard-run-card__step-dot" />
                                <span>{step.label}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="dashboard-run-card__meta">
                          <span>{run.provider}</span>
                          <span>{formatTime(run.createdAt)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {visibleArtifacts.length ? (
                <section className="dashboard-chat__workbench dashboard-chat__workbench--compact">
                  <div className="dashboard-chat__section-title">
                    {selectedRun ? "Selected Run Outputs" : "Generated Outputs"}
                  </div>
                  <div className="dashboard-chat__artifacts">
                    {visibleArtifacts.map((artifact) => (
                      <article key={artifact.id} className="dashboard-artifact-card">
                        <div className="dashboard-artifact-card__icon">
                          <FileText size={16} />
                        </div>
                        <div className="dashboard-artifact-card__copy">
                          <strong>{artifact.title}</strong>
                          <span>{artifact.preview}</span>
                          <span className="dashboard-artifact-card__storage">{getArtifactStorageLabel(artifact)}</span>
                        </div>
                        <div className="dashboard-artifact-card__actions">
                          <button
                            className="dashboard-artifact-card__action"
                            type="button"
                            onClick={() => handlePreviewArtifact(artifact.id)}
                          >
                            <FileText size={15} />
                            <span>Preview</span>
                          </button>
                          <button
                            className="dashboard-artifact-card__action"
                            type="button"
                            onClick={() => handleDownloadArtifact(artifact.id)}
                          >
                            <Download size={15} />
                            <span>Download</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>

        <form className="dashboard-composer" onSubmit={handleSubmit}>
          <button className="dashboard-composer__icon" type="button" aria-label="Attach file">
            <Paperclip size={16} />
          </button>
          <div className="dashboard-composer__field">
            <span className="dashboard-composer__prompt">wish &gt;</span>
            <textarea
              rows={1}
              placeholder="Ask for code, content, planning, analysis, or a build sequence..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </div>
          <button className="dashboard-composer__icon" type="button" aria-label="Voice input">
            <Mic size={16} />
          </button>
          <button className="dashboard-composer__send" disabled={isSending || !draft.trim()} type="submit" aria-label="Send">
            <Send size={16} />
          </button>
        </form>

        {error ? <div className="dashboard-state dashboard-state--inline">{error}</div> : null}

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
