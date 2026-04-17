import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Cable, ChevronLeft, CreditCard, FlaskConical, Home, LogOut, Settings, Sparkles, Users } from "lucide-react";

const navItems = [
  { label: "Overview", to: "/dashboard/overview", icon: Home, accent: "blue" },
  { label: "Wishing Engine", to: "/dashboard/chat", icon: Sparkles, accent: "violet" },
  { label: "Connect Computer", to: "/dashboard/connect", icon: Cable, accent: "amber" },
  { label: "Koi", to: "/dashboard/overview", icon: FlaskConical, accent: "slate" },
  { label: "Team", to: "/dashboard/team", icon: Users, accent: "rose" },
  { label: "Billing", to: "/dashboard/billing", icon: CreditCard, accent: "amber" },
  { label: "Settings", to: "/dashboard/settings", icon: Settings, accent: "blue" }
];

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("skykoi_auth_user") || "null");
  } catch {
    return null;
  }
}

function getDisplayName(user) {
  if (user?.name?.trim()) {
    return user.name.trim();
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "SkyKoi User";
}

function accentClass(accent, isActive) {
  if (!isActive) {
    return "dashboard-nav__item";
  }

  return `dashboard-nav__item dashboard-nav__item--${accent}`;
}

export default function DashboardShell({ children }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const displayName = getDisplayName(user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("skykoi_auth");
    localStorage.removeItem("skykoi_auth_token");
    localStorage.removeItem("skykoi_auth_user");
    navigate("/login");
  }

  return (
    <div className="dashboard-app">
      <div className="dashboard-mobilebar">
        <button
          className="dashboard-sidebar__ghost"
          type="button"
          aria-label="Open navigation"
          onClick={() => setIsSidebarOpen(true)}
        >
          <ChevronLeft size={14} />
        </button>
        <Link className="dashboard-brand" to="/dashboard/overview">
          <img alt="SkyKoi" className="dashboard-brand__logo" src="/skykoi-logo-white.png" />
          <span>SKYKOI</span>
        </Link>
      </div>

      <button
        className={`dashboard-sidebar__scrim ${isSidebarOpen ? "is-open" : ""}`}
        type="button"
        aria-label="Close navigation"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`dashboard-sidebar ${isSidebarOpen ? "is-open" : ""}`}>
        <div className="dashboard-sidebar__brand">
          <Link className="dashboard-brand" to="/dashboard/overview">
            <img alt="SkyKoi" className="dashboard-brand__logo" src="/skykoi-logo-white.png" />
            <span>SKYKOI</span>
          </Link>
          <button
            className="dashboard-sidebar__ghost"
            type="button"
            aria-label="Collapse sidebar"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="dashboard-workspace">
          <div className="dashboard-workspace__badge">P</div>
          <div className="dashboard-workspace__copy">
            <div className="dashboard-workspace__name">Personal</div>
          </div>
          <div className="dashboard-workspace__plan">Free</div>
        </div>

        <nav className="dashboard-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => accentClass(item.accent, isActive)}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="dashboard-sidebar__footer">
          <div className="dashboard-user">
            <div className="dashboard-user__avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            <div className="dashboard-user__copy">
              <div className="dashboard-user__name">{displayName}</div>
            </div>
            <button className="dashboard-sidebar__ghost" type="button" onClick={handleLogout} aria-label="Log out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
