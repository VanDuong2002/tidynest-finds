#!/usr/bin/env node
/**
 * One-time helper to get a YouTube Data API v3 Refresh Token for GitHub Actions Cloud Autopilot.
 * Usage:
 *   node scripts/get-youtube-token.mjs <CLIENT_ID> <CLIENT_SECRET>
 */
import http from "node:http";
import { URL } from "node:url";

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error("Usage: node scripts/get-youtube-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:4389/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\n1) Open this URL in your browser and authorize your TidyNest Finds YouTube channel:\n");
console.log(authUrl.toString());
console.log("\nWaiting on http://localhost:4389/oauth2callback ...");

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || "/", "http://localhost:4389");
  if (parsed.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const code = parsed.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Missing code parameter");
    return;
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await tokenRes.json();

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h2>Done! You can close this tab and copy your YOUTUBE_REFRESH_TOKEN from the terminal.</h2>");

  console.log("\n=== COPY THIS INTO GITHUB SECRETS (YOUTUBE_REFRESH_TOKEN) ===\n");
  console.log(data.refresh_token || JSON.stringify(data, null, 2));
  console.log("\n=============================================================\n");
  server.close();
});

server.listen(4389);
