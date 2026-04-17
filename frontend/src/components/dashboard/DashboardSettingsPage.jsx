import { useEffect, useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDashboardSettings, resetDashboardMemory, updateDashboardSettings } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

const themes = [
  { value: "oled", label: "OLED Black", description: "Pure black for OLED displays.", preview: "linear-gradient(135deg,#000 0%,#050505 100%)" },
  { value: "onyx", label: "Onyx", description: "Warm near-black with subtle depth.", preview: "linear-gradient(135deg,#0b0b0d 0%,#131316 100%)" },
  { value: "graphite", label: "Graphite", description: "Soft charcoal for bright rooms.", preview: "linear-gradient(135deg,#18181b 0%,#232328 100%)" },
  { value: "midnight", label: "Midnight Slate", description: "Cool blue-tinged dark mode.", preview: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" },
  { value: "storm", label: "Storm", description: "Warm stone gray with a subtle brown cast.", preview: "linear-gradient(135deg,#1c1917 0%,#292524 100%)" },
  { value: "steel", label: "Steel", description: "Lighter gray for high-ambient rooms.", preview: "linear-gradient(135deg,#27272a 0%,#3f3f46 100%)" },
  { value: "white", label: "Pure White", description: "Bright daylight mode.", preview: "linear-gradient(135deg,#ffffff 0%,#f1f5f9 100%)" }
];

const accents = ["violet", "blue", "emerald", "rose", "amber", "cyan"];

export default function DashboardSettingsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardSettings(token)
      .then((response) => {
        setData(response);
        syncPreferences(response.settings);
      })
      .catch(() => {
        setStatus("Unable to load settings right now.");
      });
  }, [navigate]);

  function syncPreferences(settings) {
    localStorage.setItem(
      "skykoi_preferences",
      JSON.stringify({
        theme: settings.theme,
        accent: settings.accent,
        density: settings.density,
        timeFormat: settings.timeFormat,
        notifications: settings.notifications,
        reduceMotion: settings.reduceMotion
      })
    );
  }

  async function applyPatch(patch) {
    if (!data) {
      return;
    }

    const token = getToken();
    const next = { ...data.settings, ...patch };
    setData((current) => ({ ...current, settings: next }));
    syncPreferences(next);
    setStatus("Saving...");

    try {
      const saved = await updateDashboardSettings(token, next);
      setData(saved);
      syncPreferences(saved.settings);
      setStatus("Saved");
    } catch {
      setStatus("Unable to save settings.");
    }
  }

  async function handleResetMemory() {
    const token = getToken();
    setStatus("Resetting workspace memory...");

    try {
      await resetDashboardMemory(token);
      setStatus("Koi memory reset.");
    } catch {
      setStatus("Could not reset memory.");
    }
  }

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--settings">
        <div className="dashboard-page__head">
          <div>
            <h1 className="dashboard-page__title dashboard-page__title--settings">Settings</h1>
            <p className="dashboard-page__subtitle">Workspace, appearance, and account preferences.</p>
          </div>
          {status ? <div className="dashboard-refresh dashboard-refresh--plain">{status}</div> : null}
        </div>

        {data ? (
          <div className="dashboard-settings">
            <section className="dashboard-settings__section">
              <div className="dashboard-settings__label">PROFILE</div>
              <div className="dashboard-profile-card">
                <div className="dashboard-profile-card__avatar">
                  {(data.profile.name || "S").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="dashboard-profile-card__name">{data.profile.name}</div>
                  <div className="dashboard-profile-card__email">{data.profile.email}</div>
                  <div className="dashboard-profile-card__muted">
                    Profile is managed locally for this demo experience.
                  </div>
                </div>
              </div>
            </section>

            <section className="dashboard-settings__section">
              <div className="dashboard-settings__section-head">
                <div className="dashboard-settings__label">APPEARANCE</div>
                <div className="dashboard-settings__hint">Pick a tone that is easy on your eyes.</div>
              </div>

              <div className="dashboard-settings__panel">
                <div className="dashboard-settings__subhead">Theme</div>
                <div className="dashboard-theme-grid">
                  {themes.map((theme) => (
                    <button
                      key={theme.value}
                      className={`dashboard-theme-card ${data.settings.theme === theme.value ? "dashboard-theme-card--active" : ""}`}
                      type="button"
                      onClick={() => applyPatch({ theme: theme.value })}
                    >
                      <div className="dashboard-theme-card__preview" style={{ background: theme.preview }} />
                      <div className="dashboard-theme-card__title">{theme.label}</div>
                      <div className="dashboard-theme-card__description">{theme.description}</div>
                    </button>
                  ))}
                </div>

                <div className="dashboard-settings__subhead">Accent color</div>
                <div className="dashboard-accent-row">
                  {accents.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      className={`dashboard-accent dashboard-accent--${accent} ${data.settings.accent === accent ? "dashboard-accent--active" : ""}`}
                      onClick={() => applyPatch({ accent })}
                      aria-label={`Accent ${accent}`}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="dashboard-settings__section">
              <div className="dashboard-settings__label">PREFERENCES</div>
              <div className="dashboard-preferences">
                <div className="dashboard-preferences__row">
                  <div>
                    <div className="dashboard-preferences__title">Display density</div>
                    <div className="dashboard-preferences__copy">Tighten spacing for more content per screen.</div>
                  </div>
                  <div className="dashboard-segment">
                    <button type="button" className={data.settings.density === "comfortable" ? "is-active" : ""} onClick={() => applyPatch({ density: "comfortable" })}>Comfortable</button>
                    <button type="button" className={data.settings.density === "compact" ? "is-active" : ""} onClick={() => applyPatch({ density: "compact" })}>Compact</button>
                  </div>
                </div>

                <div className="dashboard-preferences__row">
                  <div>
                    <div className="dashboard-preferences__title">Time format</div>
                    <div className="dashboard-preferences__copy">How timestamps appear across the app.</div>
                  </div>
                  <div className="dashboard-segment">
                    <button type="button" className={data.settings.timeFormat === "12h" ? "is-active" : ""} onClick={() => applyPatch({ timeFormat: "12h" })}>12-hour</button>
                    <button type="button" className={data.settings.timeFormat === "24h" ? "is-active" : ""} onClick={() => applyPatch({ timeFormat: "24h" })}>24-hour</button>
                  </div>
                </div>

                <div className="dashboard-preferences__row">
                  <div>
                    <div className="dashboard-preferences__title">Desktop notifications</div>
                    <div className="dashboard-preferences__copy">Get notified when your Koi finishes a task.</div>
                  </div>
                  <button type="button" className={`dashboard-toggle ${data.settings.notifications ? "dashboard-toggle--on" : ""}`} onClick={() => applyPatch({ notifications: !data.settings.notifications })}>
                    <span />
                  </button>
                </div>

                <div className="dashboard-preferences__row">
                  <div>
                    <div className="dashboard-preferences__title">Reduce motion</div>
                    <div className="dashboard-preferences__copy">Disable transitions and decorative animations.</div>
                  </div>
                  <button type="button" className={`dashboard-toggle ${data.settings.reduceMotion ? "dashboard-toggle--on" : ""}`} onClick={() => applyPatch({ reduceMotion: !data.settings.reduceMotion })}>
                    <span />
                  </button>
                </div>
              </div>
            </section>

            <section className="dashboard-settings__section">
              <div className="dashboard-settings__label">EXPERIENCE MODE</div>
              <div className="dashboard-experience-grid">
                <button type="button" className={`dashboard-experience-card ${data.settings.experienceMode === "normal" ? "dashboard-experience-card--active" : ""}`} onClick={() => applyPatch({ experienceMode: "normal" })}>
                  <div className="dashboard-experience-card__head">
                    <span>Normal user</span>
                    <span className="dashboard-experience-card__tag">Simple</span>
                  </div>
                  <p>A clean, chat-first workspace with most of the complexity hidden.</p>
                </button>
                <button type="button" className={`dashboard-experience-card ${data.settings.experienceMode === "developer" ? "dashboard-experience-card--active dashboard-experience-card--developer" : ""}`} onClick={() => applyPatch({ experienceMode: "developer" })}>
                  <div className="dashboard-experience-card__head">
                    <span>Developer</span>
                    <span className="dashboard-experience-card__tag">Advanced</span>
                  </div>
                  <p>Keep the full SkyKoi-style control surface, navigation, settings depth, and system visibility.</p>
                </button>
              </div>
            </section>

            <section className="dashboard-settings__section">
              <div className="dashboard-settings__label">CONNECTED ACCOUNTS</div>
              <div className="dashboard-connected">
                <div className="dashboard-connected__head">
                  <h3>Connected Accounts</h3>
                  <button className="dashboard-button dashboard-button--ghost" type="button">
                    <Plus size={14} /> Add Account
                  </button>
                </div>
                <div className="dashboard-connected__empty">
                  <Shield size={24} />
                  <p>{data.aws?.connected ? "AWS account connected" : "No production accounts connected"}</p>
                  <span>
                    {data.aws?.connected
                      ? `Connected in ${data.aws.region}${data.aws.accountId ? ` under account ${data.aws.accountId}` : ""}.`
                      : "This demo keeps integrations disabled so you can present the UX without spending money."}
                  </span>
                </div>
                <div className="dashboard-connected__list">
                  {data.connectedAccounts.map((account) => (
                    <div
                      key={account.provider}
                      className={`dashboard-connected__item ${
                        account.status === "connected" ? "dashboard-connected__item--connected" : ""
                      }`}
                    >
                      <strong>{account.provider}</strong>
                      <span>{account.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="dashboard-settings__section">
              <div className="dashboard-settings__label">DANGER ZONE</div>
              <div className="dashboard-danger">
                <div className="dashboard-danger__row">
                  <div>
                    <div className="dashboard-preferences__title">Reset Koi memory</div>
                    <div className="dashboard-preferences__copy">Clear all conversation history and demo context.</div>
                  </div>
                  <button className="dashboard-danger__button" type="button" onClick={handleResetMemory}>Reset memory</button>
                </div>
                <div className="dashboard-danger__row">
                  <div>
                    <div className="dashboard-preferences__title">Delete account</div>
                    <div className="dashboard-preferences__copy">Reserved for a later backend pass. Disabled in the demo.</div>
                  </div>
                  <button className="dashboard-danger__button dashboard-danger__button--soft" type="button" disabled>
                    <Trash2 size={14} /> Delete account
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="dashboard-state">Loading settings...</div>
        )}
      </div>
    </DashboardShell>
  );
}
