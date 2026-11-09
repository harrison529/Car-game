import {test,expect} from '@playwright/test';
import {createGameServer} from '../../server.js';
let game,address;
test.beforeAll(async()=>{game=createGameServer({waitMs:400,maxRaceSeconds:60});await new Promise(r=>game.server.listen(0,'127.0.0.1',r));address=`http://127.0.0.1:${game.server.address().port}`;});
test.afterAll(async()=>{await game.close();});
async function driver(browser,name,serverAddress=address){const context=await browser.newContext();await context.addInitScript(({name,address})=>{localStorage.setItem('turbo-profile',JSON.stringify({name,coins:2000,owned:[0],selected:0,races:0,wins:0}));localStorage.setItem('turbo-server',address);},{name,address:serverAddress});const page=await context.newPage();await page.goto('/');return {page,context};}
test('two browsers join a private room and see each other move',async({browser})=>{const a=await driver(browser,'Alice'),b=await driver(browser,'Bob');try{
 await a.page.getByRole('button',{name:/FRIEND RACING/}).click();await a.page.getByRole('button',{name:'CREATE / JOIN ROOM'}).click();
 await expect(a.page.locator('#online-code')).toContainText('ROOM CODE:');const code=(await a.page.locator('#online-code').textContent()).split(': ')[1];
 await b.page.getByRole('button',{name:/FRIEND RACING/}).click();await b.page.getByLabel('Room code').fill(code);await b.page.getByRole('button',{name:'CREATE / JOIN ROOM'}).click();
 await expect(a.page.locator('canvas')).toBeVisible();await expect(b.page.locator('canvas')).toBeVisible();
 await expect(a.page.locator('#online-roster')).toContainText('Bob');await expect(b.page.locator('#online-roster')).toContainText('Alice');
 await a.page.keyboard.down('ArrowRight');await expect(b.page.locator('#online-roster')).toContainText(/Alice: [1-9]\d{2,} m/,{timeout:8000});
 await b.page.keyboard.down('ArrowRight');await expect(a.page.locator('#online-roster')).toContainText(/Bob: [1-9]\d{2,} m/,{timeout:5000});
 await b.context.close();await expect(a.page.locator('#online-roster')).toContainText('Bob • BOT');await a.page.getByRole('button',{name:'LEAVE RACE'}).click();await expect(a.page.getByText('READY. SET. UNLEASH.')).toBeVisible();
 }finally{await a.context.close();await b.context.close();}
});
test('bad room code reports server error and returns home',async({browser})=>{const {page,context}=await driver(browser,'Lost');try{await page.getByRole('button',{name:/FRIEND RACING/}).click();await page.getByLabel('Room code').fill('FFFFFF');await page.getByRole('button',{name:'CREATE / JOIN ROOM'}).click();await expect(page.getByText('Room not found or race already started.')).toBeVisible();await expect(page.getByText('READY. SET. UNLEASH.')).toBeVisible();}finally{await context.close();}});

test('online tournament results advance through three shared rounds',async({browser})=>{test.setTimeout(30000);const tour=createGameServer({waitMs:100,maxRaceSeconds:.2,roundWaitMs:100});await new Promise(r=>tour.server.listen(0,'127.0.0.1',r));const serverAddress=`http://127.0.0.1:${tour.server.address().port}`;const {page,context}=await driver(browser,'Tour Driver',serverAddress);try{await page.getByRole('button',{name:/TOURNAMENT/}).click();await page.getByRole('button',{name:'CONNECT & RACE'}).click();for(let round=0;round<3;round++){await expect(page.locator('.race-top .eyebrow')).toContainText(`ROUND ${round+1}/3`);if(round<2){await page.getByRole('button',{name:'READY FOR NEXT ROUND'}).click({timeout:6000});}else{await expect(page.getByText('Champion:')).toBeVisible({timeout:6000});await page.getByRole('button',{name:'BACK TO RACE HQ'}).click();}}await expect(page.getByText('READY. SET. UNLEASH.')).toBeVisible({timeout:4000});expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('turbo-profile')).races)).toBe(3);}finally{await context.close();await tour.close();}});
