iimport puppeteer from 'puppeteer-core';

const downloadPath = 'C:\\Program Files\\nodejs\\viabtc\\downloads';
const targetUrl = 'https://www.viabtc.com/observer/worker?access_key=993a644af9e364dc3d8fef580093dd5d&coin=BTC&type=active';

const run = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--window-size=1920,1080',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    userDataDir: './tmp_profile'
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  await page.goto(targetUrl, {
    waitUntil: 'networkidle2',
    timeout: 0
  });

  // Ждём появления кнопки по тексту (уточнение, чтобы Vue успел отрисовать)
  await page.waitForFunction(() => {
    const elements = Array.from(document.querySelectorAll('a'));
    return elements.some(el => el.textContent.includes('Экспорт данных'));
  }, { timeout: 15000 });

  // Кликаем по нужной кнопке через evaluate
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const exportBtn = links.find(el => el.textContent.includes('Экспорт данных'));
    if (exportBtn) {
      exportBtn.click();
    }
  });

  console.log('📥 Кнопка нажата. Ждём завершения загрузки...');

  await new Promise(res => setTimeout(res, 10000));

  console.log('✅ Файл должен быть загружен в:', downloadPath);
  await browser.close();
};

run();
