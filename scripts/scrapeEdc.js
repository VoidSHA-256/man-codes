const { chromium } = require('playwright');
const fs = require('fs');
const Papa = require('papaparse');

async function scrapePage(page) {
  return await page.$$eval('table[class="style109"] tbody tr', (rows) => {
    const result = [];
    for (let i = 3; i < rows.length; i++) {
      if (rows[i].querySelectorAll('td').length !== 6) {
        continue;
      }
      const row = rows[i];
      const tds = row.querySelectorAll('td');
      result.push({
        pCode: tds[0]?.innerText,
        spnCode: tds[1]?.innerText,
        description: tds[2]?.innerText,
        steps: tds[3]?.innerText,
        signs: tds[4]?.innerText,
        reaction: tds[5]?.innerText,
      });
    }

    return result;
  });
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = await context.newPage();

  await page.goto('https://kodtruck.ru/man%201.htm');

  const result = [];

  await page.waitForSelector('table');

  const rows = await scrapePage(page);

  result.push(...rows);

  const csvData = Papa.unparse(result);

  fs.writeFileSync('../data/edc.csv', csvData, 'utf8');

  console.log('Rows:', result.length);

  await browser.close();
})();
