/* RENDER SMOKE TEST: drive the REAL render() through a mid-game state with
   ships, credits, merges, the tutorial and every overlay on screen. A throw
   anywhere means a black screen on a real device. */
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const grad=()=>({addColorStop(){}});
let ops=0;
const ctxStub=new Proxy({},{get(t,p){
  ops++;
  if(p==='createLinearGradient'||p==='createRadialGradient')return grad;
  if(p==='measureText')return(s)=>({width:String(s).length*7.2});
  if(p==='canvas')return{width:1080,height:1920};
  if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha',
      'globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];
  return()=>{};},set(t,p,v){t[p]=v;return true;}});
const canvas={width:0,height:0,style:{},getContext:()=>ctxStub,addEventListener(){},setPointerCapture(){},
  getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})};
const store={};
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},requestAnimationFrame:()=>1,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>0}};
const sb={window:win,document:{getElementById:id=>id==='c'?canvas:null,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},newGame,layout,resize,update,render,tryBuild,doMerge,
  get TUT(){return TUT},spawnShip,spawnCred,recompute,slotPos,pauseGame,resumeGame,completeContract,
  mkVenture,spawnOrder,spawnGuest,tanksInit,startCrack,plantCrop,get TANK_CAP(){return TANK_CAP},saveGame,identOf,ventureShort,openSwitch,switchVenture,arriveTravel,
  get FW(){return FW},get FH(){return FH},get OVERLAY_BTNS(){return OVERLAY_BTNS},
  get FRANCHISE_BTN(){return FRANCHISE_BTN},get BUILD_BTN(){return BUILD_BTN},
  get CONTRACTS(){return CONTRACTS},get CLONE_BTN(){return CLONE_BTN},
  spawnDaily,spawnGolden,startEvent,openStreak,streakInit,get ICON_STREAK(){return ICON_STREAK}};`,sb);
const T=sb.__T;
let errs=[];
function shot(label,fn){
  const before=errs.length;
  try{fn();T.render();}catch(e){errs.push(label+': '+e.message);}
  console.log(`  ${errs.length>before?'❌':'✅'} ${label.padEnd(40)} ${ops} draw ops total`);
}
console.log("=== RENDER SMOKE (real render(), real draw paths) ===");
[['iPhone 15 portrait',390,844],['Landscape phone',844,390],['Galaxy Fold cover',344,882],['Square 1:1',1080,1080]].forEach(([n,w,h])=>{
  win.innerWidth=w;win.innerHeight=h;T.resize();T.newGame(false);T.layout();T.G.scene='title';
  shot(n+' / title screen',()=>{});
  T.G.scene='play';T.TUT.start();
  // build a rich mid-game state: 9 modules across tiers, ships in every phase, coins in flight
  for(let i=0;i<Math.min(9,T.G.slots);i++){T.G.mods[i]=null;}
  T.G.slots=9;
  for(let i=0;i<9;i++){const m={slot:i,tier:(i%8)+1,pop:1,glow:(i%3)/3,spin:i*0.4,bob:i*0.7,returning:false,x:0,y:0,credT:0};
    const p=T.slotPos(i);m.x=p.x;m.y=p.y;m.home=p;T.G.mods[i]=m;}
  T.recompute();
  for(let i=0;i<4;i++){T.spawnShip();const s=T.G.ships[T.G.ships.length-1];if(s)s.phase=['in','dock','out','dock'][i];}
  for(let i=0;i<18;i++)T.spawnCred(120+i*8,400-i*6,'#FFD24A',i%4===0);
  T.G.credPulse=1;T.G.shake=6;T.G.flash=0.2;T.G.stationTier=8;
  shot(n+' / play + ships + credit stream',()=>{});
  for(let k=0;k<4;k++){T.TUT.i=k;T.TUT.prep(k);shot(n+' / tutorial step '+(k+1)+' ('+T.G.tutStep+')',()=>{});}
  shot(n+' / paused overlay',()=>{T.G.scene='paused';});
  shot(n+' / completion overlay',()=>{T.G.scene='done';});
  // franchise scenes: charter, list, travel, and the Bazaar ticket strip
  shot(n+' / venture II + order tickets',()=>{
    T.G.ventures.push(T.mkVenture(1));T.G.activeV=1;T.G.scene='play';
    T.G.orders=[];for(let i=0;i<3;i++)T.spawnOrder();});
  // act III: the Drydock's route cards, idle and with a freighter in flight
  shot(n+' / venture III route cards',()=>{
    while(T.G.ventures.length<3)T.G.ventures.push(T.mkVenture(T.G.ventures.length));
    T.G.activeV=2;T.G.scene='play';T.G.orders=[];T.G.freight=null;T.G.coins=1e7;T.layout();});
  shot(n+' / freighter in flight (countdown)',()=>{
    T.G.freight={i:2,cost:5000,pay:17000,t:120,dur:420,wall:Date.now()};});
  shot(n+' / venture IV guest cards',()=>{
    T.G.freight=null;
    while(T.G.ventures.length<4)T.G.ventures.push(T.mkVenture(T.G.ventures.length));
    T.G.activeV=3;T.G.scene='play';T.G.orders=[];T.layout();
    T.G.guests=[];for(let i=0;i<3;i++)T.spawnGuest();});
  shot(n+' / venture V tanks + cracking',()=>{
    while(T.G.ventures.length<5)T.G.ventures.push(T.mkVenture(T.G.ventures.length));
    T.G.activeV=4;T.G.scene='play';T.G.orders=[];T.G.guests=[];
    T.G.contract=T.CONTRACTS.length;T.G.endless=true;T.layout();
    T.tanksInit();T.G.tanks[0].v=420;T.G.tanks[0].fill=12;T.G.tanks[0].d=1.62;
    T.G.tanks[1].v=980;T.G.tanks[1].fill=T.TANK_CAP;T.G.tanks[1].d=0.74;
    if(T.G.mods[0])T.startCrack(T.G.mods[0]);});
  shot(n+' / venture VI crops + compost',()=>{
    while(T.G.ventures.length<6)T.G.ventures.push(T.mkVenture(T.G.ventures.length));
    T.G.activeV=5;T.G.scene='play';T.layout();
    if(T.G.mods[0])T.plantCrop(T.G.mods[0]);
    if(T.G.mods[1]){T.plantCrop(T.G.mods[1]);T.G.mods[1].crop.t=99;}
    if(T.G.mods[2])T.G.mods[2].compostT=22;});
  shot(n+' / daily contract + rush hour',()=>{
    T.G.scene='play';
    T.G.streak=T.streakInit();T.G.streak.n=3;T.G.streak.tokens.clone=1;T.G.streak.freezes=1;
    T.G.orders=[];T.spawnDaily();T.spawnGolden();
    T.G.event={kind:'rush',t:31,dur:45};});
  shot(n+' / streak panel',()=>{T.openStreak();});
  shot(n+' / expansion charter',()=>{T.G.scene='sector';});
  shot(n+' / franchise list',()=>{T.G.scene='switch';});
  shot(n+' / travel transition',()=>{T.G.travel={to:0,t:0.6,fresh:false};T.G.scene='travel';});
  shot(n+' / title with empire',()=>{T.G.travel=null;T.G.scene='title';T.G.hasSave=true;T.saveGame();});
  shot(n+' / back in venture I',()=>{T.G.scene='play';T.G.activeV=0;T.arriveTravel();});
  T.G.scene='play';T.TUT.stop();
});
console.log(`\n  ${errs.length===0?'✅ NO RENDER ERRORS across 4 viewports x 21 states':'❌ '+errs.join(' | ')}`);
process.exit(errs.length?1:0);
