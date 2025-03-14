const { chromium } = require("playwright");
const fs = require("fs");
const Papa = require("papaparse");

async function scrapePage(page) {
  return await page.$$eval('td[class="style98"] table tbody tr', (rows) => {
    const result = [];
    for (let i = 2; i < rows.length; i++) {
      if (rows[i].querySelectorAll("td").length !== 2) {
        continue;
      }
      const row = rows[i];
      const tds = row.querySelectorAll("td");
      result.push({
        code: tds[0]?.innerText,
        description: tds[1]?.innerText,
      });
    }

    return result;
  });
}

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  const page = await context.newPage();

  await page.goto("https://kodtruck.ru/man%2022.htm");

  const result = [];

  await page.waitForSelector("table");

  const rows = await scrapePage(page);

  result.push(...rows);

  const csvData = Papa.unparse(result);

  fs.writeFileSync("asTronicMid.csv", csvData, "utf8");

  console.log("Rows:", result.length);

  await browser.close();
})();
