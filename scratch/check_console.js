const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[BROWSER EXCEPTION]: ${err.toString()}`);
  });
  
  console.log('Navigating to http://localhost:8000/games/super-mario/index.html ...');
  await page.goto('http://localhost:8000/games/super-mario/index.html', { waitUntil: 'networkidle2' });
  
  console.log('Waiting 3 seconds for assets to load...');
  await new Promise(r => setTimeout(r, 3000));
  
  // Click on start button if visible, or simulate Space key press
  console.log('Simulating Space key down/up...');
  await page.keyboard.press('Space');
  
  console.log('Waiting 5 seconds for gameplay...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Closing browser...');
  await browser.close();
})().catch(err => {
  console.error('Error running test:', err);
});
