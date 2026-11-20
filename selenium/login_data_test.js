const {Builder,Browser,By,until}=require('selenium-webdriver');
const fs=require('fs');const path=require('path');
const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'../student_data/login_cases.json'),'utf8'));
const BASE='http://127.0.0.1:5000';
const results=[];
(async()=>{
 const driver=await new Builder().forBrowser(Browser.CHROME).build();
 try{
  for(const t of cases){
   try{
    await driver.manage().deleteAllCookies();
    await driver.get(BASE+'/login');
    if(t.username)await driver.findElement(By.id('username')).sendKeys(t.username);
    if(t.password)await driver.findElement(By.id('password')).sendKeys(t.password);
    await driver.findElement(By.id('loginBtn')).click();
    let ok=false,actual='';
    if(t.expected==='required'){
       const invalid=await driver.executeScript('return !document.getElementById("loginForm").checkValidity()');
       ok=Boolean(invalid); actual=invalid?'Required field blocked submission':'Unexpectedly valid';
    } else {
       const flash=await driver.wait(until.elementLocated(By.id('flash')),5000);
       actual=(await flash.getText()).trim();ok=actual.includes(t.expected);
    }
    const status=ok?'PASS':'FAIL';
    console.log(t.id,status,actual);results.push([t.id,t.expected,actual,status]);
    if(!ok){fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
     fs.writeFileSync(path.join(__dirname,'screenshots',t.id+'.png'),await driver.takeScreenshot(),'base64');}
   }catch(e){console.log(t.id,'FAIL',e.message);results.push([t.id,t.expected,e.message,'FAIL']);}
  }
 } finally {await driver.quit();}
 fs.mkdirSync(path.join(__dirname,'logs'),{recursive:true});
 const esc=x=>'"'+String(x).replace(/"/g,'""')+'"';
 fs.writeFileSync(path.join(__dirname,'logs/login_results.csv'),
   'Test ID,Expected,Actual,Status\n'+results.map(r=>r.map(esc).join(',')).join('\n')+'\n');
 console.log('Results saved in selenium/logs/login_results.csv');
 if(results.some(r=>r[3]==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
