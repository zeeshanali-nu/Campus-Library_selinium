const fs = require('fs');
const path = require('path');
const { Builder, Browser, By, until } = require('selenium-webdriver');

const BASE_URL = 'http://127.0.0.1:5000'\;
const DEST_SELENIUM = path.join(process.env.HOME, 'p243035_CampusLibrary_QA', 'selenium');
const LOG_DIR = path.join(DEST_SELENIUM, 'logs');
const SHOT_DIR = path.join(DEST_SELENIUM, 'screenshots');
const LOG_FILE = path.join(LOG_DIR, 'reservation_results.csv');

fs.mkdirSync(LOG_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });

const results = [];

function record(caseId, description, status, detail) {
  const cleanDetail = String(detail || '').replace(/"/g, '""');
  results.push(`${caseId},"${description}",${status},"${cleanDetail}"`);
  console.log(`${caseId} ${status} ${description} - ${detail}`);
}

async function saveShot(driver, filename) {
  const img = await driver.takeScreenshot();
  const outPath = path.join(SHOT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(img, 'base64'));
  return outPath;
}

async function waitForFlash(driver, timeout = 7000) {
  const el = await driver.wait(until.elementLocated(By.id('flash')), timeout);
  await driver.wait(until.elementTextMatches(el, /\S/), timeout);
  return await el.getText();
}

(async () => {
  const driver = await new Builder().forBrowser(Browser.CHROME).build();
  await driver.manage().setTimeouts({ implicit: 0 });

  try {
    await driver.get(`${BASE_URL}/login`);
    await driver.findElement(By.id('username')).sendKeys('student1');
    await driver.findElement(By.id('password')).sendKeys('Library@123');
    await driver.findElement(By.id('loginBtn')).click();
    await driver.wait(until.urlContains('/books'), 7000);

    // TODO 1 & TODO 2: Search for "Software Testing" on /books and verify matching title
    const searchInput = await driver.findElement(By.id('search'));
    await searchInput.clear();
    await searchInput.sendKeys('Software Testing');
    await driver.findElement(By.id('searchBtn')).click();

    const titleEl = await driver.wait(
      until.elementLocated(By.css('[data-testid="book-title"]')),
      7000
    );
    const displayedTitle = await titleEl.getText();
    if (displayedTitle.toLowerCase().includes('software testing')) {
      record('RES_01', 'Search and verify book title', 'PASS', `Found title: ${displayedTitle}`);
      await saveShot(driver, '01_search_software_testing.png');
    } else {
      const shot = await saveShot(driver, 'fail_01_search_title.png');
      record('RES_01', 'Search and verify book title', 'FAIL', `Unexpected title: ${displayedTitle} (${shot})`);
    }

    // TODO 3 & TODO 4: Reserve book ID 1 with phone 03123456789 and verify success
    await driver.get(`${BASE_URL}/reserve/1`);
    const phoneInput = await driver.wait(until.elementLocated(By.id('phone')), 7000);
    await phoneInput.clear();
    await phoneInput.sendKeys('03123456789');
    await driver.findElement(By.id('reserveBtn')).click();

    const flashText = await waitForFlash(driver);
    if (flashText.toLowerCase().includes('reservation successful')) {
      record('RES_02', 'Reserve book 1 with valid 11-digit phone', 'PASS', flashText);
      await saveShot(driver, '02_reserve_book1_success.png');
    } else {
      const shot = await saveShot(driver, '02_reserve_book1_outcome.png');
      record('RES_02', 'Reserve book 1 with valid 11-digit phone', 'FAIL', `Flash: ${flashText} (${shot})`);
    }

    // TODO 5 (Negative scenario): Attempt another reservation for book 1 and verify duplicate error
    await driver.get(`${BASE_URL}/reserve/1`);
    const phoneAgain = await driver.wait(until.elementLocated(By.id('phone')), 7000);
    await phoneAgain.clear();
    await phoneAgain.sendKeys('03123456789');
    await driver.findElement(By.id('reserveBtn')).click();

    const dupText = await waitForFlash(driver);
    const negShot = await saveShot(driver, '03_negative_duplicate_reservation.png');
    if (dupText.toLowerCase().includes('already reserved')) {
      record('RES_03', 'Negative: duplicate reservation on book 1 rejected', 'PASS', `${dupText} (${negShot})`);
    } else {
      record('RES_03', 'Negative: duplicate reservation on book 1 rejected', 'FAIL', `${dupText} (${negShot})`);
    }
  } catch (err) {
    try {
      const errShot = await saveShot(driver, 'error_unexpected.png');
      record('RES_ERR', 'Unexpected script error', 'FAIL', `${err.message} (${errShot})`);
    } catch (_) {
      record('RES_ERR', 'Unexpected script error', 'FAIL', err.message);
    }
    process.exitCode = 1;
  } finally {
    // TODO 6: Write PASS/FAIL results log
    const header = 'case_id,description,status,detail\n';
    fs.writeFileSync(LOG_FILE, header + results.join('\n') + '\n');
    console.log(`Log written to ${LOG_FILE}`);
    await driver.quit();
  }
})();
