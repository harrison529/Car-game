import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../../download/index.html',import.meta.url),'utf8');
test('download starts and races when browser storage writes are denied',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Saving blocked','SecurityError');};});
 await page.goto('/download/index.html');
 await page.getByRole('button',{name:'LET’S RACE'}).click();
 await expect(page.getByRole('alert')).toHaveText('Enter your driver name to start.');
 await page.getByLabel('CREATE YOUR DRIVER PROFILE').fill('Offline Driver');
 await page.getByRole('button',{name:'LET’S RACE'}).click();
 await expect(page.getByText('READY. SET. UNLEASH.')).toBeVisible({timeout:6000});
 await expect(page.getByText('Browser saving is blocked.')).toBeVisible();
 await page.getByRole('button',{name:/QUICK PLAY/}).click();
 await expect(page.locator('canvas')).toBeVisible({timeout:13000});
});
test('download starts inside preview with storage and form submissions blocked',async({page})=>{
 await page.goto('/');
 await page.evaluate(html=>{document.body.innerHTML='';const frame=document.createElement('iframe');frame.id='download-preview';frame.sandbox='allow-scripts';frame.srcdoc=html;frame.style='width:100%;height:900px';document.body.append(frame);},html);
 const game=page.frameLocator('#download-preview');
 await game.getByLabel('CREATE YOUR DRIVER PROFILE').fill('Preview Driver');
 await game.getByRole('button',{name:'LET’S RACE'}).click();
 await expect(game.getByText('READY. SET. UNLEASH.')).toBeVisible({timeout:6000});
});
