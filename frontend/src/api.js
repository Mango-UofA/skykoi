import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}

export async function getHomeContent() {
  const { data } = await api.get("/content/home");
  return data;
}

export async function createLead(payload) {
  const { data } = await api.post("/leads", payload);
  return data;
}

export async function signupUser(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getCurrentUser(token) {
  const { data } = await api.get("/auth/me", authHeaders(token));

  return data;
}

export async function getDashboardOverview(token) {
  const { data } = await api.get("/dashboard/overview", authHeaders(token));
  return data;
}

export async function getDashboardChat(token) {
  const { data } = await api.get("/dashboard/chat", authHeaders(token));
  return data;
}

export async function sendDashboardMessage(token, content) {
  const { data } = await api.post("/dashboard/chat/messages", { content }, authHeaders(token));
  return data;
}

export async function getDashboardArtifact(token, artifactId) {
  const { data } = await api.get(`/dashboard/chat/artifacts/${artifactId}`, authHeaders(token));
  return data;
}

export async function resetDashboardMemory(token) {
  const { data } = await api.post("/dashboard/chat/reset", {}, authHeaders(token));
  return data;
}

export async function getDashboardSettings(token) {
  const { data } = await api.get("/dashboard/settings", authHeaders(token));
  return data;
}

export async function updateDashboardSettings(token, payload) {
  const { data } = await api.patch("/dashboard/settings", payload, authHeaders(token));
  return data;
}

export async function getDashboardConnect(token) {
  const { data } = await api.get("/dashboard/connect", authHeaders(token));
  return data;
}

export async function getDashboardTeam(token) {
  const { data } = await api.get("/dashboard/team", authHeaders(token));
  return data;
}

export async function getDashboardBilling(token) {
  const { data } = await api.get("/dashboard/billing", authHeaders(token));
  return data;
}
