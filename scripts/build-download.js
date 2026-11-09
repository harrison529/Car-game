import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const data=readFileSync(new URL('../src/game.js',import.meta.url),'utf8').replace(/export /g,'');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8').split('\n').slice(2).join('\n');
const dir=new URL('../download/',import.meta.url);mkdirSync(dir,{recursive:true});
writeFileSync(new URL('index.html',dir),`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11131b"><title>Turbo Toy Racing</title><style>${css}</style></head><body><div id="app"></div><script>${data}\n${main}</script></body></html>`);
