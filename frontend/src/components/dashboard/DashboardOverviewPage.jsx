import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, CircleDollarSign, Clock3, Cpu, MessageSquare, Rocket, Search, Settings2 } from "lucide-react";

import { getDashboardOverview } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

const toneClassMap = {
  emerald: "dashboard-activity__icon--emerald",
  violet: "dashboard-activity__icon--violet",
  cyan: "dashboard-activity__icon--cyan",
  amber: "dashboard-activity__icon--amber",
  rose: "dashboard-activity__icon--rose",
  blue: "dashboard-activity__icon--blue"
};

export default function DashboardOverviewPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardOverview(token)
      .then((data) => {
        setOverview(data.overview);
      })
      .catch(() => {
        setError("Unable to load dashboard overview right now.");
      });
  }, [navigate]);

  const fleet = overview?.fleet;
  const koi = overview?.koi;

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--overview">
        <div className="dashboard-page__head">
          <div>
            <h1 className="dashboard-page__title">SKYKOI FLEET</h1>
            <p className="dashboard-page__subtitle">
              {fleet && koi ? `1 Koi, ${fleet.live} live, $${koi.sessionCost.toFixed(2)}/hr` : "Loading fleet status..."}
            </p>
            {overview?.cloud ? (
              <div className="dashboard-page__cloud">
                <span className={`dashboard-page__cloud-dot ${overview.cloud.connected ? "is-online" : ""}`} />
                <span>
                  {overview.cloud.connected
                    ? `AWS connected · ${overview.cloud.region}${overview.cloud.accountId ? ` · ${overview.cloud.accountId}` : ""}`
                    : "AWS not connected"}
                </span>
              </div>
            ) : null}
          </div>
          <div className="dashboard-refresh">
            <span className="dashboard-refresh__dot" />
            <span>3s</span>
            <span className="dashboard-refresh__muted">Updated just now</span>
          </div>
        </div>

        {error ? <div className="dashboard-state">{error}</div> : null}

        {overview ? (
          <>
            <div className="dashboard-statbar">
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">KOIS</div>
                <div className="dashboard-statbar__value">{fleet.koiCount}</div>
              </div>
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">LIVE</div>
                <div className="dashboard-statbar__value dashboard-statbar__value--emerald">{fleet.live}</div>
              </div>
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">SLEEPING</div>
                <div className="dashboard-statbar__value dashboard-statbar__value--amber">{fleet.sleeping}</div>
              </div>
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">DOWN</div>
                <div className="dashboard-statbar__value dashboard-statbar__value--rose">{fleet.down}</div>
              </div>
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">COST / MO</div>
                <div className="dashboard-statbar__value dashboard-statbar__value--violet">${fleet.monthCost.toFixed(2)}</div>
              </div>
              <div className="dashboard-statbar__item">
                <div className="dashboard-statbar__label">UPTIME</div>
                <div className="dashboard-statbar__value">{fleet.uptimeHours}h</div>
              </div>
            </div>

            <div className="dashboard-overview__toolbar">
              <div className="dashboard-overview__search">
                <Search size={14} />
                <span>Search... (/)</span>
              </div>
              <button className="dashboard-overview__filter" type="button">
                All States
              </button>
            </div>

            <div className="dashboard-koi-card">
              <div className="dashboard-koi-card__top">
                <div>
                  <div className="dashboard-koi-card__heading">
                    <span className="dashboard-koi-card__status-dot" />
                    <span>{koi.name}</span>
                    <span className="dashboard-tag">FREE</span>
                    <span className="dashboard-koi-card__online">Online</span>
                    <span className="dashboard-koi-card__muted">{koi.uptimeLabel}</span>
                  </div>
                  <div className="dashboard-koi-card__sub">{koi.userHandle}</div>
                </div>

                <div className="dashboard-koi-card__actions">
                  <Link className="dashboard-button dashboard-button--primary" to="/dashboard/chat">
                    Chat
                  </Link>
                  <button className="dashboard-button dashboard-button--ghost" type="button">
                    Stop
                  </button>
                </div>
              </div>

              <div className="dashboard-resource">
                <span>RAM</span>
                <div className="dashboard-meter">
                  <div className="dashboard-meter__fill dashboard-meter__fill--emerald" style={{ width: `${koi.resources.ramPercent}%` }} />
                </div>
                <strong className="dashboard-resource__value dashboard-resource__value--emerald">{koi.resources.ramPercent}%</strong>
                <small>{koi.resources.ramUsedGb}/{koi.resources.ramTotalGb} GB</small>
              </div>

              <div className="dashboard-resource">
                <span>Disk</span>
                <div className="dashboard-meter">
                  <div className="dashboard-meter__fill dashboard-meter__fill--amber" style={{ width: `${koi.resources.diskPercent}%` }} />
                </div>
                <strong className="dashboard-resource__value dashboard-resource__value--amber">{koi.resources.diskPercent}%</strong>
                <small>{koi.resources.diskUsedGb}/{koi.resources.diskTotalGb} GB</small>
              </div>

              <div className="dashboard-resource">
                <span>GPU</span>
                <div className="dashboard-meter dashboard-meter--ghost" />
                <strong className="dashboard-resource__value">-</strong>
                <small>No GPU</small>
              </div>

              <div className="dashboard-resource">
                <span>VRAM</span>
                <div className="dashboard-meter dashboard-meter--ghost" />
                <strong className="dashboard-resource__value">-</strong>
                <small>N/A</small>
              </div>

              <div className="dashboard-resource">
                <span>Net</span>
                <div className="dashboard-meter dashboard-meter--net">
                  <div className="dashboard-meter__fill dashboard-meter__fill--blue" style={{ width: "43%" }} />
                  <div className="dashboard-meter__fill dashboard-meter__fill--amber dashboard-meter__fill--overlay" style={{ width: "48%" }} />
                </div>
                <strong className="dashboard-resource__value dashboard-resource__value--blue">0 KB/s</strong>
                <small>0 KB</small>
              </div>

              <div className="dashboard-koi-card__foot">
                <div className="dashboard-koi-card__meta">
                  <span><CircleDollarSign size={12} /> ${koi.sessionCost.toFixed(2)}</span>
                  <span><Clock3 size={12} /> {koi.uptimeLabel}</span>
                  <span><MessageSquare size={12} /> {koi.lastMessageLabel}</span>
                  <span><Cpu size={12} /> {koi.instanceType} {koi.runtimeVersion}</span>
                </div>
                <div className="dashboard-koi-card__presence">
                  <span className="dashboard-koi-card__status-dot" />
                  <span>Online</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <section className="dashboard-panel">
                <div className="dashboard-panel__label">RECENT ACTIVITY</div>
                <div className="dashboard-panel__header">
                  <Activity size={15} />
                  <h3>Recent Activity</h3>
                </div>
                <div className="dashboard-activity">
                  {overview.recentActivity.map((item) => (
                    <div key={item.id} className="dashboard-activity__item">
                      <div className={`dashboard-activity__icon ${toneClassMap[item.tone] || ""}`}>
                        {item.kind === "deploy" ? <Rocket size={14} /> : item.kind === "settings" ? <Settings2 size={14} /> : <Activity size={14} />}
                      </div>
                      <div className="dashboard-activity__copy">
                        <div className="dashboard-activity__title">{item.title}</div>
                        <div className="dashboard-activity__meta">
                          <span>{item.kind.toUpperCase()}</span>
                          <span>{item.ageLabel}</span>
                        </div>
                        {item.detail ? <div className="dashboard-activity__detail">{item.detail}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="dashboard-panel__label">QUICK LINKS</div>
                <div className="dashboard-links">
                  {overview.quickLinks.map((link) => (
                    <Link key={link.href} className="dashboard-links__item" to={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="dashboard-state">Loading overview...</div>
        )}
      </div>
    </DashboardShell>
  );
}
