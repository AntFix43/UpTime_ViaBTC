import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Путь к Chrome
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Папка загрузки
const downloadPath = path.resolve('./downloads');
if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

const browser = await puppeteer.launch({
  headless: false,
  executablePath: chromePath,
  args: [
    '--window-size=1920,1080',
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
  ],
  defaultViewport: null
});

const page = await browser.newPage();

// Настройка скачивания
const client = await page.target().createCDPSession();
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath
});

// Открываем сайт
await page.goto('https://www.viabtc.com/observer/worker?access_key=993a644af9e364dc3d8fef580093dd5d&coin=BTC&type=active', {
  waitUntil: 'networkidle2'
});

console.log('📄 Страница загружена, жду кнопку...');

// Ждём DOM
await page.waitForSelector('span.action.text-sm.text-gray-300', { timeout: 10000 });

// Нажимаем через page.evaluate (внутри браузера)
const clicked = await page.evaluate(() => {
  const span = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('Экспорт данных'));
  if (!span) return false;

  const link = span.querySelector('a');
  if (!link) return false;

  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
    buttons: 1
  });

  link.dispatchEvent(event);
  return true;
});

if (clicked) {
  console.log('✅ Кнопка "Экспорт данных" нажата через JS-эмуляцию события!');
} else {
  console.log('❌ Не удалось найти кнопку или ссылку!');
}

// Ждём загрузку
await new Promise(resolve => setTimeout(resolve, 10000));

console.log('📁 Проверьте папку:', downloadPath);
await browser.close();

