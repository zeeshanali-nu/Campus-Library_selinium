// Student starter. Complete the marked tasks using locators found with Chrome Inspect.
const {Builder,Browser,By}=require('selenium-webdriver');
(async()=>{
 const driver=await new Builder().forBrowser(Browser.CHROME).build();
 try{
  await driver.get('http://127.0.0.1:5000/login');
  await driver.findElement(By.id('username')).sendKeys('student1');
  await driver.findElement(By.id('password')).sendKeys('Library@123');
  await driver.findElement(By.id('loginBtn')).click();
  // TODO 1: Search for "Software Testing" on /books.
  // TODO 2: Verify matching title is displayed.
  // TODO 3: Reserve book ID 1 with phone 03123456789.
  // TODO 4: Verify "Reservation successful".
  // TODO 5: Attempt another reservation for book 1, verify duplicate error.
  // TODO 6: Add results logging and screenshots on failed tests.
 } finally {await driver.quit();}
})().catch(e=>{console.error(e);process.exitCode=1;});
