/* RETURN HOOK TEST — offline pile + pile-then-goal greeting.
   The pile must be correctly capped, paid exactly once, and the greeting must
   always end in a live game (never a dead panel). */
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
const ctxStub=new Proxy({},{get(t,p){if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
 if(p==='measureText')return(s)=>({width:String(s).length*7.2});if(p==='canvas')return{width:1,height:1};
 if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha','globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];return()=>{};},set(t,p,v){t[p]=v;return true;}});
const canvas={width:0,height:0,style:{},getContext:()=>ctxStub,addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})};
const store={};
let NOW=1700000000000;
class FakeDate{constructor(...a){if(a.length)return new RealDate(...a);}
  static now(){return NOW;}}
const RealDate=Date;
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},requestAnimationFrame:()=>1,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>0}};
const sb={window:win,document:{getElementById:()=>canvas,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date:FakeDate,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`;globalThis.__T={get G(){return G},update,newGame,layout,resize,render,continueGame,
  offlinePile,saveGame,get OVERLAY_BTNS(){return OVERLAY_BTNS},get CONTRACTS(){return CONTRACTS},progress,
  collectPile,fmtDur};`,sb);
const T=sb.__T,G=()=>T.G;
let fails=[];const ck=(ok,l,x)=>{console.log(`  ${ok?'✅':'❌'} ${l}${x?'  ('+x+')':''}`);if(!ok)fails.push(l);};

// build a save with a known income and a known absence
T.resize();T.newGame(false);T.layout();G().scene='play';
G().coins=5000;G().earned=9000;G().income=100;G().mods[0]={slot:0,tier:3,pop:1,glow:0,spin:0,bob:0,x:0,y:0,home:{x:0,y:0},returning:false};
G().contract=14;G().endless=true;
T.saveGame();
const run=JSON.parse(store['st_run']);

// 1. pile maths: 50% rate, 8h cap, ignore <60s
NOW=run.savedAt+30*1000;      ck(T.offlinePile(run)===null,'absence under a minute pays nothing');
NOW=run.savedAt+3600*1000;    const h1=T.offlinePile(run);
ck(h1&&h1.amount===Math.floor(100*0.5*3600),'one hour away pays half rate for one hour','+'+h1.amount);
NOW=run.savedAt+3600*50*1000; const h50=T.offlinePile(run);
ck(h50.amount===Math.floor(100*0.5*8*3600),'fifty hours away is capped at eight','+'+h50.amount);
ck(T.fmtDur(3600+120)==='1h 2m','duration formatting',T.fmtDur(3720));

// 2. greeting order: pile panel first
NOW=run.savedAt+3600*1000;
T.continueGame();
ck(G().scene==='return','returning with a pile lands on the pile panel',G().scene);
T.render();
ck(T.OVERLAY_BTNS.length===1&&T.OVERLAY_BTNS[0].fn.name==='collectPile','pile panel has exactly one action: COLLECT',T.OVERLAY_BTNS[0].fn.name);
const coinsBefore=G().coins;
T.OVERLAY_BTNS[0].fn();                     // COLLECT
ck(G().coins===coinsBefore+h1.amount,'pile paid exactly','+'+(G().coins-coinsBefore));
ck(G().scene==='returngoal','then the best-next-goal panel',G().scene);
T.render();
ck(T.OVERLAY_BTNS.length===1,'goal panel has one action');
T.OVERLAY_BTNS[0].fn();                     // TO THE STATION
ck(G().scene==='play','greeting always ends in a live game',G().scene);

// 3. no double payment: continuing again must not re-offer the same pile
T.saveGame();
const run2=JSON.parse(store['st_run']);
NOW=run2.savedAt+10*1000;                   // 10s: below the 60s floor
T.continueGame();
ck(G().scene==='returngoal','short absence skips the pile panel',G().scene);
ck(!G().pendingPile,'no pile pending after collect');

// 4. a pre-endless save gets the authored contract as its greeting, not a commission
delete store['st_run'];
T.newGame(false);G().scene='play';G().coins=500;G().earned=800;G().income=20;G().contract=2;
T.saveGame();
const run3=JSON.parse(store['st_run']);
NOW=run3.savedAt+3600*1000;
T.continueGame();
ck(G().scene==='return','pre-endless return also greets',G().scene);
T.render();T.OVERLAY_BTNS[0].fn();
ck(G().scene==='returngoal','pile then goal, in order',G().scene);
const pr=T.progress();
ck(/^CONTRACT 3 \/ 14$/.test(pr.header),'pre-endless greeting shows the authored contract',pr.header);
T.render();T.OVERLAY_BTNS[0].fn();
ck(G().scene==='play','and ends in play',G().scene);

console.log(`\n  ${fails.length===0?'✅ RETURN HOOK PASSES':'❌ FAILS: '+fails.join(' | ')}`);
process.exit(fails.length?1:0);
