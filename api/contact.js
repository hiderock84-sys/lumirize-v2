import { createHash, createHmac } from "node:crypto";

const TYPES = new Set([
  "住まいに関する相談",
  "出所後の住居相談",
  "回復途上の住居相談",
  "ご家族からの相談",
  "支援機関からの相談",
  "その他",
]);
const EMAIL = /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/;
const WINDOW = 10 * 60 * 1000;

// Dependency injection lets validation, retries and failures be checked without sending email.
export function createContactHandler(env, sendRequest = fetch, now = Date.now) {
  const attempts = new Map();
  return async function contact(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const available =
      env.CONTACT_ENABLED === "true" && Boolean(env.RESEND_API_KEY) && EMAIL.test(env.CONTACT_FROM || "");
    if (req.method === "GET") return res.status(200).json({ available });
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false });
    }
    if (!available) return res.status(503).json({ ok: false });
    const origins = new Set([
      "https://lumirize-v2.vercel.app",
      ...(env.CONTACT_ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ]);
    if (!origins.has(req.headers.origin)) return res.status(403).json({ ok: false });
    if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")) {
      return res.status(415).json({ ok: false });
    }
    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (Buffer.byteLength(JSON.stringify(body || {}), "utf8") > 16000) {
        return res.status(413).json({ ok: false });
      }
    } catch {
      return res.status(400).json({ ok: false });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ ok: false });
    const limits = { name: 100, email: 254, type: 40, message: 2500, website: 200, submissionId: 100 };
    const data = {};
    for (const [key, limit] of Object.entries(limits)) {
      if (typeof body[key] !== "string" || body[key].length > limit) return res.status(422).json({ ok: false });
      data[key] = body[key].trim();
    }
    if (
      body.consent !== true ||
      data.website ||
      !EMAIL.test(data.email) ||
      !TYPES.has(data.type) ||
      !data.message ||
      !/^[a-zA-Z0-9-]{10,100}$/.test(data.submissionId) ||
      /[\r\n\u0000]/.test(data.name)
    ) {
      return res.status(422).json({ ok: false });
    }
    // No consultation data or raw IP addresses are logged or retained here.
    // This bounds a warm instance; production WAF rate limits must also be configured.
    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0];
    const client = createHash("sha256").update(ip).digest("hex");
    const time = now();
    for (const [key, value] of attempts) if (value.until <= time) attempts.delete(key);
    const bucket = attempts.get(client) || { until: time + WINDOW, ids: new Set() };
    const identity = createHmac("sha256", env.RESEND_API_KEY)
      .update(JSON.stringify([data.name, data.email, data.type, data.message, data.submissionId]))
      .digest("hex");
    if (bucket.ids.size >= 3 && !bucket.ids.has(identity)) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.until - time) / 1000)));
      return res.status(429).json({ ok: false });
    }
    if (!attempts.has(client) && attempts.size >= 2000) return res.status(429).json({ ok: false });
    bucket.ids.add(identity);
    attempts.set(client, bucket);
    const reference = "LR-" + identity.slice(0, 12).toUpperCase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await sendRequest("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.RESEND_API_KEY,
          "Content-Type": "application/json",
          "Idempotency-Key": "lumirize/" + identity,
        },
        body: JSON.stringify({
          from: "株式会社ルミライズ <" + env.CONTACT_FROM + ">",
          to: ["info@lumirize.com"],
          reply_to: data.email,
          subject: "[ルミライズ初回相談] " + data.type,
          text: [
            "受付番号: " + reference,
            "相談種別: " + data.type,
            "お名前: " + (data.name || "未記入"),
            "返信先: " + data.email,
            "個人情報の取り扱い: 同意済み",
            "",
            "相談内容:",
            data.message,
          ].join("\n"),
        }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || typeof result.id !== "string" || !result.id) {
        return res.status(502).json({ ok: false });
      }
      // Accepted by the delivery provider; not a claim that staff have read it.
      return res.status(200).json({ ok: true, reference });
    } catch {
      return res.status(502).json({ ok: false });
    } finally {
      clearTimeout(timeout);
    }
  };
}

export default createContactHandler(process.env);
