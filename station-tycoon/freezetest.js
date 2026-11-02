/* FREEZE REGRESSION TEST.
   Real defect: visibilitychange set `paused=true` on hide but the show branch
   never cleared it, so the first focus loss froze the simulation forever -
   and because shake only decayed inside update(), the contract-14 celebration
   shake stayed pinned at full amplitude, re-randomised every frame: a violent
   permanent jitter over a completely dead game. Exactly what the player saw
   after pressing KEEP BUILDING. */
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
const ctxStub=new Proxy({},{get(t,p){
  if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
  if(p==='measureText')return(s)=>({width:String(s).length*7.2});
  if(p==='canvas')return{width:1080,height:1920};
  if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha',
      'globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];
  return()=>{};},set(t,p,v){t[p]=v;return true;}});
const canvas={width:0,height:0,style:{},getContext:()=>ctxStub,addEventListener(){},setPointerCapture(){},
  getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})};
const store={};const DOC_LISTENERS={};
const doc={getElementById:id=>id==='c'?canvas:null,hidden:false,
  addEventListener:(t,f)=>{(DOC_LISTENERS[t]=DOC_LISTENERS[t]||[]).push(f);},
  fire:(t)=>{(DOC_LISTENERS[t]||[]).forEach(f=>f());}};
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},requestAnimationFrame:()=>1,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>0}};
const sb={window:win,document:doc,localStorage:win.localStorage,performance:win.performance,
  requestAnimationFrame:win.requestAnimationFrame,console,Math,Date,JSON,parseInt,parseFloat,isNaN,
  setTimeout:()=>0,setInterval:()=>0,clearInterval(){},Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},update,render,newGame,layout,resize,tryBuild,doMerge,
  get OVERLAY_BTNS(){return OVERLAY_BTNS},get Platform(){return Platform},init:()=>Platform.init(),
  get MAXTIER(){return MAXTIER},juice};`,sb);
const T=sb.__T,G=()=>T.G;
T.resize();T.newGame(false);T.layout();T.init();T.G.scene='play';
const dt=1/120;let t=0,act=0;
while(t<2400&&G().scene==='play'){
  T.update(dt);t+=dt;act-=dt;
  if(act<=0){act=1/3;
    let best=-1,ba=null,bb=null;
    G().mods.forEach((m,i)=>{if(!m)return;G().mods.forEach((o,j)=>{
      if(j<=i||!o)return;if(o.tier===m.tier&&m.tier<T.MAXTIER&&m.tier>best){best=m.tier;ba=m;bb=o;}});});
    if(ba)T.doMerge(ba,bb);else T.tryBuild();}
}
if(G().scene!=='done'){console.log('❌ never reached EMPIRE COMPLETE');process.exit(1);}
console.log("reached EMPIRE COMPLETE at "+Math.round(t)+"s, shake="+G().shake.toFixed(2));

let fails=[];
const check=(ok,label,extra)=>{console.log(`  ${ok?'✅':'❌'} ${label}${extra?'  ('+extra+')':''}`);if(!ok)fails.push(label);};

// 1. tab loses focus, then regains it  (the exact thing the preview panel does)
doc.hidden=true;  doc.fire('visibilitychange');
check(T.Platform.isPaused()===true,'hide pauses the sim');
doc.hidden=false; doc.fire('visibilitychange');
check(T.Platform.isPaused()===false,'SHOW CLEARS the pause flag (was the bug)');

// 2. press the real KEEP BUILDING button from the real overlay
T.render();
const kb=T.OVERLAY_BTNS.find(b=>true)&&T.OVERLAY_BTNS[T.OVERLAY_BTNS.length-1];
kb.fn();
check(G().scene==='play','KEEP BUILDING returns to play');
check(T.Platform.isPaused()===false,'platform pause cleared on player-initiated resume');

// 3. the simulation must actually be alive afterwards
const c0=G().coins;
for(let i=0;i<120;i++)T.update(dt);
check(G().coins>c0,'credits accrue after resume','+'+Math.round(G().coins-c0)+' in 1s');

// 4. shake must decay to nothing even if the sim were somehow paused
G().shake=11;
for(let i=0;i<60;i++)T.juice(dt);     // 0.5s of WALL clock, sim state untouched
check(G().shake<0.5,'celebration shake decays on wall clock',G().shake.toFixed(2));
const src=fs.readFileSync('index.html','utf8');
const upd=src.match(/function update\(dt\)\{[\s\S]*?\n\}/)[0];
check(!/G\.shake=Math\.max\(0,G\.shake-/.test(upd),'update() no longer owns shake decay (so a paused sim cannot freeze it)');
check(/function juice\(dt\)/.test(src)&&/juice\(dt\);/.test(src.match(/function frame\(now\)\{[\s\S]*?\n\}/)[0]),
      'frame() drives juice every rendered frame');

console.log(`\n  ${fails.length===0?'✅ FREEZE REGRESSION PASSES':'❌ FAILS: '+fails.join(', ')}`);
process.exit(fails.length?1:0);
