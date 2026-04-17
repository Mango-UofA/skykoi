import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Info, Mic, Paperclip, Phone, Send, Sparkles, EyeOff } from "lucide-react";

import { getDashboardChat, sendDashboardMessage } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

function formatTime(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function DashboardChatPage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [workspace, setWorkspace] = useState(null);
  const [messages, setMessages] = useState([]);
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
      setMessages(data.messages);
    } catch {
      setError("Your wish could not be processed right now.");
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--chat">
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
            <button className="dashboard-chat__action" type="button" aria-label="Voice Call"><Phone size={16} /></button>
            <button className="dashboard-chat__action" type="button" aria-label="Info"><Info size={16} /></button>
            <button className="dashboard-chat__action" type="button" aria-label="Chat Style"><Sparkles size={16} /></button>
            <button className="dashboard-chat__action" type="button" aria-label="Verbose Mode"><EyeOff size={16} /></button>
          </div>
        </div>

        <div ref={scrollRef} className="dashboard-chat__stream">
          {messages.length <= 1 ? (
            <div className="dashboard-chat__hero">
              <pre className="dashboard-chat__ascii">{`╔═╗ ╦╔═ ╦ ╦ ╦╔═ ╔═╗ ╦
╚═╗ ╠╩╗ ╚╦╝ ╠╩╗ ║ ║ ║
╚═╝ ╩ ╩  ╩  ╩ ╩ ╚═╝ ╩`}</pre>
              <div className="dashboard-chat__hero-label">WISHING ENGINE</div>
              <div className="dashboard-chat__hero-sub">Type a wish below to begin</div>
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
                  {message.content.split("\n").map((line, index) => (
                    <p key={`${message.id}-${index}`}>{line || "\u00A0"}</p>
                  ))}
                </div>
              </article>
            ))}

            {isSending ? (
              <article className="dashboard-message dashboard-message--assistant">
                <div className="dashboard-message__meta">
                  <span>Koi</span>
                  <span>thinking...</span>
                </div>
                <div className="dashboard-message__body">
                  <p>Working through the wish and updating workspace state...</p>
                </div>
              </article>
            ) : null}
          </div>
        </div>

        <div className="dashboard-chat__statusbar">
          <span className="dashboard-chat__pill dashboard-chat__pill--violet">{workspace?.queuedLabel || "Queued"}</span>
          <span className="dashboard-chat__pill dashboard-chat__pill--cyan">{workspace?.modeLabel || "Smart"}</span>
        </div>

        <form className="dashboard-composer" onSubmit={handleSubmit}>
          <button className="dashboard-composer__icon" type="button" aria-label="Attach file">
            <Paperclip size={16} />
          </button>
          <div className="dashboard-composer__field">
            <span className="dashboard-composer__prompt">wish ›</span>
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
      </div>
    </DashboardShell>
  );
}
