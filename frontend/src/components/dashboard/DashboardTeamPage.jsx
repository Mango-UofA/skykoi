import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDashboardTeam } from "../../api.js";
import DashboardShell from "./DashboardShell.jsx";

function getToken() {
  return localStorage.getItem("skykoi_auth_token") || "";
}

export default function DashboardTeamPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    getDashboardTeam(token)
      .then(setData)
      .catch(() => {
        setError("Unable to load team members.");
      });
  }, [navigate]);

  return (
    <DashboardShell>
      <div className="dashboard-page dashboard-page--team">
        <div className="dashboard-page__head dashboard-page__head--team">
          <div>
            <h1 className="dashboard-page__title dashboard-page__title--team">Team</h1>
            <p className="dashboard-page__subtitle">Manage workspace access.</p>
          </div>
          <button className="dashboard-invite">
            <Plus size={14} />
            <span>Invite</span>
          </button>
        </div>

        {error ? <div className="dashboard-state">{error}</div> : null}

        {data ? (
          <div className="dashboard-team">
            <div className="dashboard-settings__label">MEMBERS {data.members.length}</div>
            <div className="dashboard-team__list">
              {data.members.map((member) => (
                <div key={member.id} className="dashboard-team__item">
                  <div className="dashboard-team__member">
                    <div className="dashboard-team__avatar">{member.initials}</div>
                    <div className="dashboard-team__copy">
                      <strong>{member.email}</strong>
                    </div>
                  </div>
                  <div className="dashboard-team__meta">
                    <span className="dashboard-team__role">{member.role}</span>
                    <span>{member.joinedLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="dashboard-state">Loading team...</div>
        )}
      </div>
    </DashboardShell>
  );
}
