import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,tracks,dailyShop,buyCar,loadProfile} from '../src/game.js';
test('60 unique cars and five tracks',()=>{assert.equal(cars.length,60);assert.equal(new Set(cars.map(c=>c.name)).size,60);assert.equal(tracks.length,5);});
test('shop is stable within UTC day and rotates next day',()=>{const a=dailyShop(new Date('2026-11-09T00:00Z'));assert.equal(new Set(a.map(c=>c.id)).size,6);assert.deepEqual(a,dailyShop(new Date('2026-11-09T23:59Z')));assert.notDeepEqual(a,dailyShop(new Date('2026-11-10T00:00Z')));});
test('purchases deduct exact price, reject duplicates and insufficient funds',()=>{const p={owned:[0],coins:1000};assert.ok(buyCar(p,1));assert.equal(p.coins,1000-cars[1].price);assert.equal(buyCar(p,1),false);assert.equal(buyCar(p,59),false);assert.deepEqual(p.owned,[0,1]);});
test('corrupt profiles recover and invalid selections are sanitized',()=>{assert.equal(loadProfile({getItem:()=>'{'}),null);const p=loadProfile({getItem:()=>JSON.stringify({name:'Racer',coins:-2,owned:[0,3,300],selected:300})});assert.equal(p.coins,0);assert.deepEqual(p.owned,[0,3]);assert.equal(p.selected,0);});
