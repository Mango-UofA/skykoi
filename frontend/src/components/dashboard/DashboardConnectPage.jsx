import { useEffect, useState } from "react";
import { Eye, Lock, Monitor, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDashboardConnect } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

export default function DashboardConnectPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardConnect(token)
      .then(setData)
      .catch(() => {
        setError("Unable to load machine connection details.");
      });
  }, [navigate]);

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--connect">
        <div className="dashboard-page__head dashboard-page__head--compact dashboard-page__head--connect">
          <div>
            <h1 className="dashboard-page__title dashboard-page__title--connect">Connect Computer</h1>
            <p className="dashboard-page__subtitle">One command, one approval.</p>
          </div>
          <button className="dashboard-connect__refresh" type="button" aria-label="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>

        {error ? <div className="dashboard-state">{error}</div> : null}

        {data ? (
          <div className="dashboard-connect">
            <div className="dashboard-settings__label">YOUR MACHINES <span className="dashboard-section-accent">1 ONLINE</span></div>

            <section className="dashboard-connect__machine">
              <div className="dashboard-connect__machine-left">
                <div className="dashboard-connect__machine-icon">
                  <Monitor size={18} />
                </div>
                <div>
                  <div className="dashboard-connect__machine-title">{data.machine.label}</div>
                  <div className="dashboard-connect__machine-copy">{data.machine.os}</div>
                  {data.aws?.connected ? (
                    <div className="dashboard-connect__machine-copy">
                      Account {data.aws.accountId} · {data.aws.region}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="dashboard-connect__machine-status">
                <span className="dashboard-koi-card__status-dot" />
                <span>{data.machine.connected ? "Connected" : "Offline"}</span>
              </div>
            </section>

            <div className="dashboard-connect__tabs">
              {data.tabs.map((tab, index) => (
                <button key={tab} type="button" className={`dashboard-connect__tab ${index === 0 ? "is-active" : ""}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="dashboard-connect__platforms">
              {data.platforms.map((platform, index) => (
                <button key={platform} type="button" className={`dashboard-connect__platform ${index === 0 ? "is-active" : ""}`}>
                  {platform}
                </button>
              ))}
            </div>

            <section className="dashboard-terminal-card">
              <div className="dashboard-terminal-card__bar">
                <div className="dashboard-terminal-card__lights">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="dashboard-terminal-card__title">PWSH - SKYKOI</div>
                <div className="dashboard-terminal-card__tools">
                  <span>ENCRYPTED</span>
                  <Eye size={14} />
                </div>
              </div>

              <div className="dashboard-terminal-card__body">
                <pre>{`SKYKOI
███████╗██╗  ██╗██╗   ██╗██╗
██╔════╝██║ ██╔╝╚██╗ ██╔╝██║
███████╗█████╔╝  ╚████╔╝ ██║
╚════██║██╔═██╗   ╚██╔╝  ██║
███████║██║  ██╗   ██║   ██║
╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝`}</pre>
                <div className="dashboard-terminal-card__glyphs">&gt; click eye icon to decrypt payload</div>
              </div>

              <div className="dashboard-terminal-card__foot">
                <span>SECURE CHANNEL</span>
                <span>AES-256</span>
                <span>Koi</span>
              </div>
            </section>

            <div className="dashboard-connect__caption">
              <Lock size={14} />
              <span>Contains your koi credentials. Copy it, paste it in your terminal, and do not share it.</span>
            </div>

            <div className="dashboard-settings__label">FAQ</div>
            <div className="dashboard-faq">
              {data.faq.map((item, index) => (
                <button
                  key={item.question}
                  type="button"
                  className={`dashboard-faq__item ${openFaq === index ? "is-open" : ""}`}
                  onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                >
                  <div className="dashboard-faq__question">
                    <span>{item.question}</span>
                    <span>{openFaq === index ? "−" : "+"}</span>
                  </div>
                  {openFaq === index ? <div className="dashboard-faq__answer">{item.answer}</div> : null}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="dashboard-state">Loading connection details...</div>
        )}
      </div>
    </DashboardShell>
  );
}
