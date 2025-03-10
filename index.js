const { chromium } = require("playwright");
const fs = require("fs");
const Papa = require("papaparse");

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  const page = await context.newPage();

  await page.goto("https://kodtruck.ru/man%20edc%2017%2081-3059.htm");
  /*
    https://kodtruck.ru/man%20edc%2017.htm - scrape pages from here
  */

  await page.waitForSelector(".style140 > tbody");

  const rows = await page.$$eval(".style140 tbody tr", (rows) => {
    const result = [];
    for (let i = 1; i < rows.length - 1; i = i + 2) {
      if (!rows[i].querySelectorAll("td")[0]?.innerText) {
        i = i + 1;
      }
      const row = rows[i];
      const tds = row.querySelectorAll("td");
      const stepsRow = rows[i + 1];
      result.push({
        code: tds[0]?.innerText,
        description: tds[1]?.innerText,
        steps: stepsRow.querySelectorAll("td")[0]?.innerText,
      });
    }
    return result;
  });
  const csvData = Papa.unparse(rows);

  fs.writeFileSync("output.csv", csvData, "utf8");

  console.log("Rows:", rows);

  await browser.close();
})();
