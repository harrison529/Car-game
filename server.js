import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {cars,tracks} from './src/game.js';

export function createGameServer({waitMs=10000,maxRaceSeconds=150,roundWaitMs=10000,dist=resolve('dist')}={}){
 const rooms=new Map(),clients=new Set();
 const server=createServer(async(req,res)=>{
  if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,players:clients.size}));return;}
  try{const path=resolve(dist,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(path!==dist&&!path.startsWith(dist+sep)){res.writeHead(403);res.end();return;}const file=path===dist?resolve(dist,'index.html'):path;const content=await readFile(file);res.writeHead(200,{'content-type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end('Not found. Run npm run build first.');}
 });
 const wss=new WebSocketServer({server,path:'/online',maxPayload:2048});
 const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<100000)ws.send(JSON.stringify(data));};
 const broadcast=(room,data)=>room.members.forEach(c=>send(c.ws,data));
 const roster=room=>room.members.map(c=>({id:c.id,name:c.name,car:c.car}));
 const lobby=room=>broadcast(room,{type:'lobby',code:room.code,mode:room.mode,track:room.track,players:roster(room),remaining:Math.max(0,Math.ceil((room.deadline-Date.now())/1000))});
 function advance(room){if(room.phase==='results'&&room.mode==='tournament'&&room.round<2&&room.members.every(m=>room.ready.has(m.id))){room.round++;room.track=(room.startTrack+room.round)%5;room.phase='between';room.deadline=Date.now()+roundWaitMs;broadcast(room,{type:'next',remaining:Math.ceil(roundWaitMs/1000)});}}
 function begin(room){
  room.phase='racing';room.updatedAt=Date.now();room.time=0;room.countdown=3;room.ready=new Set();
  if(!room.slots){room.slots=room.members.map(c=>({id:c.id,name:c.name,car:cars[c.car],bot:false}));while(room.slots.length<4){const i=room.slots.length;room.slots.push({id:'bot-'+i,name:['AXEL','NOVA','REX','BOLT'][i]+' • BOT',car:cars[(i*11)%60],bot:true});}room.scores=Object.fromEntries(room.slots.map(p=>[p.id,0]));}
  room.players=room.slots.map((p,i)=>({...p,x:20-i*8,speed:0,y:0,vy:0,boost:100,hitAt:-10,hits:0,finished:0}));
  broadcast(room,{type:'start',...snapshot(room)});
 }
 const snapshot=room=>({code:room.code,mode:room.mode,round:room.round,track:room.track,time:room.time,countdown:room.countdown,players:room.players,scores:room.scores});
 function leave(c){const room=c.room;c.room=null;c.input={};if(!room)return;room.members=room.members.filter(m=>m!==c);const slot=room.slots?.find(p=>p.id===c.id);if(slot)slot.bot=true;if(slot&&!slot.name.endsWith(' • BOT'))slot.name+=' • BOT';const p=room.players?.find(p=>p.id===c.id);if(p){p.bot=true;p.name+=' • BOT';}if(!room.members.length)rooms.delete(room.code);else if(room.phase==='waiting')lobby(room);else advance(room);}
 function join(c,msg){
  if(c.room)throw Error('Leave your current race first.');
  if(typeof msg.name!=='string'||!msg.name.trim())throw Error('Enter a driver name.');
  c.name=msg.name.trim().slice(0,20);c.car=Number.isInteger(msg.car)&&cars[msg.car]?msg.car:0;
  const mode=['quick','tournament','friend'].includes(msg.mode)?msg.mode:'quick';const track=Number.isInteger(msg.track)&&tracks[msg.track]?msg.track:0;let room;
  if(msg.code){const code=String(msg.code).toUpperCase();room=rooms.get(code);if(!room||room.phase!=='waiting'||room.mode!=='friend')throw Error('Room not found or race already started.');if(room.members.length>=4)throw Error('Room is full.');}
  else if(mode!=='friend')room=[...rooms.values()].find(r=>r.mode===mode&&r.track===track&&r.phase==='waiting'&&r.members.length<4);
  if(!room){if(rooms.size>=200)throw Error('Server is full. Try again shortly.');let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));room={code,mode,track,startTrack:track,round:0,phase:'waiting',members:[],deadline:Date.now()+waitMs,createdAt:Date.now()};rooms.set(code,room);}
  c.room=room;room.members.push(c);
  // Private rooms start their ten-second countdown when a friend joins.
  if(room.mode==='friend'&&room.members.length===1)room.deadline=Infinity;
  if(room.mode==='friend'&&room.members.length===2)room.deadline=Date.now()+waitMs;
  send(c.ws,{type:'joined',id:c.id});lobby(room);
 }
 wss.on('connection',ws=>{if(clients.size>=800){ws.close(1013,'Server full');return;}const c={ws,id:randomBytes(8).toString('hex'),input:{},room:null,lastInput:0,budget:0,budgetAt:Date.now()};clients.add(c);
  ws.on('message',raw=>{try{if(Date.now()-c.budgetAt>1000){c.budget=0;c.budgetAt=Date.now();}if(++c.budget>80){ws.close(1008,'Too many messages');return;}const msg=JSON.parse(raw.toString());if(msg.type==='join')join(c,msg);else if(msg.type==='leave')leave(c);else if(msg.type==='input'){c.input={gas:msg.gas===true,brake:msg.brake===true,jump:msg.jump===true,boost:msg.boost===true};c.lastInput=Date.now();}else if(msg.type==='ready'&&c.room?.phase==='results'&&c.room.mode==='tournament'&&c.room.round<2){c.room.ready.add(c.id);advance(c.room);}}catch(e){send(ws,{type:'error',message:e instanceof SyntaxError?'Invalid message.':e.message});}});
  c.alive=true;ws.on('pong',()=>{c.alive=true;});ws.on('error',()=>{});ws.on('close',()=>{leave(c);clients.delete(c);});
 });
 const heartbeat=setInterval(()=>{for(const c of clients){if(!c.alive){c.ws.terminate();continue;}c.alive=false;c.ws.ping();}},30000);heartbeat.unref();
 let previous=Date.now(),lastLobby=0;
 const timer=setInterval(()=>{const now=Date.now(),dt=Math.min((now-previous)/1000,.1);previous=now;
  for(const room of rooms.values()){
   if((room.phase==='waiting'||room.phase==='between')&&now>=room.deadline){begin(room);continue;}
   if(room.phase==='waiting'){if(now-lastLobby>500)lobby(room);if(now-room.createdAt>10*60*1000){broadcast(room,{type:'error',message:'Room expired. Create another room.'});room.members.forEach(c=>{c.room=null;});rooms.delete(room.code);}continue;}
   if(room.phase!=='racing'){if(now-room.updatedAt>5*60*1000){broadcast(room,{type:'error',message:'Race session expired. Join another race.'});room.members.forEach(c=>{c.room=null;});rooms.delete(room.code);}continue;}
   if(room.countdown>0)room.countdown=Math.max(0,room.countdown-dt);
   else{room.time+=dt;for(const p of room.players){if(p.finished)continue;const member=room.members.find(c=>c.id===p.id);const obs=Array.from({length:Math.floor(tracks[room.track].length/800)},(_,i)=>({x:700+i*800+(room.track*53)%160,type:i%3===1?'ramp':'barrier'}));const input=p.bot?{gas:true,jump:obs.some(o=>o.type==='barrier'&&o.x-p.x>0&&o.x-p.x<110)}:member&&now-member.lastInput<1500?member.input:{};const boost=input.boost&&p.boost>0;const target=input.gas?(260+p.car.speed)*(boost?1.45:1):0;p.speed+=(target-p.speed)*dt*(input.brake?5:1.2);if(input.brake)p.speed*=1-dt*3;p.boost=Math.max(0,Math.min(100,p.boost+dt*(boost&&input.gas?-28:6)));if(input.jump&&p.y===0)p.vy=-380;const old=p.x;p.x+=p.speed*dt;p.vy+=900*dt;p.y+=p.vy*dt;if(p.y>=0){p.y=0;p.vy=0;}for(const o of obs){if(o.type==='ramp'&&old<o.x&&p.x>=o.x&&p.y===0)p.vy=-470;if(o.type==='barrier'&&Math.abs(p.x-o.x)<28&&p.y>-35&&room.time-p.hitAt>1){p.speed*=.28;p.hitAt=room.time;p.hits++;}}if(p.x>=tracks[room.track].length){p.x=tracks[room.track].length;p.finished=room.time;}}
    if(room.players.every(p=>p.finished)||room.time>=maxRaceSeconds){room.phase='results';const ranked=[...room.players].sort((a,b)=>(a.finished||Infinity)-(b.finished||Infinity)||b.x-a.x);ranked.forEach((p,i)=>room.scores[p.id]+=[10,6,4,2][i]);room.ready=new Set();broadcast(room,{type:'result',...snapshot(room),order:ranked.map(p=>p.id),final:room.mode!=='tournament'||room.round===2});}
   }
   if(room.phase==='racing')broadcast(room,{type:'state',...snapshot(room)});
  }if(now-lastLobby>500)lastLobby=now;
 },50);timer.unref();
 return {server,rooms,close:async()=>{clearInterval(timer);clearInterval(heartbeat);for(const c of clients)c.ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const {server}=createGameServer();const port=Number(process.env.PORT)||3001;server.listen(port,'0.0.0.0',()=>console.log(`Turbo Toy online server listening on port ${port}`));}
