import { useEffect, useState } from "react";
import { ChevronRight, Code2, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDashboardBilling } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

const usageIconMap = {
  Tokens: Code2,
  Voice: Mic,
  "API Requests": ChevronRight
};

export default function DashboardBillingPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardBilling(token)
      .then(setData)
      .catch(() => {
        setError("Unable to load billing right now.");
      });
  }, [navigate]);

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--billing">
        <div className="dashboard-page__head dashboard-page__head--compact">
          <div>
            <h1 className="dashboard-page__title dashboard-page__title--billing">Billing</h1>
            <p className="dashboard-page__subtitle">Manage your plan and payment.</p>
          </div>
        </div>

        {error ? <div className="dashboard-state">{error}</div> : null}

        {data ? (
          <div className="dashboard-billing">
            <div className="dashboard-settings__label">CURRENT PLAN</div>
            <section className="dashboard-billing__current">
                <div className="dashboard-billing__current-left">
                  <div className="dashboard-billing__current-icon">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <div className="dashboard-billing__current-name">
                      {data.currentPlan.name} <span>{data.currentPlan.priceLabel}</span>
                    </div>
                    <div className="dashboard-billing__current-status">
                      <span className="dashboard-koi-card__status-dot" />
                      <span>{data.currentPlan.status}</span>
                    </div>
                  </div>
                </div>
              <button type="button" className="dashboard-button dashboard-button--ghost" disabled>
                Manage on Stripe
              </button>
            </section>

            <div className="dashboard-settings__label">PLANS</div>
            <div className="dashboard-billing__plans">
              {data.plans.map((plan) => (
                <section key={plan.name} className="dashboard-plan-card">
                  <div className="dashboard-plan-card__name">{plan.name}</div>
                  <div className="dashboard-plan-card__desc">{plan.description}</div>
                  <div className="dashboard-plan-card__price">
                    {plan.priceLabel}<span>{plan.cadence}</span>
                  </div>
                  <div className="dashboard-plan-card__features">
                    {plan.features.map((feature) => (
                      <div key={feature} className="dashboard-plan-card__feature">
                        <span>+</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="dashboard-button dashboard-button--primary">
                    Upgrade
                  </button>
                </section>
              ))}
            </div>

            <div className="dashboard-settings__section-head">
              <div className="dashboard-settings__label">USAGE</div>
              <div className="dashboard-settings__hint">Mar 31 - Apr 16</div>
            </div>
            <div className="dashboard-usage">
              {data.usage.map((item) => {
                const Icon = usageIconMap[item.label] || ChevronRight;

                return (
                  <div key={item.label} className="dashboard-usage__item">
                    <div className="dashboard-usage__label">
                      <div className="dashboard-usage__icon">
                        <Icon size={15} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <div className="dashboard-usage__value">
                      {item.value}
                      {item.suffix ? <span>{item.suffix}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-settings__label">YOUR KOI</div>
            <section className="dashboard-billing__koi">
              <div className="dashboard-billing__koi-left">
                <div className="dashboard-billing__koi-avatar">K</div>
                <div>
                  <div className="dashboard-billing__koi-name">{data.koi.name}</div>
                  <div className="dashboard-billing__koi-status">{data.koi.status}</div>
                </div>
              </div>
              <div className="dashboard-tag">{data.koi.tier}</div>
            </section>
          </div>
        ) : (
          <div className="dashboard-state">Loading billing...</div>
        )}
      </div>
    </DashboardShell>
  );
}
