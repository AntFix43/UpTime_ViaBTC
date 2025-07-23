const fs = require('fs');
const path = require('path');

const DIR = './downloads';
const MAX_AGE_DAYS = 35;
const now = Date.now();

if (!fs.existsSync(DIR)) {
  console.error(`❌ Папка ${DIR} не найдена`);
  process.exit(1);
}

let deleted = 0;

fs.readdirSync(DIR).forEach(file => {
  const filePath = path.join(DIR, file);
  const stats = fs.statSync(filePath);
  const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

  if (ageDays > MAX_AGE_DAYS) {
    fs.unlinkSync(filePath);
    deleted++;
    console.log(`🗑️ Удалён: ${file} (возраст: ${ageDays.toFixed(1)} дней)`);
  }
});

console.log(deleted > 0
  ? `✅ Удалено файлов: ${deleted}`
  : `📁 Нет устаревших файлов старше ${MAX_AGE_DAYS} дней`);
