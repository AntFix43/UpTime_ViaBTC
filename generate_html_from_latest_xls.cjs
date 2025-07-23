const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const DOWNLOADS_DIR = './downloads';
const OUTPUT_FILE = './uptime_report_viabtc.html';

// Найти последний файл .xlsx
function getLatestXLSXFile(dir) {
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.xls'))
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(dir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? path.join(dir, files[0].name) : null;
}

// Преобразовать хешрейт в читаемый формат
function formatHashrate(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + ' PH/s';
  if (num >= 1_000) return (num / 1_000).toFixed(2) + ' TH/s';
  return num.toFixed(2) + ' GH/s';
}

// Преобразовать часы в % (от 720 часов)
function uptimeToPercent(hours) {
  const val = parseFloat(hours);
  if (isNaN(val)) return '-';
  return ((val / 720) * 100).toFixed(1) + '%';
}

// Создать HTML
function generateHTML(data, summaryRow) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Аптайм воркеров ViaBTC</title>
  <style>
    body {
      background-color: #0f111a;
      color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
    }
    h1 {
      color: #ffffff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    thead {
      background-color: #22c55e;
      color: #000000;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #1f2937;
    }
    tr:nth-child(even) {
      background-color: #1f2937;
    }
    tr:hover {
      background-color: #374151;
    }
    .highlight {
      color: #22c55e;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>📊 Аптайм воркеров ViaBTC</h1>
  <table>
    <thead>
      <tr>
        <th>Воркер</th>
        <th>Хешрейт_24ч</th>
        <th>Аптайм_7д</th>
        <th>Аптайм_30д</th>
        <th>Аптайм_60д</th>
        <th>Аптайм_%</th>
      </tr>
    </thead>
    <tbody>
      ${[summaryRow, ...data].join('\n')}
    </tbody>
  </table>
</body>
</html>
`;
}

// === MAIN ===
const filePath = getLatestXLSXFile(DOWNLOADS_DIR);
if (!filePath) {
  console.error('❌ Файл не найден в ./downloads');
  process.exit(1);
}

const wb = xlsx.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

let totalHashrate = 0;
let totalUptime30 = 0;
let uptimeCount = 0;

const tableRows = rows.map(row => {
  const worker = row['Воркер'];
  const hrate = parseFloat(row['Ср. хэшрейт за 24 ч.']);
  const uptime7 = row['7 дней онлайн'];
  const uptime30 = parseFloat(row['30 дней онлайн']);
  const uptime60 = row['60 дней онлайн'];
  const uptimePercent = uptimeToPercent(uptime30);

  if (!isNaN(hrate)) totalHashrate += hrate;
  if (!isNaN(uptime30)) {
    totalUptime30 += uptime30;
    uptimeCount++;
  }

  return `<tr>
    <td>${worker}</td>
    <td>${formatHashrate(hrate)}</td>
    <td>${uptime7}</td>
    <td>${row['30 дней онлайн']}</td>
    <td>${uptime60}</td>
    <td>${uptimePercent}</td>
  </tr>`;
});

const totalHash = formatHashrate(totalHashrate);
const avgUptimePercent = uptimeCount > 0 ? ((totalUptime30 / uptimeCount) / 720 * 100).toFixed(1) + '%' : '-';

const summaryRow = `<tr>
  <td>🟢 Общий</td>
  <td>${totalHash}</td>
  <td>-</td>
  <td>-</td>
  <td>-</td>
  <td>${avgUptimePercent}</td>
</tr>`;

const html = generateHTML(tableRows, summaryRow);
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
console.log(`✅ Готово. HTML сохранён в ${OUTPUT_FILE}`);
