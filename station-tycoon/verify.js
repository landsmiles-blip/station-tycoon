const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
const ctxStub=new Proxy({},{get(t,p){
  if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
  if(p==='measureText')return()=>({width:100});
  if(p==='canvas')return{width:1080,height:1920};
  if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha',
      'globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];
  return()=>{};},set(t,p,v){t[p]=v;return true;}});
const canvas={width:0,height:0,style:{},getContext:()=>ctxStub,addEventListener(){},setPointerCapture(){},
  getBoundingClientRect:()=>({left:0,top:0,width:1080,height:1920})};
const store={};
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},
  requestAnimationFrame:()=>1,localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  performance:{now:()=>0}};
const sandbox={window:win,document:{getElementById:id=>id==='c'?canvas:null,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},update,newGame,layout,resize,tryBuild,doMerge,
 progress,rate,buildCost,CONTRACTS,MAXSLOTS,STARTSLOTS,MAXTIER,slotPos,recompute,
 get L(){return L},get FW(){return FW},get FH(){return FH},get S(){return S},get LAND(){return LAND},
 modRadius,saveGame,loadGame};`,sandbox);
const T=sandbox.__T,F=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

console.log("=== DEVICE MATRIX: legibility, touch targets, layout collisions ===");
const DEV=[["iPhone SE",375,667],["Small Android 16:9",360,640],["Galaxy Fold cover",344,882],
 ["iPhone 15",390,844],["Pixel 8",412,915],["iPhone 15 Pro Max",430,932],["iPad portrait",820,1180],
 ["Landscape phone",844,390],["Desktop 16:9",1920,1080],["Ultrawide 21:9",2560,1080],["Square 1:1",1080,1080]];
let allOK=true;
DEV.forEach(([n,w,h])=>{
  win.innerWidth=w;win.innerHeight=h;T.resize();T.newGame(false);T.layout();
  const L=T.L,S=T.S,R=T.modRadius();
  const minText=13*S, touch=2*R*1.6*S;
  // collision: contract card vs station ring, station vs build bar
  const cardBot=L.cardY+78, staTop=L.hubY-L.rad-R, staBot=L.hubY+L.rad+R;
  const hits=[];
  const staL=L.hubX-L.rad-R, staR=L.hubX+L.rad+R;
  const cardR=L.cardX+L.cardW;
  const vOverlap=cardBot>staTop;
  const hOverlap=!(staR<L.cardX||staL>L.cardX+L.cardW);   // 2D test, not just Y
  if(vOverlap&&hOverlap) hits.push('card/station');
  if(staBot>L.barY&&!(L.landscape&&staR<L.barX)) hits.push('station/bar');
  if(L.toastY+44>L.barY) hits.push('toast/bar');
  if(L.cardY+78>L.barY) hits.push('card/bar');
  if(staR>T.FW||staL<0) hits.push('station/offscreen');
  const ok=minText>=11&&touch>=44&&hits.length===0;
  if(!ok)allOK=false;
  console.log(`  ${n.padEnd(21)} ${String(w).padStart(4)}x${String(h).padStart(4)} ${L.landscape?'LAND':'PORT'} S=${S.toFixed(2)} field=${Math.round(T.FW)}x${Math.round(T.FH)}`+
    ` text=${minText.toFixed(1)}px${minText>=11?'✓':'✗'} touch=${touch.toFixed(0)}px${touch>=44?'✓':'✗'} ${hits.length?'⚠ OVERLAP: '+hits.join(', '):'✓ no overlap'}`);
});
console.log(`\n  ${allOK?'✅ ALL DEVICES PASS':'❌ some devices fail'}\n`);
win.innerWidth=390;win.innerHeight=844;T.resize();

console.log("=== BALANCE (real shipped code, portrait) ===");
T.newGame(false);T.layout();T.G.scene='play';
let t=0,dt=1/60,a=0,last=0,log=[];
while(t<2400&&T.G.scene==='play'){
  T.update(dt);t+=dt;a-=dt;
  if(a<=0){a=1/3;let best=-1,ba=null,bb=null;
    T.G.mods.forEach((m,i)=>{if(!m)return;T.G.mods.forEach((o,j)=>{
      if(j<=i||!o)return;if(o.tier===m.tier&&m.tier<T.MAXTIER&&m.tier>best){best=m.tier;ba=m;bb=o;}});});
    if(ba)T.doMerge(ba,bb);else T.tryBuild();}
  if(T.G.contract>last){log.push([t,T.CONTRACTS[last].t,T.G.income,T.G.stationTier,T.G.slots]);last=T.G.contract;}
}
log.forEach(([tt,lbl,inc,ti,sl],i)=>console.log(`   ${F(tt).padStart(5)}  #${String(i+1).padStart(2)} ${lbl.padEnd(26)} income ${inc.toFixed(0).padStart(4)}/s  T${ti}  ${sl} slots`));
console.log(`\n  contracts ${T.G.contract}/14 | session ${F(t)} (${(t/60).toFixed(1)} min) | avg reward gap ${(t/log.length).toFixed(0)}s`);
console.log(`  end scene '${T.G.scene}' | income ${T.G.income.toFixed(0)}/s | earned ${Math.round(T.G.earned).toLocaleString()} | merges ${T.G.merges} | T${T.G.stationTier}`);
console.log(`  ${(T.G.contract===14&&T.G.scene==='done'&&t>=480)?'✅ PASSES Playgama ~10min bar with a real completion state':'❌ FAIL'}\n`);

console.log("=== PERSISTENCE ===");
console.log(`  best saved ....... ${store['st_best']?'✅':'❌'}   run saved ....... ${store['st_run']?'✅':'❌'}`);
const r=JSON.parse(store['st_run']||'{}');
console.log(`  payload .......... ${r.mods?`✅ ${r.mods.filter(Boolean).length} modules, tier data intact, contract ${r.contract}`:'❌'}`);
T.newGame(false);
console.log(`  CONTINUE offered . ${T.G.hasSave?'✅':'❌'}`);
vm.runInContext('globalThis.__L=loadGame();',sandbox);
console.log(`  restore works .... ${sandbox.__L?'✅':'❌'}`);
