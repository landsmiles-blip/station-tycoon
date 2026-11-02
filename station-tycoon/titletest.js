/* TITLE-SCREEN GEOMETRY TEST.
   The shipped build put the NEW STATION button 21px below the fold and the
   best-score line entirely off-screen on a 390x844 phone - a returning player
   could not start a new game. Nothing in the old suite checked the title
   screen, so it sailed through. This does. */
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
let REC=null;
const ctxStub=new Proxy({},{get(t,p){
  if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
  if(p==='measureText')return(s)=>({width:String(s).length*7.2});
  if(p==='canvas')return{width:1080,height:1920};
  if(p==='fillText'&&REC)return(str,x,y)=>REC.text.push({s:String(str).slice(0,20),x,y});
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
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},newGame,layout,resize,drawTitle,render,
  get OVERLAY_BTNS(){return OVERLAY_BTNS},get L(){return L},get FW(){return FW},get FH(){return FH},
  get TUT(){return TUT},drawTutorial,get BUILD_BTN(){return BUILD_BTN},update,
  mkVenture,recompute,charterReady,saveGame,get CONTRACTS(){return CONTRACTS},get MAXSLOTS(){return MAXSLOTS}};`,sandbox);
const T=sandbox.__T;

const DEV=[["iPhone SE",375,667],["Small Android 16:9",360,640],["Galaxy Fold cover",344,882],
 ["iPhone 15",390,844],["Pixel 8",412,915],["iPhone 15 Pro Max",430,932],["iPad portrait",820,1180],
 ["Landscape phone",844,390],["Desktop 16:9",1920,1080],["Ultrawide 21:9",2560,1080],["Square 1:1",1080,1080],
 ["Tall 9:19.5",390,844],["Short landscape",667,375]];
let allOK=true;
console.log("=== TITLE SCREEN: bounds, overlap, touch targets ===");
for(const hasSave of [false,true]){
 console.log(`\n -- ${hasSave?'RETURNING player (CONTINUE + NEW STATION)':'FIRST-TIME player (START)'} --`);
 if(hasSave)store['st_run']=JSON.stringify({mods:[1,2,0,0],earned:4200,coins:100,contract:2,slots:5,built:4,merges:2,shipsDocked:3,stationTier:2,time:60});
 else delete store['st_run'];
 DEV.forEach(([n,w,h])=>{
  win.innerWidth=w;win.innerHeight=h;T.resize();T.newGame(false);T.layout();
  T.G.hasSave=hasSave;
  REC={text:[]};
  T.drawTitle();
  const FH=T.FH,FW=T.FW,B=T.OVERLAY_BTNS||[];
  const bad=[];
  if(!B.length)bad.push('no buttons registered');
  B.forEach((b,i)=>{
    if(b.y<0||b.y+b.h>FH)bad.push(`btn${i} offscreen y=${b.y.toFixed(0)}..${(b.y+b.h).toFixed(0)}/${FH.toFixed(0)}`);
    if(b.x<0||b.x+b.w>FW)bad.push(`btn${i} offscreen x`);
    if(b.h<44)bad.push(`btn${i} touch ${b.h.toFixed(0)}px<44`);
  });
  for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){
    const a=B[i],b=B[j];
    if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)bad.push(`btn${i}/btn${j} overlap`);
  }
  const off=REC.text.filter(t=>t.y<-2||t.y>FH+2);
  if(off.length)bad.push(`${off.length} text lines offscreen (worst y=${Math.max(...off.map(o=>o.y)).toFixed(0)})`);
  if(hasSave&&B.length<2)bad.push('NEW STATION missing');
  const ok=bad.length===0; if(!ok)allOK=false;
  console.log(`  ${n.padEnd(21)} ${String(w).padStart(4)}x${String(h).padStart(4)} ${T.L.landscape?'LAND':'PORT'} field=${Math.round(FW)}x${Math.round(FH)} btns=${B.length} `+
    (ok?`✓ all on-screen, no overlap`:`✗ ${bad.join('; ')}`));
 });
}
REC=null;
console.log(`\n  ${allOK?'✅ TITLE SCREEN PASSES ALL DEVICES':'❌ TITLE SCREEN FAILS'}\n`);
if(!allOK)process.exitCode=1;

/* ---- TUTORIAL OVERLAY: bubble on-screen, skip button reachable, ----
   ---- spotlight inside the field, no soft-lock                  ---- */
console.log("=== TUTORIAL OVERLAY ===");
let tutOK=true;
const TUTDEV=[["iPhone SE",375,667],["iPhone 15",390,844],["Galaxy Fold cover",344,882],
 ["Landscape phone",844,390],["Desktop 16:9",1920,1080],["Square 1:1",1080,1080]];
delete store['st_run'];delete store['st_tutdone'];
TUTDEV.forEach(([n,w,h])=>{
  win.innerWidth=w;win.innerHeight=h;T.resize();T.newGame(false);T.layout();
  T.G.scene='play';T.G.hasSave=false;
  T.TUT.start();
  const probs=[];
  // walk every step, including the merge step's guaranteed-two-modules promise
  for(let step=0;step<4;step++){
    T.TUT.i=step;T.TUT.prep(step);
    const live=T.G.mods.filter(Boolean).length;
    if(step===2&&live<2)probs.push(`merge step only has ${live} module(s) - unreachable`);
    REC={text:[]};T.drawTutorial();
    const FH=T.FH,FW=T.FW;
    REC.text.filter(t=>t.y<-2||t.y>FH+2).forEach(t=>probs.push(`step${step} text offscreen y=${t.y}`));
    const b=T.TUT.skipBtn;
    if(!b)probs.push(`step${step} no skip button`);
    else{
      if(b.y<0||b.y+b.h>FH||b.x<0||b.x+b.w>FW)probs.push(`step${step} SKIP offscreen`);
      if(b.h<28)probs.push(`step${step} SKIP too small (${b.h}px)`);
    }
    const r=T.TUT.rect();
    if(r&&(r.x<-40||r.y<-40||r.x+r.w>FW+40||r.y+r.h>FH+40))
      probs.push(`step${step} spotlight far offscreen`);
  }
  // anti soft-lock: every step must advance on its own timer
  T.TUT.start();const seen=[];let i=0;
  for(i=0;i<60*120;i++){T.update(1/60);if(T.G.tutStep>=0&&!seen.includes(T.G.tutStep))seen.push(T.G.tutStep);
    if(!T.TUT.active)break;}
  const secs=i/60;
  if(T.TUT.active)probs.push('never self-terminates (SOFT LOCK)');
  if(seen.length!==4)probs.push('visited steps '+JSON.stringify(seen)+' not [0,1,2,3]');
  if(secs>70)probs.push(`idle ceiling ${secs.toFixed(0)}s > 70s`);
  const ok=probs.length===0;if(!ok)tutOK=false;
  console.log(`  ${n.padEnd(21)} ${String(w).padStart(4)}x${String(h).padStart(4)} ${ok?'✓ 4 steps on-screen, all reachable, idle ceiling '+secs.toFixed(0)+'s':'✗ '+probs.join('; ')}`);
});
console.log(`\n  ${tutOK?'✅ TUTORIAL PASSES':'❌ TUTORIAL FAILS'}`);
if(!tutOK)process.exitCode=1;

/* ---- EVERY OVERLAY ON EVERY DEVICE ----------------------------------------
   A button that hangs off the bottom of the screen is a dead end, and on a
   platform with no exit button a dead end ends the session. The completion
   overlay grew a third button when the end-of-spine charter was added, which is
   exactly how this class of bug arrives - so the whole family is now measured:
   paused (6 buttons), completion (3), charter, franchise list (paginated),
   return pile and return goal. */
console.log("\n=== EVERY OVERLAY FITS EVERY DEVICE ===");
let ovOK=true;
const ODEV=[["iPhone SE",375,667],["Small Android 16:9",360,640],["Galaxy Fold cover",344,882],
 ["iPhone 15",390,844],["Landscape phone",844,390],["Short landscape",667,375],
 ["Desktop 16:9",1920,1080],["Square 1:1",1080,1080],["iPad portrait",820,1180]];
REC=null;
function richState(){
  T.newGame(false);T.layout();
  const G=T.G;
  G.contract=T.CONTRACTS.length;G.endless=true;G.earned=164923;G.coins=88000;
  G.merges=127;G.shipsDocked=206;G.built=130;G.commission=6;G.time=1400;
  G.ventures=[T.mkVenture(0),T.mkVenture(1),T.mkVenture(2)];
  G.ventures[0].charterTaken=true;G.ventures[0].charterSeen=true;G.ventures[0].dividend=412;
  G.ventures[1].charterTaken=true;G.ventures[1].charterSeen=true;G.ventures[1].dividend=640;
  G.activeV=2;G.slots=8;G.ventures[2].commission=6;   // gate for act IV is 6
  for(let i=0;i<8;i++)G.mods[i]={slot:i,tier:(i%8)+1,pop:0,glow:0,spin:i,bob:i,x:0,y:0,home:{x:0,y:0}};
  G.freight={i:2,cost:5000,pay:17000,t:120,dur:420,wall:Date.now()};
  T.recompute();
  G.pendingPile={amount:48210,away:900,secs:900,rate:53};
  return G;
}
const SCENES=[
  ['paused',      G=>{G.scene='paused';},                       6],
  ['completion',  G=>{G.scene='done';G.pendingPile=null;},       3],
  ['charter',     G=>{G.scene='sector';G.pendingPile=null;},     2],
  ['franchise list',G=>{G.scene='switch';G.pendingPile=null;
                        while(G.ventures.length<9)G.ventures.push(T.mkVenture(G.ventures.length));},1],
  ['return pile', G=>{G.scene='return';},                        1],
  ['return goal', G=>{G.scene='returngoal';G.pendingPile=null;}, 1]
];
ODEV.forEach(([n,w,h])=>{
  const probs=[];let total=0;
  SCENES.forEach(([label,setup,minBtns])=>{
    win.innerWidth=w;win.innerHeight=h;T.resize();
    const G=richState();setup(G);
    T.layout();T.render();
    const B=T.OVERLAY_BTNS||[],FH=T.FH,FW=T.FW;
    total+=B.length;
    if(B.length<minBtns)probs.push(label+': only '+B.length+' controls');
    B.forEach((b,i)=>{
      if(b.y<-1||b.y+b.h>FH+1)probs.push(label+': btn'+i+' offscreen y '+Math.round(b.y)+'..'+Math.round(b.y+b.h)+'/'+Math.round(FH));
      if(b.x<-1||b.x+b.w>FW+1)probs.push(label+': btn'+i+' offscreen x');
      if(b.h<32||b.w<44)probs.push(label+': btn'+i+' touch '+Math.round(b.w)+'x'+Math.round(b.h));
    });
    for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){
      const a=B[i],b=B[j];
      if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)probs.push(label+': btn'+i+'/'+btnLabel(B,j)+' overlap');
    }
    // the way forward must be a proper thumb target
    if(B.length&&!B.some(b=>b.h>=44))probs.push(label+': no control reaches 44px');
  });
  const ok=probs.length===0;if(!ok)ovOK=false;
  console.log('  '+n.padEnd(21)+String(w).padStart(4)+'x'+String(h).padStart(4)+' '+
    (ok?'\u2713 6 overlays, '+total+' controls, all on-screen and thumb-sized'
       :'\u2717 '+probs.slice(0,4).join('; ')+(probs.length>4?' (+'+(probs.length-4)+')':'')));
});
function btnLabel(B,j){return (B[j]&&B[j].label)?B[j].label:('btn'+j);}
console.log('\n  '+(ovOK?'\u2705 EVERY OVERLAY FITS EVERY DEVICE':'\u274c OVERLAY GEOMETRY FAILS'));
if(!ovOK)process.exitCode=1;
