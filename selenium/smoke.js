const {Builder,Browser,By}=require('selenium-webdriver');
(async()=>{
 const driver=await new Builder().forBrowser(Browser.CHROME).build();
 try {
   await driver.get('http://127.0.0.1:5000/books');
   const count=(await driver.findElements(By.css('[data-testid="book-card"]'))).length;
   console.log('Catalogue loads:',count===6?'PASS':'FAIL','cards=',count);
   if(count!==6)process.exitCode=1;
 } finally {await driver.quit();}
})().catch(e=>{console.error(e);process.exitCode=1;});
