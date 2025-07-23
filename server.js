import express from 'express';
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://www.viabtc.com/observer/worker?access_key=993a644af9e364dc3d8fef580093dd5d&coin=BTC&type=active', {
    waitUntil: 'domcontentloaded',
  });

  try {
    // Ждём таблицу с воркерами
    await page.waitForSelector('table.el-table__body tbody tr.el-table__row', { timeout: 60000 });

    // Забираем все строки таблицы
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.el-table__body tbody tr.el-table__row'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        const toNum = (str) => parseFloat(str.replace(/[^\d.]/g, '')) || 0;

        const worker = cells[0]?.innerText.trim() || '';
        const today = toNum(cells[1]?.innerText);
        const week = toNum(cells[2]?.innerText);
        const month = toNum(cells[3]?.innerText);
        const uptimePercent = `${((month / 720) * 100).toFixed(1)}%`;

        return { worker, today, week, month, uptime: uptimePercent };
      });
    });

    await browser.close();

    // Рендерим HTML прямо из данных
    let html = `
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Аптайм воркеров ViaBTC</title>
        <style>
          body {
            font-family: sans-serif;
            background: #1c1f26;
            color: white;
            padding: 20px;
          }
          h1 {
            color: #eee;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            border: 1px solid #333;
            text-align: center;
          }
          th {
            background: #2ecc71;
            color: black;
          }
          tr:nth-child(even) {
            background: #2c2f38;
          }
        </style>
      </head>
      <body>
        <h1>Аптайм воркеров ViaBTC</h1>
        <table>
          <tr>
            <th>Воркер</th>
            <th>Сегодня (ч)</th>
            <th>За 7 дней (ч)</th>
            <th>За 30 дней (ч)</th>
            <th>Аптайм %</th>
          </tr>
    `;

    data.forEach(d => {
      html += `
        <tr>
          <td>${d.worker}</td>
          <td>${d.today.toFixed(1)}</td>
          <td>${d.week.toFixed(1)}</td>
          <td>${d.month.toFixed(1)}</td>
          <td>${d.uptime}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    await browser.close();
    res.send(`<pre>Ошибка: ${error.message}</pre>`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
