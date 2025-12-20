Deployment checklist for SurveyIA

1) Environment variables (Render / production):
   - CLOUDFLARE_TOKEN: Cloudflare API token with AI permissions.
   - CLOUDFLARE_ACCOUNT_ID: Cloudflare account id used for AI endpoints.
   - VITE_GOOGLE_CLIENT_ID (if using Google Sign-In)

2) Cloudflare permissions:
   - Ensure the token can call `/accounts/{account}/ai/run/*` and has access to tools you enable (web_search, vision, etc.).

3) Server start (production):
   - Use `tsx server/prod.ts` or `node` with compiled JS. Ensure `NODE_ENV=production`.

4) Health checks:
   - GET /api/survey/models should return available model status.
   - POST /api/auth/session should return 401 for unauthenticated requests.

5) Streaming behavior:
   - SSE endpoint: POST /api/survey/generate/stream
   - Ensure the reverse proxy (Render) preserves `Connection: keep-alive` and doesn't buffer SSE responses.

6) Rate limits:
   - If Cloudflare returns 429, the server will retry a few times; monitor logs and set alerting on repeated 429s.

7) Security:
   - Do not expose `CLOUDFLARE_TOKEN` in client code or logs.
   - Use HTTPS in production.

8) Post-deploy checks:
   - Run `node script/e2e-check.js` from the host (or locally targeting the deployed URL) to perform quick smoke tests.

9) Troubleshooting:
   - Check server logs for Cloudflare errors and `RATE_LIMIT` code.
   - If streaming doesn't appear, ensure proxy isn't buffering and that the deployed instance supports streaming responses.

