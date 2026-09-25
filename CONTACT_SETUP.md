# LUMIRIZE contact delivery

The public site is `https://lumirize-v2.vercel.app/`. The four pages remain build-free HTML, CSS and JavaScript. `api/contact.js` is a Vercel Node.js function. GitHub Pages cannot run this endpoint and will retain the email-app fallback.

## Current activation state

Online delivery is deliberately inactive until a delivery provider and production settings are configured. `GET /api/contact` returns only `{ "available": false }` when configuration is incomplete. Visitors can still use the clearly labelled email-app form or the telephone link. No success is shown for an unconfigured provider.

## Production configuration

Use a company-controlled Resend account and verified sender domain. Set the following server-side variables in the intended Vercel project; never place values in HTML, JavaScript delivered to the browser, source control, or chat:

- `RESEND_API_KEY`: a sending key restricted to the verified sender domain.
- `CONTACT_FROM`: the verified sender email address, without a display name.
- `CONTACT_ENABLED`: set to `true` only after the delivery setup and operational checks are complete.
- `CONTACT_ALLOWED_ORIGINS`: optional comma-separated additional HTTPS origins when an approved custom domain is connected. The current Vercel production origin is already allowed. Do not use wildcards.

The recipient is fixed to `info@lumirize.com`. A visitor address is used only as Reply-To; no automatic email is sent to arbitrary visitor addresses. A successful API response means the delivery provider accepted the request; it does not claim staff have read it.

Before activation, configure and verify an appropriate Vercel WAF rate limit for POST requests to `/api/contact`. The in-memory rate limit is a best-effort per-instance safeguard and is not a distributed limit. Review any provider/hosting charges with the account owner before accepting a paid plan.

Confirm the company's privacy notice covers its actual delivery provider and operational handling. Secrets and consultation contents must not appear in logs. The browser stores only a motion-display preference, not consultation contents. Unsent form text remains in the current page only.

## Verification before online delivery is released

1. Verify the sender domain and company mailbox destination.
2. With explicit authorization for a test message, test successful receipt at the company mailbox and the Reply-To address. Do not use real consultation information.
3. Check invalid input, lack of consent, duplicate retries, rate limits, provider rejection, and network failure. Only an accepted provider response can show an acceptance number.
4. Confirm phone availability, closure days, reply expectations, language support and any other operational promises with the company.
5. Enable online delivery and redeploy. Confirm the live form switches to confirmation and submission, while the direct email and telephone alternatives remain available.

## Future custom-domain change

After the actual public domain is decided and working, update canonical and Open Graph URLs in all four pages, `sitemap.xml`, `robots.txt`, and the allowed form origin together. Coordinate existing DNS and email settings; do not change them merely to prepare the page content.
