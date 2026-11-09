export const tracks = [
 {name:'Sunset Speedway',tag:'THE ORIGINAL ORANGE',sky:'#eab880',ground:'#936247',difficulty:'Easy',length:6000},
 {name:'Neon Nightfall',tag:'AFTER HOURS',sky:'#282449',ground:'#383148',difficulty:'Medium',length:6800},
 {name:'Canyon Run',tag:'DUST & THUNDER',sky:'#d88858',ground:'#994b38',difficulty:'Medium',length:7200},
 {name:'Glacier Rush',tag:'BREAK THE ICE',sky:'#abcddc',ground:'#6c99a9',difficulty:'Hard',length:7600},
 {name:'Volcano Velocity',tag:'FEEL THE HEAT',sky:'#643d43',ground:'#542f32',difficulty:'Extreme',length:8000}
];
const names=['Twin Flame','Bone Rattler','Night Shifter','Shark Attack','Rocket Rider','Street Phantom','Thunder Bolt','Cobra Drift','Desert Demon','Cosmic Coupe','Dragon Wagon','Neon Viper','Track Titan','Speed Specter','Fire Falcon','Chrome Comet','Atomic Arrow','Midnight Muscle','Rally Raptor','Golden Ghost'];
export const cars=Array.from({length:60},(_,i)=>({id:i,name:names[i%20]+(i<20?'':i<40?' GT':' X'),color:['#f45731','#38b9db','#e7cf58','#b57ce5','#67bc99','#f188b0'][i%6],speed:70+i%7*4,handling:70+(i*3)%27,price:400+i*75,rarity:i%5===0?'LEGENDARY':i%3===0?'RARE':'STREET'}));
export function dailyShop(date=new Date()){const day=Math.floor(date.getTime()/86400000);return Array.from({length:6},(_,i)=>cars[(day*7+i*9)%60]);}
export function loadProfile(storage){try{const p=JSON.parse(storage.getItem('turbo-profile'));if(!p||typeof p.name!=='string')return null;return {...p,coins:Math.max(0,Number(p.coins)||0),owned:[...new Set([0,...(Array.isArray(p.owned)?p.owned.filter(x=>Number.isInteger(x)&&x>=0&&x<60):[])])],selected:Number.isInteger(p.selected)&&p.selected>=0&&p.selected<60&&p.owned?.includes(p.selected)?p.selected:0,races:Number(p.races)||0,wins:Number(p.wins)||0};}catch{return null;}}
export function buyCar(profile,id){const car=cars[id];if(!car||profile.owned.includes(id)||profile.coins<car.price)return false;profile.coins-=car.price;profile.owned.push(id);return true;}
export function terrain(x){return 375+Math.sin(x/280)*32+Math.sin(x/110)*12;}
