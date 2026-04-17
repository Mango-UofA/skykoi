import crypto from "crypto";

const TOKEN_VERSION = "v1";
const PASSWORD_KEY_LENGTH = 64;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = String(passwordHash || "").split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedKey, "hex");

  return storedBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedBuffer, derivedKey);
}

export function signAuthToken(payload, secret, expiresInDays = 7) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp, ver: TOKEN_VERSION }));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.${signature}`;
}

export function verifyAuthToken(token, secret) {
  const [header, body, signature] = String(token || "").split(".");

  if (!header || !body || !signature) {
    throw new Error("Invalid token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error("Invalid token");
  }

  const payload = JSON.parse(base64UrlDecode(body));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}
