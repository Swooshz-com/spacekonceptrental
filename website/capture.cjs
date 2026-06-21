const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve('..', 'docs', 'DESIGN', 'ss', `v3-rebuild-${new Date().toISOString().replace(/[:.]/g, '-')}`);

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const pagesToCapture = [
  { url: 'http://localhost:3000/', name: '01_homepage.png' },
  { url: 'http://localhost:3000/catalogue', name: '02_catalogue.png' },
  { url: 'http://localhost:3000/catalogue/lounge-sofa-package', name: '03_catalogue_detail.png' },
  { url: 'http://localhost:3000/listings', name: '04_listings.png' },
  { url: 'http://localhost:3000/listings/lounge-sofa-package', name: '05_listings_detail.png' },
  { url: 'http://localhost:3000/quote', name: '06_quote.png' },
  { url: 'http://localhost:3000/about', name: '07_about.png' },
  { url: 'http://localhost:3000/contact', name: '08_contact.png' },
  { url: 'http://localhost:3000/categories', name: '09_categories.png' },
  { url: 'http://localhost:3000/events', name: '10_events.png' },
  { url: 'http://localhost:3000/privacy', name: '11_privacy.png' },
  { url: 'http://localhost:3000/terms', name: '12_terms.png' }
];

async function capture() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  // Add retry logic
  async function gotoWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Navigating to ${url} (Attempt ${i + 1})...`);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        return true;
      } catch (e) {
        console.log(`Attempt ${i + 1} failed for ${url}: ${e.message}`);
        await new Promise(r => setTimeout(r, 5000)); // wait before retry
      }
    }
    return false;
  }

  for (const { url, name } of pagesToCapture) {
    console.log(`\nCapturing ${url}...`);
    const success = await gotoWithRetry(url);
    if (success) {
      // wait a bit for any lazy loaded images
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true });
      console.log(`Saved ${name}`);
    } else {
      console.error(`Failed to capture ${url} after retries`);
    }
  }

  await browser.close();
  console.log('Done.');
}

capture().catch(console.error);
