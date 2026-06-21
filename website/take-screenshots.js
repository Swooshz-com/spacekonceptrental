import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const pages = [
  { url: '/', name: '01_home' },
  { url: '/catalogue', name: '02_catalogue' },
  { url: '/catalogue/lounge-sofa-package', name: '03_catalogue_detail' },
  { url: '/listings', name: '04_setups' },
  { url: '/listings/lounge-sofa-package', name: '05_setups_detail' },
  { url: '/quote', name: '06_quote' },
  { url: '/about', name: '07_about' },
  { url: '/contact', name: '08_contact' },
  { url: '/events', name: '09_events' },
  { url: '/not-found-page-test-123', name: '10_not_found' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const ssDir = path.join(process.cwd(), '..', 'docs', 'DESIGN', 'ss', 'v3-final-pass');
  if (!fs.existsSync(ssDir)) {
    fs.mkdirSync(ssDir, { recursive: true });
  }

  console.log('Server is ready. Taking screenshots...');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport for desktop
  await page.setViewport({ width: 1440, height: 900 });

  for (const { url, name } of pages) {
    console.log(`Taking screenshot of ${url}...`);
    try {
      await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.screenshot({ path: path.join(ssDir, `${name}_desktop.png`), fullPage: true });
      
      // Set viewport for mobile
      await page.setViewport({ width: 375, height: 667 });
      await page.screenshot({ path: path.join(ssDir, `${name}_mobile.png`), fullPage: true });
      
      // Reset viewport for desktop
      await page.setViewport({ width: 1440, height: 900 });
    } catch (e) {
      console.error(`Failed to screenshot ${url}:`, e);
    }
  }

  await browser.close();
  
  console.log('Screenshots completed.');
  console.log('Done.');
}

run().catch(console.error);
