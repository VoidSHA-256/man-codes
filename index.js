const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const csv = require("csv-parser");

const BOT_TOKEN = "7206419874:AAHUw2zUKKh4oyeMlWzKQFiz82xvPxbcrqE";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
let errorData = [];

fs.createReadStream("edc17.csv", { encoding: "utf-8" })
  .pipe(csv({ separator: "," }))
  .on("data", (row) => errorData.push(row))
  .on("end", () => console.log("CSV loaded!"));

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage =
    `🤖 Вітаю! Я бот для пошуку помилок.\n\n` +
    `🔍 Надішли мені *код помилки* або *ключове слово*, і я знайду відповідну інформацію.\n\n` +
    `📌 Наприклад:\n_081_\n_Давление подачи топлива_`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
});

bot.on("message", (msg) => {
  if (msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const query = msg.text.trim();

  const results = errorData.filter(
    (row) =>
      row.code.includes(query) ||
      row.description.toLowerCase().includes(query.toLowerCase())
  );

  if (results.length > 0) {
    results.forEach((row) => {
      const response =
        `⚙️ *Код ошибки:* ${row.code}\n\n` +
        `📌 *Описание:* ${row.description}\n\n` +
        `🛠 *Способы устранения:*\n${row.steps}`;
      bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    });
  } else {
    bot.sendMessage(
      chatId,
      "❌ Ошибка не найдена. Проверьте код или попробуйте другое слово."
    );
  }
});
