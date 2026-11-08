import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const url = process.env.LIVE_URL;
if (!url || !url.startsWith('https://')) throw new Error('Set LIVE_URL to the deployed HTTPS address.');
const browser = await chromium.launch();
try {
  const page = await browser.newPage(); const failures=[]; page.on('pageerror',e=>failures.push(e.message));
  const response=await page.goto(url); if(response.status()!==200) throw new Error(`HTTP ${response.status()}`);
  await page.locator('#download').waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('#download').disabled);
  await page.getByRole('button',{name:/Mono ink/}).click();
  await page.waitForFunction(()=>!document.querySelector('#download').disabled);
  const pixels=await page.locator('#result').evaluate(c=>({width:c.width,height:c.height,data:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4<3&&v>0)}));
  if(!pixels.width||!pixels.height||!pixels.data)throw new Error('Empty result canvas');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#download').click()]);
  if(await download.failure())throw new Error('PNG download failed');
  const bytes=await readFile(await download.path());
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Export is not PNG');
  await page.locator('#file').setInputFiles({name:'smoke-reimport.png',mimeType:'image/png',buffer:bytes});
  await page.waitForFunction(()=>!document.querySelector('#download').disabled);
  const reimport=await page.locator('#original').evaluate(c=>[c.width,c.height]);
  if(reimport[0]!==pixels.width||reimport[1]!==pixels.height)throw new Error('Export failed browser decode');
  await page.locator('#analysis-mean').waitFor();
  if(!(await page.locator('#analysis-mean').textContent()).includes('/ 255'))throw new Error('Source analysis missing');
  await page.getByRole('button',{name:'Soft monochrome',exact:true}).click();
  await page.locator('#apply-plan').click();
  await page.waitForFunction(()=>!document.querySelector('#download').disabled);
  if(await page.locator('#ink').inputValue()!=='20')throw new Error('Local edit plan was not applied');
  for(const resource of ['guide.html','sitemap.xml','llms.txt','social-preview.png']){
    const asset=await page.request.get(new URL(resource,url).href);
    if(!asset.ok())throw new Error(`${resource} returned HTTP ${asset.status()}`);
  }
  const canonical=await page.locator('link[rel=canonical]').getAttribute('href');
  if(canonical!==url)throw new Error('Public canonical URL does not match the deployment');
  if(failures.length)throw new Error(failures.join('\n'));
  console.log(JSON.stringify({url,status:'passed',png:download.suggestedFilename(),dimensions:[pixels.width,pixels.height],analysis:true,localPlan:true,discoveryAssets:true},null,2));
} finally { await browser.close(); }
