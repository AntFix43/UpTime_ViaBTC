import express from 'express';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

const PORT = 3000;
const downloadPath = path.resolve('./downloads');

function getLatestFile() {
  const files = fs.readdirSync(downloadPath)
    .filter(f => f.endsWith('.xls') || f.endsWith('.xlsx') || f.endsWith('.csv'))
    .map(f => ({ file: f, time: fs.statSync(path.join(downloadPath, f)).mtime }))
    .sort((a, b) => b.time - a.time);

  return files.length ? path.join(downloadPath, files[0].file) : null;
}

function parseFile(filePath) {
  const ext = path.extname(filePath);
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, { columns: true });
  } else {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
}

const app = express();

app.get('/', (req, res) => {
  const filePath = getLatestFile();
  if (!filePath) return res.send('<h2>⚠️ Файл не найден</h2>');

  const rows = parseFile(filePath);
  const headers = Object.keys(rows[0]);

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>📊 Аптайм воркеров</title>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #1e1e1e;
          color: #e0e0e0;
          padding: 2rem;
        }
        h2 {
          margin-bottom: 1rem;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 1rem;
        }
        th, td {
          border: 1px solid #555;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #2e2e2e;
          color: #76ff03;
        }
        tr:nth-child(even) {
          background-color: #2b2b2b;
        }
        .summary-row td {
          font-weight: bold;
          background-color: #004d40;
          color: #ffffff;
        }
      </style>
    </head>
    <body>
      <h2>📊 Аптайм и Хэшрейт воркеров</h2>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => {
            const isSummary = String(row['Воркер'] || '').includes('Общий');
            return `<tr class="${isSummary ? 'summary-row' : ''}">
              ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🌐 Сервер работает: http://localhost:${PORT}`);
});
