const { chromium } = require("playwright");
const fs = require("fs");
const Papa = require("papaparse");

async function scrapePage(page) {
  return await page.$$eval(
    'table[cellpadding="0"][cellspacing="0"][border="1"] tbody tr',
    (rows) => {
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
    }
  );
}

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];
  const page = await context.newPage();

  await page.goto("https://kodtruck.ru/man%20edc%2017.htm");

  const edc17Links = await page.$$eval("a", (links) =>
    links
      .map((link) => ({
        text: link.innerText.trim(),
        href: link.href,
      }))
      .filter(
        (link) => link.text.startsWith("EDC17") || link.href.includes("EDC17")
      )
  );

  const result = [];

  for (edc17Link of edc17Links) {
    await page.goto(edc17Link.href);
    await page.waitForSelector("table");

    const rows = await scrapePage(page);

    result.push(...rows);
  }

  const csvData = Papa.unparse(result);

  fs.writeFileSync("edc17.csv", csvData, "utf8");

  console.log("Rows:", result.length);

  await browser.close();
})();
