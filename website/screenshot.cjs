const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'docs', 'DESIGN', 'ss', 'v3-final-pass-2');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const baseUrl = 'http://127.0.0.1:3000';

const pages = [
  { name: 'home', url: '/' },
  { name: 'catalogue', url: '/catalogue' },
  { name: 'setups', url: '/listings' },
  { name: 'quote', url: '/quote' },
  { name: 'contact', url: '/contact' },
  { name: 'not-found-catalogue', url: '/catalogue/non-existent-item' },
  { name: 'not-found-listings', url: '/listings/non-existent-setup' }
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 }
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('requestfailed', request => {
    console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText || 'unknown'}`);
  });
  page.on('pageerror', err => {
    console.log(`Page error: ${err.toString()}`);
  });

  console.log('Warming up server...');
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'load', timeout: 10000 });
  } catch (err) {
    console.log('Warmup threw (expected):', err.message);
  }
  await wait(5000);

  for (const vp of viewports) {
    await page.setViewport(vp);
    for (const p of pages) {
      console.log(`Capturing ${p.name} - ${vp.name}...`);
      try {
        await page.goto(`${baseUrl}${p.url}`, { waitUntil: 'networkidle2' });
        await wait(2000); // Wait 2s to ensure fonts, hydration, and images are loaded
        await page.screenshot({ path: path.join(outDir, `${p.name}-${vp.name}.png`), fullPage: true });
      } catch (err) {
        console.error(`Failed to capture ${p.name} - ${vp.name}:`, err.message);
      }
    }
  }

  await browser.close();
  console.log('Screenshots complete.');
}

run().catch(console.error);
