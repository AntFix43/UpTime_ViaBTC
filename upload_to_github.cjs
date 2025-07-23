const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Путь до index.html
const indexPath = path.resolve(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html не найден. Сначала запустите generate_html_from_latest_xls.cjs');
  process.exit(1);
}

try {
  // Добавляем и пушим в репозиторий
  execSync('git add index.html');
  execSync(`git commit -m "🔄 Автообновление от ${new Date().toLocaleString('ru-RU')}"`);
  execSync('git push');

  console.log('✅ Успешно опубликовано на GitHub Pages');
} catch (err) {
  console.error('❌ Ошибка при push:', err.message);
}
