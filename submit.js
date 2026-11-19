window.localSubmit = function (page, data) {
  var base =
    window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";
  return fetch(base + "/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: page, data: data }),
  }).then(function (r) {
    if (!r.ok) throw new Error("submit failed");
    return r.json();
  });
};
// Example (Node 18+)
// require("dotenv").config();

// const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// async function sendTelegramMessage() {
//   try {
//     const response = await fetch(
//       `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           chat_id: CHAT_ID,
//           text: "Hello from my app",
//         }),
//       },
//     );

//     const result = await response.json();
//     console.log(result);
//   } catch (error) {
//     console.error("Telegram error:", error.message);
//   }
// }

// sendTelegramMessage();
