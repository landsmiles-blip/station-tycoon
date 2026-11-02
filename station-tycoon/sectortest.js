/* SECTOR TEST — SUPERSEDED by venturetest.js (do not run in the gate).
   Kept on disk as the record of the pre-franchise invariants; the sector API it
   exercises (openSector / G.sector / G.outposts) was generalised into the
   venture franchise, and venturetest.js covers every one of these invariants
   plus the new ones.
   --- original header ---
   SECTOR TEST — the additive prestige layer.
   Invariants: promotion never deletes value; a fresh board is always affordable;
   every sector actually introduces its mechanic; the offer is discoverable,
   dismissible and re-openable; state survives a save/load. */
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
const ctxStub=new Proxy({},{get(t,p){if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
 if(p==='measureText')return(s)=>({width:String(s).length*7.2});if(p==='canvas')return{width:1,height:1};
 if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha','globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];return()=>{};},set(t,p,v){t[p]=v;return true;}});
const canvas={width:0,height:0,style:{},getContext:()=>ctxStub,addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})};
const store={};
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},requestAnimationFrame:()=>1,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>0}};
const sb={window:win,document:{getElementById:()=>canvas,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`;globalThis.__T={get G(){return G},update,newGame,layout,resize,render,recompute,
  openSector,buildCost,shipPeriod,progress,saveGame,loadGame,mkMod,get MAXSLOTS(){return MAXSLOTS},
  get STARTSLOTS(){return STARTSLOTS},get OVERLAY_BTNS(){return OVERLAY_BTNS},get MECHS(){return MECHS},
  mechIndex,mechPot,pauseGame,get CONTRACTS(){return CONTRACTS},burst:()=>0};`,sb);
const T=sb.__T,G=()=>T.G;
let fails=[];const ck=(ok,l,x)=>{console.log(`  ${ok?'✅':'❌'} ${l}${x?'  ('+x+')':''}`);if(!ok)fails.push(l);};
const dt=1/120;
T.resize();T.newGame(false);T.layout();G().scene='play';

// build a credible finished board
for(let i=0;i<8;i++){const p=T.slotPos?0:0;}
G().slots=8;
for(let i=0;i<8;i++){G().mods[i]=null;}
T.recompute();
// place 8 tier-6 machines via the real maker
vm.runInContext(`for(let i=0;i<8;i++){G.mods[i]=mkMod(i,6);}`,sb);
G().coins=900000;G().earned=160000;G().contract=14;G().endless=true;G().commission=4;
T.recompute();
const before={earned:G().earned,coins:G().coins,active:G().activeIncome,outposts:G().outposts.length};
ck(before.active>0,'finished board has active income',before.active.toFixed(0)+'/s');

// ---- promotion economics
const expectOut=Math.round(before.active*0.35);
T.openSector();
ck(G().sector===2,'sector increments',G().sector);
ck(G().outposts.length===before.outposts+1,'old board promoted to outpost');
ck(G().outposts[0].income===expectOut,'outpost pays 35% of the promoted board','+'+G().outposts[0].income+'/s');
ck(Math.abs(G().sectorMult-1.5)<1e-9,'permanent multiplier applied','x'+G().sectorMult);
ck(G().earned===before.earned,'lifetime earnings NOT wiped',fmtN(G().earned));
ck(G().coins===before.coins,'bank NOT wiped',fmtN(G().coins));
ck(G().mods.filter(Boolean).length===1&&G().slots===T.STARTSLOTS,'fresh active board',G().mods.filter(Boolean).length+' mod, '+G().slots+' slots');
ck(G().contract===14,'authored spine stays complete',G().contract+'/14');
ck(G().commission===0&&!!G().commissionGoal,'commission ladder restarts with a live goal');
function fmtN(v){return Math.round(v).toLocaleString('en-US');}

// ---- a fresh sector-2 board must be AFFORDABLE (active-only build cost)
const cost=T.buildCost();
ck(cost<G().coins,'fresh board can afford its first builds','cost '+cost+' vs bank '+fmtN(G().coins));
ck(cost<before.active,'build cost ignores outpost income (else new boards are unbuildable)','cost '+cost+' < active '+before.active.toFixed(0));
// outpost income still counts toward total income (the empire keeps paying)
ck(G().income>=G().outpostIncome&&G().outpostIncome>0,'outpost income flows into total','total '+G().income.toFixed(0)+'/s incl outpost '+G().outpostIncome.toFixed(0));

// ---- each sector actually introduces its mechanic
function setSector(n){G().sector=n;T.recompute();}
setSector(1);const base1=G().activeIncome;
// SYNERGY (sector 2): adjacent occupied slots raise active income
vm.runInContext(`G.mods[1]=mkMod(1,6);`,sb);
setSector(1);T.recompute();const noSyn=G().activeIncome;
setSector(2);T.recompute();const syn=G().activeIncome;
ck(syn>noSyn,'SECTOR 2 SYNERGY raises income for linked machines','+'+((syn/noSyn-1)*100).toFixed(0)+'%');
// SURGE (sector 3): triggers on its own and doubles income while active
setSector(3);G().surge=0;G().surgeCd=0.01;
const g0=G().coins;let gained=0;
for(let i=0;i<120;i++){T.update(dt);gained=G().coins-g0;}
ck(G().surge>0,'SECTOR 3 SURGE self-triggers (no touch target needed)','surge='+G().surge.toFixed(1)+'s');
// FREIGHT BOOM (sector 4): shorter ship period
setSector(3);const p3=T.shipPeriod();setSector(4);const p4=T.shipPeriod();
ck(p4<p3,'SECTOR 4 FREIGHT BOOM shortens ship period',p3.toFixed(2)+'s -> '+p4.toFixed(2)+'s');
// RESONANCE (sector 5 -> index 3): bigger merge bursts
setSector(5);
ck(T.mechIndex()===3&&T.mechPot()===1,'SECTOR 5 introduces RESONANCE (first cycle, base potency)','idx '+T.mechIndex()+' pot '+T.mechPot());
setSector(6);
ck(T.mechIndex()===0&&T.mechPot()===1.25,'SECTOR 6 cycles back to SYNERGY at raised potency','idx '+T.mechIndex()+' pot '+T.mechPot());
setSector(1);
ck(T.mechIndex()===-1,'SECTOR 1 (the authored game) carries NO mechanic','idx '+T.mechIndex());

// ---- offer flow: earned -> auto-shown -> dismissible -> re-openable from pause
setSector(2);G().sectorOfferReady=false;G().sectorPrompt=false;G().commission=4;G().scene='play';
vm.runInContext(`completeCommission();`,sb);
ck(G().sectorOfferReady&&G().sectorPrompt,'every 5th commission readies the charter');
T.update(dt);
ck(G().scene==='sector','the offer presents itself once, automatically',G().scene);
T.render();
const notNow=T.OVERLAY_BTNS[T.OVERLAY_BTNS.length-1];
notNow.fn();
ck(G().scene==='play'&&G().sectorOfferReady,'NOT NOW returns to play and keeps the offer alive',G().scene);
T.update(dt);T.update(dt);
ck(G().scene==='play','and does not re-interrupt',G().scene);
T.pauseGame();T.render();
const withOffer=T.OVERLAY_BTNS.length;
G().sectorOfferReady=false;T.render();
const withoutOffer=T.OVERLAY_BTNS.length;
ck(withOffer===withoutOffer+1,'pause menu gains exactly the charter button when ready',withOffer+' vs '+withoutOffer);
G().sectorOfferReady=true;

// ---- persistence
T.saveGame();const r=JSON.parse(store['st_run']);
ck(r.sector===2&&r.sectorMult===1.5&&Array.isArray(r.outposts)&&r.outposts.length===1,'sector state saved');
T.newGame(false);T.loadGame();
ck(G().sector===2&&G().outposts.length===1&&G().sectorMult===1.5,'sector state restored');
ck(G().outpostIncome>0,'outpost income recomputed on load',G().outpostIncome.toFixed(0)+'/s');

console.log(`\n  ${fails.length===0?'✅ SECTOR SYSTEM PASSES':'❌ FAILS: '+fails.join(' | ')}`);
process.exit(fails.length?1:0);
