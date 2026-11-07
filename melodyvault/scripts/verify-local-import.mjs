import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Navigate to Music Library
  console.log('Clicking Music Library in sidebar...');
  await page.click('button:has-text("Music Library")');
  await page.waitForTimeout(800);

  // 2. Open Import Songs Modal
  console.log('Clicking Import Songs button...');
  await page.click('button:has-text("Import Songs")');
  await page.waitForTimeout(500);

  // Upload the two WAV files
  console.log('Uploading test audio files...');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    throw new Error('File input not found in Import Modal');
  }

  await fileInput.setInputFiles([
    '/tmp/Solaris - Starlight Echoes.wav',
    '/tmp/Cyberpunk Drift.wav',
  ]);

  // Wait for parsing and saving into IndexedDB
  console.log('Waiting for import progress...');
  await page.waitForSelector('text=Import Complete', { timeout: 10000 });
  await page.screenshot({ path: 'test-import-done.png' });
  console.log('Saved test-import-done.png');

  // Click Done & Return to Library
  await page.click('button:has-text("Done & Return to Library")');
  await page.waitForTimeout(600);

  // 3. Verify imported songs in Library
  console.log('Checking library for imported songs...');
  const starlightTrack = await page.locator('text=Starlight Echoes').first();
  const cyberpunkTrack = await page.locator('text=Cyberpunk Drift').first();
  const countStarlight = await starlightTrack.count();
  const countCyberpunk = await cyberpunkTrack.count();

  console.log(`Found Starlight Echoes: ${countStarlight > 0}, Cyberpunk Drift: ${countCyberpunk > 0}`);
  if (countStarlight === 0 || countCyberpunk === 0) {
    throw new Error('Imported songs not found in library table!');
  }

  // 4. Play the imported track
  console.log('Clicking play on Starlight Echoes...');
  const row = page.locator('tr:has-text("Starlight Echoes")').first();
  const playBtn = row.locator('button').first();
  await playBtn.click();
  await page.waitForTimeout(1500);

  // Check player bar
  const playerTrack = await page.locator('.truncate:has-text("Starlight Echoes")').count();
  console.log(`PlayerBar shows track: ${playerTrack > 0}`);

  // Test seeking forward
  console.log('Seeking in audio player...');
  const progressBar = page.locator('input[type="range"]').first();
  if (await progressBar.count() > 0) {
    await progressBar.fill('2'); // Seek to 2 seconds
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: 'test-playing-imported.png' });
  console.log('Saved test-playing-imported.png');

  // 5. Test Refresh Persistence
  console.log('Reloading page to test persistence from IndexedDB and localStorage...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  await page.click('button:has-text("Music Library")');
  await page.waitForTimeout(600);

  const reloadedStarlight = await page.locator('text=Starlight Echoes').first().count();
  console.log(`After reload, Starlight Echoes still present: ${reloadedStarlight > 0}`);
  if (reloadedStarlight === 0) {
    throw new Error('Imported song did not persist after page refresh!');
  }

  // 6. Test Settings View and Collection Backup Modal
  console.log('Navigating to Settings view...');
  await page.click('button:has-text("Settings")');
  await page.waitForTimeout(800);

  // Check storage gauge
  const storageText = await page.locator('text=Browser IndexedDB Local Audio Storage').count();
  console.log(`Storage gauge present: ${storageText > 0}`);

  // Open Backup Modal
  console.log('Opening ZIP Backup Manager...');
  await page.click('button:has-text("Open ZIP Backup Manager")');
  await page.waitForTimeout(600);

  await page.screenshot({ path: 'test-backup-modal.png' });
  console.log('Saved test-backup-modal.png');

  // Close modal
  await page.click('button:has-text("Close")');
  await page.waitForTimeout(400);

  console.log('ALL VERIFICATION STEPS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
