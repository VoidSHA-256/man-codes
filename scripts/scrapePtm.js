const { chromium } = require('playwright');
const fs = require('fs');
const Papa = require('papaparse');

async function scrapePage(page) {
  return await page.$$eval(
    'td[class="style98"] table tbody tr td table',
    (tableRows) => {
      const result = [];
      for (
        let tableCounter = 0;
        tableCounter < tableRows.length;
        tableCounter++
      ) {
        const rows = tableRows[tableCounter].querySelectorAll('tr');
        let trCounter = tableCounter === 0 ? 2 : 0;

        for (trCounter; trCounter < rows.length; trCounter = trCounter + 2) {
          if (rows[trCounter].querySelectorAll('td').length !== 2) {
            continue;
          }
          const row = rows[trCounter];
          const tds = row.querySelectorAll('td');
          const stepsRow = rows[trCounter + 1];
          result.push({
            code: tds[0]?.innerText,
            description: tds[1]?.innerText,
            steps: stepsRow.querySelectorAll('td')[0]?.innerText,
          });
        }
      }

      return result;
    }
  );
}

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = await context.newPage();

  await page.goto('https://kodtruck.ru/man%2032-1.htm');

  const links = await page.$$eval('a', (links) =>
    links
      .map((link) => ({
        text: link.innerText.trim(),
        href: link.href,
      }))
      .filter(
        (link) => link.text.startsWith('SPN') || link.href.includes('SPN')
      )
  );

  const result = [];

  for (link of links) {
    await page.goto(link.href);
    await page.waitForSelector('table');

    const rows = await scrapePage(page);

    result.push(...rows);
  }

  const csvData = Papa.unparse(result);

  fs.writeFileSync('data/ptm.csv', csvData, 'utf8');

  console.log('Rows:', result.length);

  await browser.close();
})();
