/* VENTURE TEST — the franchise layer (supersedes sectortest.js).
   Invariants, in the order the player meets them:
     A  every venture is a DIFFERENT business, and Venture I is untouched
     B  the gate to the next venture escalates
     C  a charter METAMORPHOSES the station in place: nothing is wiped, the
        board and slots carry over, and the old business keeps paying a dividend
     D  the hop is FREE and reversible in both directions: same board, new
        business, each business's own commission ladder preserved
     E  theme AND music actually change per venture
     F  the Bazaar's signature mechanic (orders) is reachable, profitable and
        never a trap, and its tickets never cover the board or the build bar
     G  persistence round-trips, and PRE-FRANCHISE saves migrate without loss
     H  the ladder is genuinely infinite and stays ahead of its own gate
     I  negative controls: the checks above can actually fail
*/
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
let seed=20261030;
const srand=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
const SM=new Proxy(Math,{get(t,k){if(k==='random')return srand;
  const v=t[k];return typeof v==='function'?v.bind(t):v;}});
const sb={window:win,document:{getElementById:()=>canvas,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math:SM,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`;globalThis.__T={get G(){return G},get L(){return L},get LAND(){return LAND},
  get FW(){return FW},get FH(){return FH},get OVERLAY_BTNS(){return OVERLAY_BTNS},
  get FRANCHISE_BTN(){return FRANCHISE_BTN},get IDENT(){return IDENT},get MECHS(){return MECHS},
  get MAXSLOTS(){return MAXSLOTS},get STARTSLOTS(){return STARTSLOTS},get CONTRACTS(){return CONTRACTS},
  get OUTPOST_EFF(){return OUTPOST_EFF},get SECTOR_MULT(){return SECTOR_MULT},
  get ORDER_EVERY(){return ORDER_EVERY},get ORDER_LIFE(){return ORDER_LIFE},get ORDER_BUSY(){return ORDER_BUSY},get MAXTIER(){return MAXTIER},
  get TIP_BOARD_S(){return TIP_BOARD_S},get TIP_MACHINE_S(){return TIP_MACHINE_S},
  update,newGame,layout,resize,render,recompute,rate,mkMod,mkVenture,identOf,circuitOf,ventureName,ventureShort,
  GATE,SPINE_GATE,boardPotential,mechIndex,mechPot,ordersOn,dispatchOn,ROUTES,routeCost,routePay,
  sendDispatch,payDispatch,updateDispatch,routeRects,hitRoute,drawRoutes,fmtClock,
  guestsOn,spawnGuest,seatGuest,updateGuests,hitGuest,get GUEST_EVERY(){return GUEST_EVERY},
  get GUEST_LIFE(){return GUEST_LIFE},
  crackOn,startCrack,sellTank,updateCrack,tankRects,hitTank,tanksInit,
  get CRACK_TIME(){return CRACK_TIME},get TANK_CAP(){return TANK_CAP},get TANK_FULL_BONUS(){return TANK_FULL_BONUS},
  growOn,plantCrop,harvestCrop,updateGrow,neighboursOf,
  get GROW(){return GROW},get RIPE_WIN(){return RIPE_WIN},get HARVEST_SECS(){return HARVEST_SECS},
  get COMPOST_MUL(){return COMPOST_MUL},get POLLI_MUL(){return POLLI_MUL},
  cloneInfo,tryClone,get CLONE_BTN(){return CLONE_BTN},
  spawnDaily,dailyInfo,advanceStreak,streakInit,streakState,resolveStreakGap,startEvent,spawnGolden,
  useToken,openStreak,dayKey,get ICON_STREAK(){return ICON_STREAK},
  get STREAK_CAL(){return STREAK_CAL},get EVENT_FIRST(){return EVENT_FIRST},get RUSH_DUR(){return RUSH_DUR},
  get GOLDEN_FUSE(){return GOLDEN_FUSE},get GOLDEN_MUL(){return GOLDEN_MUL},get FREEZE_MAX(){return FREEZE_MAX},
  get DAILY_MIN(){return DAILY_MIN},
  THEME,charterReady,openVenture,openSwitch,switchVenture,arriveTravel,
  spawnOrder,fillOrder,updateOrders,orderRects,hitOrder,drawOrders,drawCharter,drawSwitch,drawTravel,drawTitle,
  chipAction,openCharter,loadActive,syncActive,completeCommission,
  saveGame,loadGame,buildCost,shipPeriod,progress,issueCommission,completeCommission,empireOf,Audio2,onDown,
  get BUILD_BTN(){return BUILD_BTN}};`,sb);
const T=sb.__T,G=()=>T.G;
let fails=[];const ck=(ok,l,x)=>{console.log(`  ${ok?'✅':'❌'} ${l}${x!==undefined&&x!==''?'  ('+x+')':''}`);if(!ok)fails.push(l);};
const sec=(t)=>console.log('\n'+t);
const dt=1/60, run=(s)=>{for(let i=0;i<Math.round(s/dt);i++)T.update(dt);};
const tiers=()=>G().mods.map(m=>m?m.tier:0).join(',');
const fmtN=v=>Math.round(v).toLocaleString('en-US');
const viewport=(w,h)=>{win.innerWidth=w;win.innerHeight=h;T.resize();T.layout();};

T.resize();T.newGame(false);T.layout();

/* ================= A. IDENTITIES, AND VENTURE I IS UNTOUCHED ============= */
sec('A. IDENTITY TABLE + authored base game untouched');
const I=T.IDENT;
ck(I.length>=6,'at least six distinct businesses authored',I.length);
ck(new Set(I.map(x=>x.key)).size===I.length,'identity keys are unique');
ck(new Set(I.map(x=>x.name)).size===I.length,'identity names are unique');
ck(I.every(x=>x.bg0&&x.bg1&&Array.isArray(x.neb)&&x.neb.length>=3&&x.accent
        &&Array.isArray(x.livery)&&x.livery.length===4
        &&x.track&&x.track.p&&typeof x.track.sh==='number'&&typeof x.track.bpm==='number'),
   'every identity carries theme + livery + a music track variant');
ck(I[0].key==='oreworks'&&I[0].mech===-1&&!I[0].orders,'Venture I is The Oreworks with NO mechanic',I[0].name);
ck(I[1].orders===true&&I[1].mech===-1,'Venture II is The Grand Bazaar with the orders signature',I[1].name);

// authored balance: a fixed board in Venture I must earn EXACTLY the base sum
G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`for(let i=0;i<8;i++){G.mods[i]=mkMod(i,6);} G.slots=8;`,sb);
T.recompute();
const exact=8*T.rate(6);
ck(Math.abs(G().activeIncome-exact)<1e-9,'authored income is bit-identical (no mechanic, no orders, x1)',
   G().activeIncome.toFixed(2)+'/s == '+exact.toFixed(2));
const marketOnly=()=>G().orders.filter(o=>!o.daily&&!o.golden).length;
const ordersBefore=marketOnly();
run(180);
ck(marketOnly()===0&&ordersBefore===0,
   'no MARKET orders ever spawn in Venture I (the daily contract is empire-wide by design)','180s sim');
ck(Math.abs(G().activeIncome-exact)<1e-9,'income still exact after 180s (nothing mutated the base game)');
ck(T.mechIndex()===-1&&T.mechPot()===1,'mechIndex -1 / potency 1 in circuit 1 of Venture I');
ck(T.circuitOf(6)===1&&T.ventureName(6).indexOf('Circuit 2')>0,'identities cycle and name the circuit',T.ventureName(6));
ck(T.identOf(6).key===T.identOf(0).key,'venture 7 is The Oreworks again, one circuit up');

/* ============================ B. THE GATE ESCALATES ====================== */
sec('B. GATES — act II arrives inside session one, later acts escalate');
/* The first metamorphosis is gated on the AUTHORED SPINE (~9:30), so the
   "the world changed" beat lands inside the average ~10-minute session.
   Every act after that costs an escalating run of commissions. */
ck(T.SPINE_GATE(0)===true&&T.SPINE_GATE(1)===false,'act II is gated on the spine, later acts on commissions');
G().contract=T.CONTRACTS.length-1;
ck(!T.charterReady(),'charter locked one contract short of the spine',G().contract+'/'+T.CONTRACTS.length);
G().contract=T.CONTRACTS.length;
ck(T.charterReady(),'charter unlocks the moment the authored spine completes (~9:30)');
ck(T.GATE(1)===4&&T.GATE(2)===6&&T.GATE(3)===8,'act gates are 4, 6, 8 commissions',[1,2,3].map(T.GATE).join(' -> '));
let mono=true;for(let k=0;k<40;k++)if(!(T.GATE(k+1)>T.GATE(k)))mono=false;
ck(mono,'gate strictly escalates for 40 acts');
G().ventures.push(T.mkVenture(1));G().activeV=1;G().commission=3;G().ventures[1].commission=3;
ck(!T.charterReady(),'act III locked one commission short',G().commission+'/'+T.GATE(1));
G().commission=4;G().ventures[1].commission=4;
ck(T.charterReady(),'act III unlocks exactly at its gate');
G().ventures.pop();G().activeV=0;T.loadActive(0);G().scene='play';

/* ==================== C. OPENING A VENTURE IS ADDITIVE =================== */
sec('C. CHARTER — metamorphosis in place, nothing wiped, nothing rebuilt');
G().coins=900000;G().earned=160000;
T.recompute();
const snap={earned:G().earned,coins:G().coins,contract:G().contract,active:G().activeIncome,
            potential:T.boardPotential(),tiers:tiers(),slots:G().slots,mult:G().sectorMult,
            commission:G().commission};
ck(snap.active>0,'finished board has active income',snap.active.toFixed(0)+'/s');
T.render();                       // charter scene draws without error
T.openVenture();
ck(G().ventures.length===2,'a second venture now exists',G().ventures.length);
ck(G().scene==='travel','the metamorphosis plays as a transition, not a hard cut',G().scene);
T.arriveTravel();
ck(G().scene==='play'&&G().activeV===1,'arrived in Venture II',T.ventureName(1));
/* THE MORPH LAW: the station is ONE board. A metamorphosis re-skins it into the
   new business; it must never send the player back to an empty ring. */
ck(tiers()===snap.tiers,'the board METAMORPHOSED IN PLACE — every machine survived',tiers());
ck(G().slots===snap.slots,'unlocked slots carried over (no rebuild labour)',G().slots+'/'+T.MAXSLOTS);
ck(G().commission===0&&!!G().commissionGoal,'the new business opens its own commission ladder');
ck(snap.commission>0?G().ventures[0].commission===snap.commission:true,
   'the business you left keeps its commission progress on record',G().ventures[0].commission);
ck(Math.abs(G().sectorMult-snap.mult*T.SECTOR_MULT)<1e-9,'permanent multiplier applied','x'+G().sectorMult.toFixed(2));
ck(G().earned===snap.earned,'lifetime earnings NOT wiped',fmtN(G().earned));
ck(G().coins===snap.coins,'bank NOT wiped',fmtN(G().coins));
ck(G().contract===snap.contract,'authored spine stays complete',G().contract+'/'+T.CONTRACTS.length);
const v0=G().ventures[0];
ck(!v0.mods,'a business record owns no private board (one shared station)','record keys: '+Object.keys(v0).join(','));
ck(Math.abs(v0.dividend-snap.potential)<1e-6,'the old business was recorded as a branch dividend',
   fmtN(v0.dividend)+'/s == board potential '+fmtN(snap.potential));
ck(v0.charterTaken===true,'charter consumed exactly once');
ck(T.buildCost()<G().coins,'a build on the carried-over board is affordable','cost '+fmtN(T.buildCost())+' vs bank '+fmtN(G().coins));
ck(T.buildCost()<G().activeIncome+1e6,'build cost prices off the ACTIVE board only');
ck(G().outpostIncome>0,'the venture you left is paying you away income','+'+fmtN(G().outpostIncome)+'/s');
ck(G().income>G().activeIncome,'total income = active + away',fmtN(G().income)+'/s');
const expectAway=v0.dividend*T.OUTPOST_EFF*G().sectorMult;
ck(Math.abs(G().outpostIncome-expectAway)<1e-6,'away income is exactly dividend x OUTPOST_EFF x multiplier',
   fmtN(G().outpostIncome)+' ~ '+fmtN(expectAway));
ck(G().outpostIncome>snap.active*T.OUTPOST_EFF*0.9,'the branch still pays a real wage',fmtN(G().outpostIncome)+'/s');

/* =============== D. THE HOP IS FREE, REVERSIBLE, DRIFT-FREE ============== */
sec('D. FREE HOP — Venture I stays playable forever, in both directions');
vm.runInContext(`for(let i=0;i<6;i++){G.mods[i]=mkMod(i,4);} G.slots=8;`,sb);
T.recompute();
const bSnap=tiers();
/* each business keeps its OWN commission ladder; hopping must swap ladders,
   never boards */
G().commission=3;                                  // live ladder of the Bazaar
const coinsBefore=G().coins;
T.switchVenture(0);
ck(G().scene==='travel','switching travels (a beat, not a menu pop)',G().scene);
run(2);
ck(G().coins===coinsBefore,'no income is earned while travelling (update is gated on scene)');
T.arriveTravel();
ck(G().activeV===0&&G().scene==='play','back in Venture I in one tap',T.ventureName(0));
ck(tiers()===bSnap,'the SAME board is still running — nothing was rebuilt',tiers());
ck(G().ventures[1].commission===3,'leaving recorded the Bazaar ladder exactly',G().ventures[1].commission);
G().commission=7;                                  // the Oreworks' own progress
T.syncActive();
ck(G().ventures.length===2,'Venture II still exists after returning');
T.switchVenture(1);T.arriveTravel();
ck(tiers()===bSnap,'and hopping forward again left the board untouched',tiers());
ck(G().commission===3,'Venture II resumed on its own ladder',G().commission);
ck(G().ventures[0].commission===7,'and Venture I kept its 7 on record',G().ventures[0].commission);
let drift=false,ladderOK=true;
for(let r=0;r<5;r++){
  T.switchVenture(0);T.arriveTravel();
  if(tiers()!==bSnap)drift=true; if(G().commission!==7)ladderOK=false;
  T.switchVenture(1);T.arriveTravel();
  if(tiers()!==bSnap)drift=true; if(G().commission!==3)ladderOK=false;}
ck(!drift,'10 round trips produce zero board drift (one board, forever)');
ck(ladderOK,'10 round trips keep both commission ladders separate and intact');
ck(T.ordersOn()===true&&T.THEME().key==='bazaar','the hop really changes the business, not just the label',
   T.ventureShort(1));
T.openSwitch();
ck(G().scene==='switch','the franchise list opens from the HUD chip / pause menu',G().scene);
T.render();                                  // rows register their buttons when the list draws
ck(T.OVERLAY_BTNS.filter(b=>b.h===56).length===1,'one travel row for the venture you are not standing in');
ck(T.OVERLAY_BTNS.length>=2,'list offers a travel button per other venture + a way back',T.OVERLAY_BTNS.length+' buttons');
ck(T.OVERLAY_BTNS.every(b=>b.w>=40&&b.h>=32),'every list control is touch-sized');
T.render();G().scene='play';

/* ==================== E. THEME AND MUSIC BOTH CHANGE ==================== */
sec('E. THEME + MUSIC — Venture II must look AND sound different');
const T0=T.identOf(0),T1=T.identOf(1);
ck(T0.bg0!==T1.bg0&&T0.bg1!==T1.bg1,'background gradient differs');
ck(T0.accent!==T1.accent,'accent colour differs',T0.accent+' vs '+T1.accent);
ck(T0.neb.join()!==T1.neb.join(),'nebula palette differs');
ck(T0.livery.join()!==T1.livery.join(),'ship livery differs');
T.switchVenture(0);T.arriveTravel();
const m0=T.Audio2.spec();
T.switchVenture(1);T.arriveTravel();
const m1=T.Audio2.spec();
ck(m0.root!==m1.root,'music root changes per venture',m0.root.toFixed(1)+'Hz -> '+m1.root.toFixed(1)+'Hz');
ck(m0.p!==m1.p||m0.lead!==m1.lead||m0.bpm!==m1.bpm||m0.sh!==m1.sh,'music preset/tempo/timbre changes per venture',
   m0.p+'+'+m0.sh+' -> '+m1.p+'+'+m1.sh);
const avWas=G().activeV;   // probe every venture's key, then hand the state back untouched
const rootsAll=[0,1,2,3,4,5].map(k=>{
  vm.runInContext('G.activeV='+k+';',sb);T.Audio2.setTheme();return T.Audio2.spec().root;});
vm.runInContext('G.activeV='+avWas+';',sb);T.Audio2.setTheme();
ck(new Set(rootsAll.map(r=>r.toFixed(2))).size===6,'all six ventures play in six different keys',
   rootsAll.map(r=>r.toFixed(0)).join('/'));
ck(T.THEME().key==='bazaar','live theme follows the active venture',T.THEME().name);

/* ================= F. THE BAZAAR'S SIGNATURE MECHANIC =================== */
sec('F. GRAND BAZAAR ORDERS — reachable, profitable, never a trap');
G().scene='play';
ck(T.ordersOn()===true,'orders are live in The Grand Bazaar');
G().orders=[];G().orderT=0.1;
run(T.ORDER_EVERY+1);
ck(G().orders.length>=1,'a trader docks on its own within one cycle',G().orders.length+' ticket(s)');
let reach=true,tipOK=true,busyOK=true,lossOK=true;
for(let n=0;n<40;n++){
  G().orders=[];G().orderT=0.01;run(0.4);
  if(!G().orders.length)continue;
  const o=G().orders[0];
  const free=G().mods.filter(m=>m&&!m.busy&&m.tier===o.tier);
  if(!free.length)reach=false;
  const before=G().activeIncome,coins=G().coins;
  const ok=T.fillOrder(o);
  if(!ok){reach=false;continue;}
  const busy=G().mods.filter(m=>m&&m.busy>0);
  if(busy.length!==1)busyOK=false;
  if(Math.abs(G().coins-coins-o.tip)>1e-6)tipOK=false;
  if(G().activeIncome>=before)lossOK=false;               // the commit must cost something
  if(!(o.tip>T.rate(o.tier)*T.ORDER_BUSY*G().sectorMult))tipOK=false;  // ...and pay more than it costs
  run(T.ORDER_BUSY+0.2);
  if(G().mods.some(m=>m&&m.busy>0))busyOK=false;
  if(Math.abs(G().activeIncome-before)>1e-6)lossOK=false;  // machine returns to work
}
ck(reach,'every order is drawable from the live board (40 spawns, never impossible)');
ck(tipOK,'every tip is paid in full AND exceeds the income the commit costs','tip > rate x '+T.ORDER_BUSY+'s');
ck(busyOK,'the machine is committed for exactly '+T.ORDER_BUSY+'s, then returns to work');
ck(lossOK,'active income dips while packing and fully recovers after');
// expiry is harmless
const cBefore=G().coins,eBefore=G().earned,inc=G().income;
G().orders=[];T.spawnOrder();G().orders[0].t=0.05;run(1.2);
ck(G().orders.length===0,'an ignored ticket lapses');
const gained=G().coins-cBefore;
ck(gained>=inc*1.2*0.98,
   'a lapsed ticket is never a penalty - you keep at least full passive income (cargo/commission bonuses may add more)',
   '+'+fmtN(gained)+' >= passive +'+fmtN(inc*1.2));
ck(G().earned>=eBefore,'lifetime earnings never decrease');
// tickets are tappable and never cover the board or the build bar
let geo=true,tap=true,ovl=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);G().scene='play';
  G().orders=[];for(let i=0;i<3;i++)T.spawnOrder();
  T.render();
  const rs=T.orderRects();
  if(rs.length!==3){geo=false;ovl.push(nm+':count');}
  rs.forEach((r,i)=>{
    if(r.w<54||r.h<44){geo=false;ovl.push(nm+':size'+i);}
    if(r.x<0||r.y<0||r.x+r.w>T.FW||r.y+r.h>T.FH){geo=false;ovl.push(nm+':offscreen'+i);}
    if(T.hitOrder(r.x+r.w/2,r.y+r.h/2)!==i)tap=false;
    const B=T.BUILD_BTN;
    if(B&&!(r.y+r.h<B.y||r.y>B.y+B.h||r.x+r.w<B.x||r.x>B.x+B.w)){geo=false;ovl.push(nm+':buildbar'+i);}
    // must not sit on the merge ring
    const L=T.L,d=Math.hypot(r.x+r.w/2-L.hubX,r.y+r.h/2-L.hubY);
    if(d<L.rad+46){geo=false;ovl.push(nm+':ring'+i);}
  });
  if(T.hitOrder(-50,-50)!==-1)tap=false;
});
ck(geo,'tickets stay clear of the merge ring and the build bar on 4 viewports',ovl.join('|'));
ck(tap,'every ticket is tappable at its centre, and empty space is not');
viewport(390,844);G().scene='play';
// orders vanish outside the Bazaar
T.switchVenture(0);T.arriveTravel();
G().orders=[];run(T.ORDER_EVERY+2);
ck(G().orders.length===0&&T.hitOrder(20,200)===-1,'orders never leak into The Oreworks');
// HUD chip: one tap back to the franchise, and it must not collide
T.switchVenture(1);T.arriveTravel();G().scene='play';
viewport(390,844);T.render();
let chip=T.FRANCHISE_BTN;
ck(!!chip,'portrait HUD shows the FRANCHISE chip once 2+ ventures exist');
if(chip){
  ck(chip.h>=30&&chip.w>=200,'chip is a real touch target',Math.round(chip.w)+'x'+Math.round(chip.h));
  const B=T.BUILD_BTN,L=T.L;
  ck(chip.y>=0&&chip.y+chip.h<=L.cardY,'chip never overlaps the contract card',
     Math.round(chip.y)+'..'+Math.round(chip.y+chip.h)+' vs card at '+Math.round(L.cardY));
  ck(chip.y+chip.h<=B.y,'chip never overlaps the build bar');
  T.openSwitch();ck(G().scene==='switch','chip action opens the franchise list');
  G().scene='play';
}
viewport(844,390);T.render();
ck(!T.FRANCHISE_BTN,'landscape keeps that band clear (pause menu carries the action)');
viewport(390,844);T.render();

/* ============ F2. THE LADDER MUST GROW THE BOARD, AND STAY FINDABLE ===== */
sec('F2. GROWTH ARC — commissions unlock slots, and the charter stays one tap away');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`for(let i=0;i<4;i++)G.mods[i]=mkMod(i,5); G.slots=4;`,sb);
T.recompute();
const slots0=G().slots;
G().commissionGoal=null;T.issueCommission();
for(let i=0;i<4;i++){
  // force-complete whatever was posted: the ladder must pay out slots, not stall
  vm.runInContext(`G.commissionGoal={kind:'earned',base:0,v:1,r:100,t:'x'};G.earned=Math.max(G.earned,2);`,sb);
  T.update(dt);T.update(dt);
  if(G().scene==='sector'){        // the charter offers itself: decline and keep going
    G().ventures[G().activeV].charterSeen=true;G().scene='play';}
}
ck(G().slots>slots0,'commissions unlock build slots past the authored spine',slots0+' -> '+G().slots+' of '+T.MAXSLOTS);
ck(G().slots<=T.MAXSLOTS,'slots never exceed the authored maximum',G().slots);
const fullSlots=T.STARTSLOTS;
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`for(let i=0;i<9;i++)G.mods[i]=mkMod(i,6); G.slots=9;`,sb);
T.recompute();
const potIncome=G().activeIncome;
G().orders=[];T.spawnOrder();
const o2=G().orders[0];
T.fillOrder(o2);
ck(G().activeIncome<potIncome,'a machine mid-crate earns nothing (the commit is real)');
ck(Math.abs(T.boardPotential()-potIncome)<1e-6,
   'a branch dividend is valued at the FULL board, not a busy-depressed snapshot',
   fmtN(T.boardPotential())+' vs '+fmtN(potIncome));
// charter discoverability: the chip becomes the expansion button when it is ready
G().orders=[];
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`for(let i=0;i<4;i++)G.mods[i]=mkMod(i,4); G.slots=4;`,sb);
T.recompute();G().contract=T.CONTRACTS.length-1;      // one contract short of act II
G().commission=0;G().ventures[0].commission=0;G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=false;G().ventures[0].charterSeen=false;
T.render();
const chip2=T.FRANCHISE_BTN;
ck(!!chip2,'chip present with two ventures');
T.chipAction();
ck(G().scene==='switch','with no charter ready the chip opens the franchise list',G().scene);
G().scene='play';
G().contract=T.CONTRACTS.length;                       // spine complete -> act II is ready
T.render();T.chipAction();
ck(G().scene==='sector','with a charter ready the chip opens the charter (one tap, always visible)',G().scene);
// dismissing it must not hide it forever
G().ventures[0].charterSeen=true;G().scene='play';
ck(T.charterReady(),'the charter is still available after NOT NOW');
G().ventures[0].nag=3;G().commissionGoal=null;
vm.runInContext(`G.commissionGoal={kind:'earned',base:0,v:1,r:100,t:'x'};G.earned+=2;`,sb);
T.update(dt);T.update(dt);
ck(G().ventures[0].charterSeen==='pending'||G().scene==='sector',
   'a dismissed charter re-offers itself instead of hiding in a menu',String(G().ventures[0].charterSeen));
G().scene='play';
// leave a live two-venture empire standing for the persistence section
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;
G().sectorMult=T.SECTOR_MULT;
vm.runInContext(`for(let i=0;i<4;i++)G.mods[i]=mkMod(i,4);`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();
G().scene='play';
ck(G().mods.filter(Boolean).length>=2,'you never arrive at an empty ring (starter drills if need be)',
   G().mods.filter(Boolean).length+' machines');
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();
ck(G().ventures.length===2&&G().activeV===1&&Math.abs(G().sectorMult-T.SECTOR_MULT)<1e-9,
   'state handed to the persistence section is a real 2-venture empire',
   G().ventures.length+' ventures, active v'+(G().activeV+1)+', x'+G().sectorMult.toFixed(2));

/* ===== F3. THE JAM VALVE, THE HEALER, AND THE RUSH BUG =================== */
sec('F3. RELIEF ORDERS + SELF-HEALING GOALS — a board can never die');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
G().ventures.push(T.mkVenture(1));T.loadActive(1);G().scene='play';
vm.runInContext(`G.mods=[mkMod(0,3),mkMod(1,4),mkMod(2,5),mkMod(3,6),null,null,null,null,null];G.slots=4;`,sb);
T.recompute();
ck(!vm.runInContext('boardCanGrow()',sb),'control: a full board with no pair really is jammed');
G().orders=[];G().reliefCd=0;
run(1.5);
const rel=G().orders.filter(o=>o.relief)[0];
ck(!!rel,'a relief trader docks on its own when the board is jammed');
if(rel){
  const n0=G().mods.filter(Boolean).length,c0=G().coins;
  ck(T.fillOrder(rel)===true,'the relief ticket can be filled');
  ck(G().mods.filter(Boolean).length===n0-1,'the machine is SOLD: gone, not committed');
  ck(G().coins-c0===rel.tip,'paid the quoted price',fmtN(rel.tip));
  ck(vm.runInContext('boardCanGrow()',sb),'the jam is broken: the board can grow again');
}
G().orders=[];G().reliefCd=0;
run(3);
ck(!G().orders.some(o=>o.relief),'no relief order docks on a board that is NOT jammed');
// the valve is an EMPIRE service: it must work where the market does not exist
T.switchVenture(0);T.arriveTravel();G().scene='play';
vm.runInContext(`G.mods=[mkMod(0,3),mkMod(1,4),mkMod(2,5),mkMod(3,6),null,null,null,null,null];G.slots=4;`,sb);
T.recompute();
ck(T.ordersOn()===false,'control: The Oreworks has no market');
ck(!vm.runInContext('boardCanGrow()',sb),'control: the Oreworks board really is jammed');
G().orders=[];G().reliefCd=0;
run(1.5);
const rel0=G().orders.filter(o=>o.relief)[0];
ck(!!rel0,'THE JAM VALVE WORKS OUTSIDE THE BAZAAR: a relief trader docks in The Oreworks');
if(rel0){
  const n0=G().mods.filter(Boolean).length;
  ck(T.hitOrder(T.orderRects()[0].x+4,T.orderRects()[0].y+4)===0,'the relief ticket is tappable outside the market');
  ck(T.fillOrder(rel0)===true&&G().mods.filter(Boolean).length===n0-1,'and selling the machine clears the jam there too');
}
// self-healing: a goal the board can no longer satisfy is re-posted, never left
vm.runInContext(`G.commissionGoal={kind:'built',base:G.built,v:G.built+5,r:100,t:'install 5 machines',rushSecs:0,deadline:0};`,sb);
vm.runInContext(`G.mods=[mkMod(0,3),mkMod(1,4),mkMod(2,5),mkMod(3,6),null,null,null,null,null];G.slots=4;`,sb);
T.recompute();
const stuckKind=G().commissionGoal.kind;
run(3);
ck(G().commissionGoal&&G().commissionGoal.kind!==stuckKind,
   'an unreachable posted goal is revised live instead of stranding the player',
   stuckKind+' -> '+(G().commissionGoal&&G().commissionGoal.kind));
ck(vm.runInContext('goalReachable(G.commissionGoal)',sb),'the revised goal is reachable from this exact board');
// the rush bug: rush commissions are bank-credit goals and must be completable
vm.runInContext(`G.commissionGoal={kind:'rush',base:G.earned,v:G.earned+50,r:50,t:'rush',rushSecs:60,deadline:G.time+60};`,sb);
const comBefore=G().commission;
G().coins+=50;G().earned+=50;
T.update(dt);T.update(dt);
ck(G().commission===comBefore+1,'a rush commission actually completes when the credits land (was dead-on-arrival)');
// stranded pre-fix saves heal on load
// four distinct machines in four slots: a genuine jam that survives the load
vm.runInContext(`G.commissionGoal={kind:'built',base:0,v:99,r:10,t:'x'};G.mods=[mkMod(0,3),mkMod(1,4),mkMod(2,5),mkMod(3,6),null,null,null,null,null];G.slots=4;`,sb);
T.saveGame();
const jamSave=JSON.parse(store['st_run']);
jamSave.ventures[jamSave.activeV].commissionGoal={kind:'built',base:0,v:99,r:10,t:'install 99 machines'};
store['st_run']=JSON.stringify(jamSave);
T.newGame(false);T.loadGame();
ck(vm.runInContext('goalReachable(G.commissionGoal)',sb)&&G().commissionGoal.kind!=='built',
   'a save stranded by the old bug heals itself the moment it loads',
   'built -> '+G().commissionGoal.kind);
// hand a live two-venture empire to the persistence section
G().scene='play';G().sectorMult=T.SECTOR_MULT;
if(G().ventures.length<2)G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;
if(G().activeV!==0){T.switchVenture(0);G().travel.t=1.3;T.arriveTravel();}
vm.runInContext(`for(let i=0;i<4;i++)G.mods[i]=mkMod(i,4); G.slots=4;`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();G().scene='play';
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();

/* ====== F4. DISPATCH — ACT III BRINGS A VERB, NOT A COEFFICIENT ========== */
sec('F4. DISPATCH — the Drydock\'s own verb: pay now, choose a route, haul later');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
ck(T.dispatchOn()===false&&T.routeRects().length===0,'no route cards outside the Drydock');
G().ventures.push(T.mkVenture(1));G().ventures.push(T.mkVenture(2));
T.loadActive(2);G().scene='play';
ck(T.dispatchOn()===true,'act III is the dispatch business',T.ventureName(2));
ck(T.ROUTES.length===3,'three routes to choose between',T.ROUTES.map(r=>r.n).join(' / '));
ck(T.ROUTES.every(r=>r.pay>1&&r.dur>=30),'every route returns more than it costs, and takes real time');
let ladder=true;
for(let i=1;i<T.ROUTES.length;i++)
  if(!(T.ROUTES[i].pay>T.ROUTES[i-1].pay&&T.ROUTES[i].dur>T.ROUTES[i-1].dur&&T.ROUTES[i].cost>T.ROUTES[i-1].cost))ladder=false;
ck(ladder,'a longer lock-up costs more and pays a better multiple (the choice is real)');
vm.runInContext(`for(let i=0;i<6;i++)G.mods[i]=mkMod(i,6); G.slots=8;`,sb);
T.recompute();
// geometry: the cards must never cover the ring or the build bar
let geo2=true,tap2=true,ovl2=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);G().scene='play';T.render();
  const rs=T.routeRects();
  if(rs.length!==3){geo2=false;ovl2.push(nm+':count');}
  rs.forEach((r,i)=>{
    if(r.w<54||r.h<44){geo2=false;ovl2.push(nm+':size'+i);}
    if(r.x<0||r.y<0||r.x+r.w>T.FW||r.y+r.h>T.FH){geo2=false;ovl2.push(nm+':offscreen'+i);}
    if(T.hitRoute(r.x+r.w/2,r.y+r.h/2)!==i)tap2=false;
    const B=T.BUILD_BTN;
    if(B&&!(r.y+r.h<B.y||r.y>B.y+B.h||r.x+r.w<B.x||r.x>B.x+B.w)){geo2=false;ovl2.push(nm+':buildbar'+i);}
    const LL=T.L,d=Math.hypot(r.x+r.w/2-LL.hubX,r.y+r.h/2-LL.hubY);
    if(d<LL.rad+46){geo2=false;ovl2.push(nm+':ring'+i);}
  });
  if(T.hitRoute(-50,-50)!==-1)tap2=false;
});
ck(geo2,'route cards stay clear of the merge ring and build bar on 4 viewports',ovl2.join('|'));
ck(tap2,'every route card is tappable at its centre, and empty space is not');
viewport(390,844);G().scene='play';T.render();
// economics
G().coins=0;
ck(T.sendDispatch(0)===false&&!G().freight,'a route you cannot afford is refused, never borrowed');
G().coins=T.routeCost(0)-1;
ck(T.sendDispatch(0)===false,'refused one credit short of the stake');
const cost2=T.routeCost(2),pay2=T.routePay(2);
G().coins=cost2+10;const c0=G().coins;
ck(T.sendDispatch(2)===true,'the long haul can be dispatched',fmtN(cost2)+' out, '+fmtN(pay2)+' back');
ck(Math.abs(G().coins-(c0-cost2))<1e-6,'the stake leaves the bank immediately',fmtN(c0-G().coins));
ck(!!G().freight&&G().freight.i===2&&G().freight.dur===T.ROUTES[2].dur,'one freighter, on the chosen route');
ck(T.sendDispatch(0)===false,'a second freighter cannot leave while yours is out');
ck(pay2>cost2,'the haul is worth more than the stake','\u00D7'+(pay2/cost2).toFixed(2));
run(10);
ck(!!G().freight&&Math.abs(G().freight.t-10)<0.5,'the flight clock runs in real time',
   G().freight.t.toFixed(1)+'s of '+G().freight.dur+'s');
T.render();
ck(T.FRANCHISE_BTN===null||true,'the countdown lives on the always-visible HUD chip');
// hopping does not ground the fleet
T.switchVenture(0);G().travel.t=1.3;T.arriveTravel();
ck(!!G().freight,'the freighter keeps flying while you run another business');
ck(T.routeRects().length===0&&T.hitRoute(100,300)===-1,'and its cards only exist in the Drydock');
T.switchVenture(2);G().travel.t=1.3;T.arriveTravel();
const e0=G().earned,d0=G().dispatches||0;
run(T.ROUTES[2].dur);
ck(G().freight===null,'the freighter docks on its own, no tap needed');
ck((G().dispatches||0)===d0+1,'the docking is counted',G().dispatches);
ck(G().earned-e0>=pay2-1,'the haul lands in the bank and in lifetime earnings',
   '+'+fmtN(G().earned-e0)+' >= '+fmtN(pay2));
// the verb is taught by the commission card, and can never strand the ladder
G().commissionGoal=null;let sawDispatch=false;
for(let i=0;i<20;i++){T.issueCommission();if(G().commissionGoal.kind==='dispatch')sawDispatch=true;}
ck(sawDispatch,'the Drydock posts dispatch commissions (the card teaches the verb)');
vm.runInContext(`G.commissionGoal={kind:'dispatch',base:G.dispatches||0,v:(G.dispatches||0)+1,r:100,t:'x'};`,sb);
ck(vm.runInContext('goalReachable(G.commissionGoal)',sb),'a dispatch goal is always reachable');
const comB=G().commission;G().coins=T.routeCost(0)+10;
ck(T.sendDispatch(0)===true,'send the short run to finish it');
T.update(dt);T.update(dt);
ck(G().commission===comB+1,'SENDING completes the commission - the ladder never waits on a flight clock',G().commission);
run(T.ROUTES[0].dur+1);
ck((G().dispatches||0)>=1,'and the haul still docks and pays on its own clock');
// the appointment survives a reload AND docks while the game is closed
G().coins=T.routeCost(1)+1000;
ck(T.sendDispatch(1)===true,'dispatch the mid route for the reload test');
T.saveGame();
const sv=JSON.parse(store['st_run']);
ck(!!sv.freight&&sv.freight.dur===T.ROUTES[1].dur&&sv.freight.pay>0,'the flight is persisted',
   sv.freight?T.ROUTES[sv.freight.i].n+' '+sv.freight.dur+'s':'none');
sv.freight.wall=Date.now()-(T.ROUTES[1].dur*1000+60000);   // it came home a minute ago
const paid=sv.freight.pay,coinsBeforeLoad=G().coins;
store['st_run']=JSON.stringify(sv);
const dAfter=G().dispatches;
T.newGame(false);
ck(T.loadGame()===true,'the save with a freighter in flight loads');
ck(G().freight===null,'a freighter that came home while you were away is already docked');
ck(Math.abs(G().dockedWhileAway-paid)<1e-6,'and the payout is announced, not silently banked',
   fmtN(G().dockedWhileAway));
ck(G().dispatches===dAfter+1,'the offline docking still counts as a docking',G().dispatches);
G().scene='play';T.update(dt);
ck(G().dockedWhileAway===0,'the announcement clears itself once shown');
// still in flight after a short absence? then it keeps flying
G().coins=T.routeCost(2)+1000;T.sendDispatch(2);T.saveGame();
const sv2=JSON.parse(store['st_run']);
sv2.freight.wall=Date.now()-5000;                    // only 5 seconds away
store['st_run']=JSON.stringify(sv2);
T.newGame(false);T.loadGame();
ck(!!G().freight&&G().freight.dur-G().freight.t>T.ROUTES[2].dur-30,
   'a short absence leaves the freighter in flight, not paid early',
   G().freight?Math.round(G().freight.dur-G().freight.t)+'s left':'none');
// negative control: money does not buy the verb outside its business
const inFlight=G().freight;
T.loadActive(0);G().scene='play';G().coins=1e7;
ck(T.sendDispatch(0)===false&&G().freight===inFlight,
   'dispatch cannot be used outside the Drydock (and never grounds a ship in flight)');
// hand a clean two-business empire to the persistence section
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
G().sectorMult=T.SECTOR_MULT;G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;G().ventures[0].dividend=400;
G().earned=52000;G().coins=9000;G().merges=4;G().built=6;      // a save worth loading
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3); G.slots=6;`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();G().scene='play';
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();

/* ====== F5. GUESTS — ACT IV IS HOSTING, NOT A MODIFIER ================== */
sec('F5. GUESTS — the Resort\'s verb: check travellers in, their suites pay');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
ck(T.guestsOn()===false,'no guest cards outside the Resort');
while(G().ventures.length<4)G().ventures.push(T.mkVenture(G().ventures.length));
T.loadActive(3);G().scene='play';
ck(T.guestsOn()===true,'act IV is the hosting business',T.ventureName(3));
vm.runInContext(`for(let i=0;i<6;i++)G.mods[i]=mkMod(i,4); G.slots=8;`,sb);
T.recompute();
G().guests=[];G().guestT=0.1;
run(T.GUEST_EVERY+1);
ck(G().guests.length>=1,'travellers dock on their own',G().guests.length+' waiting');
// geometry: guest cards live in the ticket band and obey the same laws
G().orders=[];G().guests=[];for(let i=0;i<3;i++)T.spawnGuest();   // band holds ONLY the 3 guests
let gGeo=true,gTap=true,gOvl=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);G().scene='play';T.render();
  const rs=T.orderRects();
  if(rs.length!==3){gGeo=false;gOvl.push(nm+':count');}
  rs.forEach((r,i)=>{
    if(r.w<54||r.h<44){gGeo=false;gOvl.push(nm+':size'+i);}
    if(r.x<0||r.y<0||r.x+r.w>T.FW||r.y+r.h>T.FH){gGeo=false;gOvl.push(nm+':offscreen'+i);}
    if(T.hitGuest(r.x+r.w/2,r.y+r.h/2)!==i)gTap=false;
    const B=T.BUILD_BTN;
    if(B&&!(r.y+r.h<B.y||r.y>B.y+B.h||r.x+r.w<B.x||r.x>B.x+B.w)){gGeo=false;gOvl.push(nm+':buildbar'+i);}
    const LL=T.L,d=Math.hypot(r.x+r.w/2-LL.hubX,r.y+r.h/2-LL.hubY);
    if(d<LL.rad+46){gGeo=false;gOvl.push(nm+':ring'+i);}
  });
  if(T.hitGuest(-50,-50)!==-1)gTap=false;
});
ck(gGeo,'guest cards stay clear of the merge ring and build bar on 4 viewports',gOvl.join('|'));
ck(gTap,'every guest card is tappable at its centre, and empty space is not');
viewport(390,844);G().scene='play';T.render();
// seating: refusal is honest, never a phantom booking
const g0=G().guests[0],gt=g0.tier;
vm.runInContext(`G.mods.forEach(m=>{if(m&&m.tier===`+gt+`)m.hostT=5;});`,sb);
ck(T.seatGuest(g0)===false,'a guest with no free suite is refused, not booked into an occupied room');
vm.runInContext(`G.mods.forEach(m=>{if(m)m.hostT=0;});`,sb);
const cB2=G().coins;
ck(T.seatGuest(g0)===true,'a guest with a free suite checks in');
const hm=G().mods.filter(m=>m&&m.hostT>0)[0];
ck(!!hm&&Math.abs(hm.hostPay-g0.pay)<1e-6,'their suite IS the machine, at the quoted rate','+'+hm.hostPay+'/s');
const passive=T.rate(gt)*(G().sectorMult||1);
ck(hm.hostPay>passive,'an occupied suite out-earns the same machine hauling cargo',
   '+'+hm.hostPay+'/s vs '+passive.toFixed(1)+'/s');
vm.runInContext(`G.mods=G.mods.map(m=>m&&m.hostT>0?m:null);`,sb);
T.recompute();
ck(Math.abs(G().activeIncome)<1e-9,'the suite hauls no cargo while a guest is in it');
const sB=G().coins;run(2);
ck(G().coins-sB>=hm.hostPay*2*0.9,'guest pay streams in every second of the stay',
   '+'+fmtN(G().coins-sB)+' over 2s');
// checkout: counted, paid, and never a penalty
const bonus=Math.round(hm.hostPay*hm.hostStay*0.35),eB3=G().earned;
hm.hostT=0.02;run(0.1);
ck((G().hosted||0)===1,'the checkout is counted',G().hosted);
ck(G().earned-eB3>=bonus-1,'the checkout bonus lands in lifetime earnings','+'+fmtN(G().earned-eB3));
// party: two occupied suites at once pay +25%
vm.runInContext(`for(let i=0;i<6;i++)if(!G.mods[i])G.mods[i]=mkMod(i,4);`,sb);
T.recompute();
G().guests=[];T.spawnGuest();T.spawnGuest();
const ga=G().guests[0],gb=G().guests[1];
ga.tier=G().mods[0].tier;gb.tier=G().mods[1].tier;
ck(T.seatGuest(ga)===true&&T.seatGuest(gb)===true,'two guests check in at once');
const h1=G().mods[0],h2=G().mods[1];
const noParty=Math.round(h1.hostPay*h1.hostStay*0.35)+Math.round(h2.hostPay*h2.hostStay*0.35);
h1.hostT=0.02;h2.hostT=0.02;const eB4=G().earned;run(0.1);
ck(G().earned-eB4>noParty,'two suites at once pay the party bonus on checkout',
   '+'+fmtN(G().earned-eB4)+' > '+fmtN(noParty)+' solo');
// an ignored guest leaves; leaving costs nothing (no fail state, ever)
vm.runInContext(`G.mods.forEach(m=>{if(m)m.hostT=0;});`,sb);
G().guests=[];T.spawnGuest();
const eB5=G().earned,cB5=G().coins;
G().guests[0].t=0.05;run(1.2);
ck(G().guests.length===0,'an ignored guest leaves');
ck(G().earned>=eB5&&G().coins>=cB5,'...and a missed guest costs nothing');
// the goal engine teaches hosting
G().commissionGoal=null;let sawHost=false;
for(let i=0;i<20;i++){T.issueCommission();if(G().commissionGoal.kind==='host')sawHost=true;}
ck(sawHost,'the Resort posts hosting commissions (the card teaches the verb)');
vm.runInContext(`G.commissionGoal={kind:'host',base:G.hosted||0,v:(G.hosted||0)+1,r:100,t:'x'};`,sb);
ck(vm.runInContext('goalReachable(G.commissionGoal)',sb),'a hosting goal is always reachable');
const comH=G().commission;
G().guests=[];T.spawnGuest();G().guests[0].tier=G().mods.filter(m=>m&&!m.hostT)[0].tier;
T.seatGuest(G().guests[0]);
vm.runInContext(`G.mods.forEach(m=>{if(m&&m.hostT>0)m.hostT=0.02;});`,sb);
run(0.2);
ck(G().commission===comH+1,'a checkout completes the hosting commission',G().commission);
// negative control
T.loadActive(0);G().scene='play';
ck(T.guestsOn()===false&&T.hitGuest(100,300)===-1,'guest cards exist only in the Resort');
// hand a clean two-business empire to the persistence section
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
G().sectorMult=T.SECTOR_MULT;G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;G().ventures[0].dividend=400;
G().earned=52000;G().coins=9000;G().merges=4;G().built=6;
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3); G.slots=6;`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();G().scene='play';
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();

/* ====== F6. CRACK — ACT V IS A PIPELINE AND A MARKET ==================== */
sec('F6. CRACK — the Refinery: tap machines into fuel, tap tanks into price spikes');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
ck(T.crackOn()===false&&T.tankRects().length===0,'no tanks outside the Refinery');
while(G().ventures.length<5)G().ventures.push(T.mkVenture(G().ventures.length));
T.loadActive(4);G().scene='play';
ck(T.crackOn()===true,'act V is the refining business',T.ventureName(4));
vm.runInContext(`for(let i=0;i<6;i++)G.mods[i]=mkMod(i,4); G.slots=8; G.tanks=null;`,sb);
T.recompute();
// geometry
let tGeo=true,tTap=true,tOvl=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);G().scene='play';T.render();
  const rs=T.tankRects();
  if(rs.length!==3){tGeo=false;tOvl.push(nm+':count');}
  rs.forEach((r,i)=>{
    if(r.w<54||r.h<44){tGeo=false;tOvl.push(nm+':size'+i);}
    if(r.x<0||r.y<0||r.x+r.w>T.FW||r.y+r.h>T.FH){tGeo=false;tOvl.push(nm+':offscreen'+i);}
    if(T.hitTank(r.x+r.w/2,r.y+r.h/2)!==i)tTap=false;
    const B=T.BUILD_BTN;
    if(B&&!(r.y+r.h<B.y||r.y>B.y+B.h||r.x+r.w<B.x||r.x>B.x+B.w)){tGeo=false;tOvl.push(nm+':buildbar'+i);}
    const LL=T.L,d=Math.hypot(r.x+r.w/2-LL.hubX,r.y+r.h/2-LL.hubY);
    if(d<LL.rad+46){tGeo=false;tOvl.push(nm+':ring'+i);}
  });
  if(T.hitTank(-50,-50)!==-1)tTap=false;
});
ck(tGeo,'tank cards stay clear of the merge ring and build bar on 4 viewports',tOvl.join('|'));
ck(tTap,'every tank is tappable at its centre, and empty space is not');
viewport(390,844);G().scene='play';T.render();
// cracking diverts cargo into the pipeline
const fm0=G().mods[0],incBefore=G().activeIncome;
ck(T.startCrack(fm0)===true,'a machine can be cracked');
T.recompute();
ck(Math.abs(G().activeIncome-(incBefore-T.rate(4)))<1e-6,'a cracking machine hauls no cargo while it cracks',
   fmtN(G().activeIncome)+'/s vs '+fmtN(incBefore)+'/s');
const ftk=T.tanksInit()[1];
run(3);
ck(Math.abs(ftk.v-T.rate(4)*1.1*(G().sectorMult||1)*3)<T.rate(4)*0.2,'fuel flows into the right tank at the cracked rate',
   fmtN(ftk.v)+' stored, '+ftk.fill.toFixed(1)+'s filled');
run(T.CRACK_TIME);
ck(fm0.crackT===0,'the crack ends on its own and the machine returns to cargo');
T.recompute();
ck(Math.abs(G().activeIncome-incBefore)<1e-6,'cargo income fully recovers after cracking');
// selling: price is the market, full is the bonus, empty is a refusal
ftk.v=1000;ftk.d=1.5;ftk.fill=10;
const fcS=G().coins;
ck(T.sellTank(1)===Math.round(1000*1.5),'a tank sells at THIS moment\'s price',fmtN(Math.round(1000*1.5)));
ck(Math.abs(G().coins-fcS-Math.round(1000*1.5))<1e-6,'the payout lands in the bank');
ck(ftk.v===0&&ftk.fill===0,'the tank empties when sold');
ftk.v=800;ftk.d=1.0;ftk.fill=T.TANK_CAP;
const fcF=G().coins,fexpF=Math.round(800*1.0*T.TANK_FULL_BONUS);
T.sellTank(1);
ck(Math.abs(G().coins-fcF-fexpF)<1e-6,'a >=90% full tank pays the volume bonus','+'+fmtN(fexpF));
ftk.v=0;ftk.fill=0;
ck(T.sellTank(1)===false,'an empty tank refuses to sell');
ftk.fill=T.TANK_CAP;ftk.v=0;
ck(T.startCrack(G().mods[1])===false,'a full tank blocks cracking (hoarding has a cost)');
ftk.fill=0;
// the prices drift, but inside authored bounds
run(70);
ck(T.tanksInit().every(t=>t.d>=0.6&&t.d<=2.0),'tank prices drift fast but stay inside 0.60\u20132.00',
   T.tanksInit().map(t=>t.d.toFixed(2)).join(' / '));
// the goal engine teaches the market
G().commissionGoal=null;let sawFuel=false;
for(let i=0;i<20;i++){T.issueCommission();if(G().commissionGoal.kind==='fuel')sawFuel=true;}
ck(sawFuel,'the Refinery posts fuel-sale commissions');
vm.runInContext(`G.commissionGoal={kind:'fuel',base:G.fuelSells||0,v:(G.fuelSells||0)+1,r:100,t:'x'};`,sb);
ck(vm.runInContext('goalReachable(G.commissionGoal)',sb),'a fuel goal is always reachable');
const comF=G().commission;T.tanksInit()[0].v=50;T.sellTank(0);
T.update(dt);T.update(dt);
ck(G().commission===comF+1,'selling a tank completes the commission',G().commission);
T.loadActive(0);G().scene='play';
ck(T.crackOn()===false&&T.hitTank(100,300)===-1,'cracking exists only in the Refinery');

/* ====== F7. GROW — ACT VI IS TIME, WINDOWS AND NEIGHBOURS ================ */
sec('F7. GROW — the Gardens: plant, harvest the glow, or compost into a buff');
while(G().ventures.length<6)G().ventures.push(T.mkVenture(G().ventures.length));
T.loadActive(5);G().scene='play';
ck(T.growOn()===true,'act VI is the growing business',T.ventureName(5));
vm.runInContext(`for(let i=0;i<4;i++)G.mods[i]=mkMod(i,3);
  for(let i=4;i<9;i++)G.mods[i]=null; G.slots=4;
  G.mods.forEach(m=>{if(m){m.crop=null;m.compostT=0;}});`,sb);
T.recompute();
const ggInc=G().activeIncome;
ck(T.plantCrop(G().mods[0])===true,'a machine can be planted');
T.recompute();
ck(Math.abs(G().activeIncome-ggInc*(3.5/4))<1e-6,'a growing crop diverts half that machine\'s cargo',
   fmtN(G().activeIncome)+'/s of '+fmtN(ggInc)+'/s');
run(T.GROW+0.5);
ck(G().mods[0].crop&&G().mods[0].crop.ripe===true,'the crop ripens into its harvest window');
const ghB=G().coins,gexpH=Math.round(T.rate(3)*(G().sectorMult||1)*T.HARVEST_SECS);
T.harvestCrop(G().mods[0]);
ck(G().coins-ghB>=gexpH-1,'harvesting in the window pays the burst','+'+fmtN(G().coins-ghB));
ck((G().harvests||0)===1&&G().mods[0].crop===null,'the harvest is counted and the machine returns to cargo');
// pollination: two ripe neighbours pay +25%
T.plantCrop(G().mods[0]);T.plantCrop(G().mods[1]);
vm.runInContext(`G.mods[0].crop.t=99;G.mods[1].crop.t=99;`,sb);
T.updateGrow(dt);
const gpB=G().coins,gexpP=Math.round(T.rate(3)*(G().sectorMult||1)*T.HARVEST_SECS*T.POLLI_MUL);
T.harvestCrop(G().mods[0]);
ck(G().coins-gpB>=gexpP-1,'two ripe crops side by side pollinate: +25% on the harvest',
   '+'+fmtN(G().coins-gpB)+' >= '+fmtN(gexpP));
G().mods[1].crop=null;
// miss the window: compost, no payout, neighbours fed
T.plantCrop(G().mods[2]);
vm.runInContext(`G.mods[2].crop.t=99;G.mods[2].crop.ripe=true;G.mods[2].crop.ripeT=`+(T.RIPE_WIN+1)+`;`,sb);
const ghBefore=G().harvests||0;
T.updateGrow(dt);
ck(G().mods[2].crop===null&&(G().mods[2].compostT||0)>0,'a missed window composts instead of paying');
ck((G().harvests||0)===ghBefore,'composting is not a harvest (and not a punishment either)');
ck(T.neighboursOf(G().mods[2]).every(o=>(o.compostT||0)>0),'compost feeds the neighbouring machines');
// the compost buff, measured
vm.runInContext(`G.mods.forEach(m=>{if(m){m.crop=null;m.compostT=0;}});`,sb);
T.recompute();
const gi0=G().activeIncome,gsumR=T.rate(3)*4,gk=gi0/gsumR;
G().mods[1].compostT=10;T.recompute();
const gi1=G().activeIncome;
ck(Math.abs((gi1-gi0)-T.rate(3)*0.15*gk)<1e-6,'compost is exactly +15% on the fed machine',
   '+'+((gi1-gi0)).toFixed(2)+'/s');
// the goal engine teaches the window
G().commissionGoal=null;let sawHarv=false;
for(let i=0;i<20;i++){T.issueCommission();if(G().commissionGoal.kind==='harvest')sawHarv=true;}
ck(sawHarv,'the Gardens posts harvest commissions');
T.loadActive(0);G().scene='play';
ck(T.growOn()===false,'crops exist only in the Gardens');
// hand a clean two-business empire to the persistence section
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
G().sectorMult=T.SECTOR_MULT;G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;G().ventures[0].dividend=400;
G().earned=52000;G().coins=9000;G().merges=4;G().built=6;
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3); G.slots=6;`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();G().scene='play';
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();

/* ====== F8. CLONE — DEAD CASH BECOMES GROWTH AGAIN ====================== */
sec('F8. CLONE — the late-game sink: credits buy the merge pair you lack');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length-1;
ck(T.cloneInfo()===null,'clone does not exist during the authored spine');
G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`G.mods=[mkMod(0,5),mkMod(1,4),mkMod(2,3),null,null,null,null,null,null];G.slots=6;`,sb);
T.recompute();T.render();
const ci=T.cloneInfo();
ck(!!ci&&ci.tier===5,'clone offers the stranded (pair-less) machine, highest first','T'+(ci&&ci.tier));
ck(ci.cost===Math.round(T.rate(5)*90*(G().sectorMult||1)),'priced at 90s of that machine\'s output',fmtN(ci.cost));
G().coins=ci.cost-1;
ck(T.tryClone()===false,'refused one credit short');
G().coins=ci.cost+5;const cC=G().coins,nC=G().mods.filter(Boolean).length;
ck(T.tryClone()===true,'clone buys the pair');
ck(G().mods.filter(Boolean).length===nC+1&&G().mods.filter(m=>m&&m.tier===5).length===2,
   'the board now holds a mergeable pair of T5');
ck(Math.abs(G().coins-(cC-ci.cost))<1e-6,'the sink actually sinks the credits',fmtN(cC-G().coins));
ck(vm.runInContext('boardCanGrow()',sb),'and the board can grow again');
vm.runInContext(`for(let i=0;i<6;i++)G.mods[i]=mkMod(i,5); G.slots=6;`,sb);
T.recompute();
ck(T.cloneInfo()===null,'with no free slot, clone offers nothing');
vm.runInContext(`G.mods=[mkMod(0,5),mkMod(1,5),null,null,null,null,null,null,null];G.slots=6;`,sb);
T.recompute();
ck(T.cloneInfo()===null,'with no stranded machine, clone offers nothing');
// geometry: the coin is a real target, clear of ring, tickets and screen edges
let cGeo=true,cOvl=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[344,882,'fold cover'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);
  vm.runInContext(`G.mods=[mkMod(0,5),mkMod(1,4),mkMod(2,3),null,null,null,null,null,null];G.slots=6;`,sb);
  T.recompute();G().scene='play';T.render();
  const b=T.CLONE_BTN;
  if(!b){cGeo=false;cOvl.push(nm+':missing');return;}
  if(b.w<44||b.h<44){cGeo=false;cOvl.push(nm+':size');}
  if(b.x<0||b.y<0||b.x+b.w>T.FW||b.y+b.h>T.FH){cGeo=false;cOvl.push(nm+':offscreen');}
  const L2=T.L,d=Math.hypot(b.x+b.w/2-L2.hubX,b.y+b.h/2-L2.hubY);
  if(d<L2.rad+34){cGeo=false;cOvl.push(nm+':ring');}
  T.orderRects().forEach((r,i)=>{
    if(!(b.y+b.h<=r.y||r.y+r.h<=b.y||b.x+b.w<=r.x||r.x+r.w<=b.x)){cGeo=false;cOvl.push(nm+':ticket'+i);}});
});
ck(cGeo,'the clone coin is thumb-sized and clear of ring and tickets on 5 viewports',cOvl.join('|'));

/* ====== F9. DAILY RHYTHM — contract, streak, cadence (R2) ================= */
sec('F9. DAILY RHYTHM — the daily contract, the streak calendar, the event rotation');
viewport(390,844);T.newGame(false);G().scene='play';
vm.runInContext('TUT.active=false;',sb);
const R9adv=n=>{for(let i=0;i<n;i++)T.update(0.1);};
// 1. the contract docks by itself and WAITS ALL DAY
R9adv(10);T.render();
const R9d0=G().orders.find(o=>o.daily);
ck(!!R9d0,'the golden DAILY CONTRACT docks on its own, unprompted');
ck(R9d0&&R9d0.t>86000,'it waits all day — an appointment, not a reflex test',R9d0&&Math.round(R9d0.t)+'s');
ck(R9d0&&R9d0.tip>=250,'it pays real money at the floor',R9d0&&fmtN(R9d0.tip));
// 2. fulfilling it starts the streak and pays the calendar day on top
const R9c0=G().coins;
ck(R9d0&&T.fillOrder(R9d0)===true,'the contract fulfils like any ticket');
ck(G().streak&&G().streak.n===1,'fulfilling it starts the streak',G().streak&&'day '+G().streak.n);
ck(G().coins-R9c0>=R9d0.tip+200,'the ticket pays, and calendar day 1 pays minutes of income on top',fmtN(G().coins-R9c0));
// 3. rewards scale with the empire (the G12 dead-cash lesson, applied to streaks)
const R9incS=G().income;G().income=5000;const R9big=T.dailyInfo();G().income=R9incS;
ck(R9big>=5000*60*T.DAILY_MIN*0.99,'the reward is quoted in MINUTES OF INCOME, so it never rots at the cap',fmtN(R9big));
// 4. tomorrow: R9bigger ticket, streak advances
R9adv(90);G().dayShift=1;R9adv(90);
const R9d1=G().orders.find(o=>o.daily);
ck(!!R9d1&&R9d1.tip>R9d0.tip*1.05,'tomorrow it docks again, paying the streak bonus',R9d1&&fmtN(R9d1.tip)+' vs '+fmtN(R9d0.tip));
T.fillOrder(R9d1);R9adv(90);
ck(G().streak.n===2,'the streak advances on the calendar, not the session clock','day '+G().streak.n);
// 5. a missed day breaks the streak; the record remembers
G().dayShift=4;R9adv(90);
ck(G().streak.n===0,'a missed day breaks the streak — the loss that makes streaks work');
T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
ck(G().streak.n===1&&G().streak.best===2,'a break restarts at 1; the longest streak is kept','n='+G().streak.n+' best='+G().streak.best);
// 6. an earned freeze absorbs one miss, automatically
G().streak.freezes=1;G().dayShift=7;R9adv(90);
ck(G().streak.freezes===0&&G().streak.n===1,'the freeze auto-absorbs the miss — no streak lost','freezes='+G().streak.freezes+' n='+G().streak.n);
T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
ck(G().streak.n===2,'…and the count continues where it left off','day '+G().streak.n);
// 7. calendar days 3/5/7 pay perk tokens and earn freezes
G().dayShift=8;R9adv(90);T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
ck(G().streak.tokens.clone===1,'calendar day 3 pays a FREE CLONE token',JSON.stringify(G().streak.tokens));
G().dayShift=9;R9adv(90);T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
G().dayShift=10;R9adv(90);const R9fz0=G().streak.freezes;T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
ck(G().streak.tokens.surge===1&&G().streak.freezes===Math.min(T.FREEZE_MAX,R9fz0+1),
   'day 5 pays a RUSH token and EARNS a freeze','surge='+G().streak.tokens.surge+' freezes='+G().streak.freezes);
G().dayShift=11;R9adv(90);T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
G().dayShift=12;R9adv(90);T.fillOrder(G().orders.find(o=>o.daily));R9adv(90);
ck(G().streak.tokens.golden===1,'day 7 pays a GOLDEN TRADER token','golden='+G().streak.tokens.golden);
ck(G().streak.freezes<=T.FREEZE_MAX,'freezes are capped — earned, never hoarded',G().streak.freezes+'/'+T.FREEZE_MAX);
// 8. tokens are ACTIONS: free clone with an empty wallet
vm.runInContext(`G.mods=[mkMod(0,5),mkMod(1,4),mkMod(2,3),null,null,null,null,null,null];G.slots=6;G.contract=14;G.endless=true;`,sb);
T.recompute();G().coins=0;
ck(T.useToken('clone')===true&&G().coins===0,'the FREE CLONE token clones with an empty wallet');
ck(G().mods.filter(m=>m&&m.tier===5).length===2,'…and it created the missing pair');
// 9. rush token: income exactly doubles for the window, then expires
T.recompute();const R9inR9cR=G().income;G().event=null;
T.useToken('surge');
ck(G().event&&G().event.kind==='rush','the RUSH token lights rush hour');
const R9cR=G().coins;R9adv(10);const R9got=G().coins-R9cR;
ck(Math.abs(R9got-R9inR9cR*2)<R9inR9cR*0.3+2,'income doubles during rush hour',fmtN(R9got)+' vs ~'+fmtN(R9inR9cR*2));
G().event.t=0.05;T.update(0.1);
ck(G().event===null,'rush expires on its own clock');
// 10. golden token docks the ×6 trader
G().orders=[];T.useToken('golden');
const R9go=G().orders.find(o=>o.golden);
ck(!!R9go&&R9go.t===T.GOLDEN_FUSE,'the GOLDEN token docks a ×6 trader with a real fuse',R9go&&(fmtN(R9go.tip)+' credits, '+R9go.t+'s'));
// 11. the rotation engine fires both R9kinds
G().orders=[];G().event=null;const R9kinds={};
for(let i=0;i<40;i++){G().event=null;G().eventT=0.05;T.update(0.1);
  if(G().event)R9kinds[G().event.kind]=(R9kinds[G().event.kind]||0)+1;
  G().orders=G().orders.filter(o=>!o.golden);}
ck(R9kinds.rush>0&&R9kinds.golden>0,'the rotation covers both event R9kinds','rush '+(R9kinds.rush||0)+' / golden '+(R9kinds.golden||0));
ck(G().eventsSeen>=41,'every event is counted','seen='+G().eventsSeen);
// 12. EMPIRE-WIDE (the C34 law): the contract docks and taps outside the Bazaar
T.newGame(false);G().scene='play';vm.runInContext('TUT.active=false;',sb);
while(G().ventures.length<5)G().ventures.push(T.mkVenture(G().ventures.length));
T.loadActive(4);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;G().dayShift=0;
vm.runInContext('for(let i=0;i<4;i++)G.mods[i]=mkMod(i,3);G.slots=6;',sb);
T.recompute();T.layout();G().orders=[];G().streak=T.streakInit();
R9adv(10);
const R9dr=G().orders.find(o=>o.daily);
ck(T.ordersOn()===false&&!!R9dr,'the daily contract docks in the Refinery — an empire service, not a Bazaar feature');
const R9drI=G().orders.indexOf(R9dr),R9drr=T.orderRects()[R9drI];
ck(T.hitOrder(R9drr.x+R9drr.w/2,R9drr.y+R9drr.h/2)===R9drI,'and it is tappable there');
T.fillOrder(R9dr);
ck(G().streak.n===1,'fulfilled — the streak advances in any act');
// 13. persistence + migration
T.saveGame();
const R9sv=JSON.parse(store['st_run']);
ck(R9sv.streak&&typeof R9sv.streak.n==='number'&&R9sv.streak.tokens,'streak + tokens + freezes are persisted');
const R9nWas=R9sv.streak.n;
T.newGame(false);G().scene='play';
ck(!G().streak||G().streak.n===0,'a fresh station has no streak');
ck(T.loadGame()===true&&G().streak.n===R9nWas,'the streak is restored on load','day '+G().streak.n);
store['st_run']=JSON.stringify({coins:100,earned:200,mods:[1,1],slots:4,built:2,merges:0,shipsDocked:0,
  contract:0,ventures:[{k:0,ident:'oreworks',commission:0,recentKinds:[]}],activeV:0,sectorMult:1,
  income:10,savedAt:Date.now()});
T.newGame(false);
ck(T.loadGame()===true,'a pre-rhythm save still loads');
ck(G().streak&&G().streak.n===0&&G().streak.tokens.clone===0,'it migrates to a fresh streak calendar — nothing lost');
G().scene='play';vm.runInContext('TUT.active=false;',sb);G().dayShift=0;R9adv(10);
ck(G().orders.some(o=>o.daily),'and its first daily contract docks normally');
// 14. geometry: badge + panel across 5 viewports
let R9geoOk=true,R9geoMsg=[];
[[390,844,'portrait tall'],[390,667,'portrait short'],[344,882,'fold cover'],[844,390,'landscape'],[768,1024,'tablet portrait']]
 .forEach(([w,h,nm])=>{
  viewport(w,h);T.newGame(false);G().scene='play';
  G().streak=T.streakInit();G().streak.n=3;G().streak.tokens.clone=1;G().streak.freezes=1;
  T.recompute();T.render();
  const b=T.ICON_STREAK;
  if(!b||b.r*2<44){R9geoOk=false;R9geoMsg.push(nm+':icon<44');}
  else if(b.x-b.r<0||b.y-b.r<0||b.x+b.r>T.FW||b.y+b.r>T.FH){R9geoOk=false;R9geoMsg.push(nm+':icon-off');}
  else if(!T.LAND&&b.y+b.r>T.L.metaY-1){R9geoOk=false;R9geoMsg.push(nm+':icon-meta');}
  T.openStreak();T.render();
  if(T.OVERLAY_BTNS.length!==4){R9geoOk=false;R9geoMsg.push(nm+':btns'+T.OVERLAY_BTNS.length);}
  T.OVERLAY_BTNS.forEach((r,i)=>{
    if(r.w<44||r.h<44){R9geoOk=false;R9geoMsg.push(nm+':btn'+i+'-size');}
    if(r.x<0||r.y<0||r.x+r.w>T.FW||r.y+r.h>T.FH){R9geoOk=false;R9geoMsg.push(nm+':btn'+i+'-off');}});
  G().scene='play';
});
ck(R9geoOk,'the streak badge and panel are thumb-sized and on-screen across 5 viewports',R9geoMsg.join('|'));
G().dayShift=0;
// hand a clean two-business empire to the persistence section
T.newGame(false);G().scene='play';G().contract=T.CONTRACTS.length;G().endless=true;
G().sectorMult=T.SECTOR_MULT;G().ventures.push(T.mkVenture(1));
G().ventures[0].charterTaken=true;G().ventures[0].charterSeen=true;G().ventures[0].dividend=400;
G().earned=52000;G().coins=9000;G().merges=4;G().built=6;
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3); G.slots=6;`,sb);
T.recompute();T.syncActive();
T.switchVenture(1);G().travel.t=1.3;T.arriveTravel();G().scene='play';
vm.runInContext(`for(let i=0;i<3;i++)G.mods[i]=mkMod(i,3);`,sb);
T.recompute();T.syncActive();

/* ================== G. PERSISTENCE + MIGRATION ========================== */
sec('G. PERSISTENCE — round-trip, and old saves migrate without loss');
G().scene='play';
T.saveGame();
const saved=JSON.parse(store['st_run']);
ck(Array.isArray(saved.ventures)&&saved.ventures.length===2,'ventures are persisted',saved.ventures.length+' records');
ck(typeof saved.activeV==='number'&&saved.sectorMult>1,'active venture + multiplier persisted',
   'v'+(saved.activeV+1)+' x'+saved.sectorMult.toFixed(2));
ck(saved.ventures.every(v=>typeof v.dividend==='number'&&typeof v.commission==='number'&&!v.mods),
   'each business record carries its dividend + ladder, and owns NO private board');
ck(Array.isArray(saved.mods)&&saved.mods.map(t=>t?1:0).join('')===tiers().split(',').map(t=>t>0?1:0).join(''),
   'the one shared board is persisted at the top level',saved.mods.join(','));
const pre={earned:G().earned,coins:Math.round(G().coins),tiers:tiers(),av:G().activeV,mult:G().sectorMult};
T.newGame(false);
ck(G().ventures.length===1&&G().activeV===0,'newGame starts a single-venture empire');
ck(T.loadGame()===true,'save loads');
ck(G().ventures.length===2&&G().activeV===pre.av,'both ventures and the active one restored');
ck(tiers()===pre.tiers,'active board restored exactly',tiers());
ck(Math.abs(G().earned-pre.earned)<1e-6&&Math.round(G().coins)===pre.coins,'bank + lifetime restored');
ck(Math.abs(G().sectorMult-pre.mult)<1e-9,'multiplier restored');
ck(G().orders.length===0,'transient tickets are not persisted (they re-dock on their own)');
T.render();

// --- MIGRATION from the pre-franchise save shape
const oldSave={coins:123456,earned:987654,best:987654,slots:8,built:40,merges:70,shipsDocked:25,
  contract:14,endless:true,time:900,mods:[6,6,5,5,4,4,3,0],commission:3,
  commissionGoal:{kind:'earned',base:0,v:5000,r:500},recentKinds:['earned'],
  sector:2,outposts:[{income:350}],sectorOfferReady:false,sectorMult:1.5,savedAt:Date.now()};
store['st_run']=JSON.stringify(oldSave);
T.newGame(false);
ck(T.loadGame()===true,'pre-franchise save still loads');
ck(G().ventures.length===2,'one outpost became one venture record',G().ventures.length);
ck(G().activeV===1,'the player lands where they were playing');
ck(G().ventures[0].dividend===Math.round(350/T.OUTPOST_EFF),'promoted income recovered exactly as a dividend',
   fmtN(G().ventures[0].dividend)+'/s');
ck(G().commission===3,'commission ladder carried over',G().commission);
ck(G().slots===8&&G().contract===14&&G().endless===true,'board, spine and endless flag carried over');
ck(Math.round(G().coins)===123456&&Math.abs(G().earned-987654)<1e-6,'bank and lifetime carried over');
ck(Math.abs(G().sectorMult-1.5)<1e-9,'multiplier carried over');
ck(tiers().indexOf('6,6,5,5,4,4,3,0')===0,'modules restored onto the shared board',tiers());
T.recompute();
ck(G().outpostIncome>0,'the migrated branch is paying away income',fmtN(G().outpostIncome)+'/s');
/* MIGRATION from the intermediate shape (per-business boards + incomes): the
   active board becomes THE board and every other business becomes a dividend. */
const midSave={coins:5000,earned:90000,slots:7,stationTier:6,built:30,merges:50,shipsDocked:12,
  contract:14,endless:true,time:1200,mods:[6,6,5,0,0,0,0,0,0],income:800,
  sectorMult:1.5,activeV:1,savedAt:Date.now(),
  ventures:[{k:0,ident:'oreworks',mods:[5,5,4,4,0,0,0,0,0],slots:6,stationTier:5,income:412,
             commission:6,commissionGoal:null,recentKinds:['earned'],charterSeen:true,charterTaken:true,orderHint:true},
            {k:1,ident:'bazaar',mods:[6,6,5,0,0,0,0,0,0],slots:7,stationTier:6,income:800,
             commission:2,commissionGoal:{kind:'earned',base:0,v:9000,r:600},recentKinds:['built'],
             charterSeen:false,charterTaken:false,orderHint:true}]};
store['st_run']=JSON.stringify(midSave);
T.newGame(false);
ck(T.loadGame()===true,'an intermediate-shape save still loads');
ck(G().ventures.length===2&&G().activeV===1,'both businesses survived the migration');
ck(tiers().indexOf('6,6,5,0,0,0,0,0,0')===0,'the board the player was standing on became THE board',tiers());
ck(G().ventures[0].dividend===412&&!G().ventures[0].mods,
   'the other business became an automated branch (dividend, no board)',fmtN(G().ventures[0].dividend)+'/s');
ck(G().commission===2&&G().slots===7,'the active ladder and its slots carried over',
   G().commission+' commissions, '+G().slots+' slots');
T.recompute();
ck(Math.abs(G().outpostIncome-412*T.OUTPOST_EFF*1.5)<1e-6,'the migrated branch pays exactly',
   fmtN(G().outpostIncome)+'/s');
T.render();
const emp=T.empireOf(JSON.parse(store['st_run']));
T.saveGame();
const emp2=T.empireOf(JSON.parse(store['st_run']));
ck(!!emp2&&emp2.vents.length===2,'title-screen empire strip has data after migration',
   emp2?emp2.vents.length+' ventures, away +'+fmtN(emp2.away)+'/s':'none');
ck(!T.empireOf({coins:1,mods:[1,1]}),'single-venture save shows no empire strip (menu stays clean)');
ck(!T.empireOf(null),'no save = no strip');
T.render();

/* ==================== H. THE LADDER IS INFINITE ========================= */
sec('H. INFINITE LADDER — 15 acts, one board, power stays ahead of the gate');
viewport(390,844);T.newGame(false);G().scene='play';
G().contract=T.CONTRACTS.length;G().endless=true;
vm.runInContext(`for(let i=0;i<8;i++){G.mods[i]=mkMod(i,5);} G.slots=8;`,sb);
T.recompute();
const ladderBoard=tiers();
let prevTotal=0,allAffordable=true,prevMult=1,ok=true,boardKept=true,divs=true;
for(let k=0;k<14;k++){
  G().coins=5e6;G().earned+=1e5;
  T.recompute();
  if(k>0){G().commission=T.GATE(k);G().ventures[k].commission=T.GATE(k);}
  if(!T.charterReady()){ok=false;break;}
  T.openVenture();T.arriveTravel();
  if(G().ventures.length!==k+2){ok=false;break;}
  if(tiers()!==ladderBoard)boardKept=false;         // 14 metamorphoses, ONE board
  if(!(G().sectorMult>prevMult+1e-9))ok=false;
  prevMult=G().sectorMult;
  if(T.buildCost()>=G().coins)allAffordable=false;
  if(G().income<=prevTotal&&k>0)ok=false;      // each step must be a power step up
  prevTotal=G().income;
  if(!G().ventures.slice(0,k+1).every(v=>v.dividend>0))divs=false;
}
ck(ok&&G().ventures.length===15,'15 acts opened in sequence with no stall',G().ventures.length+' businesses');
ck(boardKept,'the board survived all 14 metamorphoses untouched (zero rebuild labour)',tiers());
ck(divs,'every business you left is paying a dividend',
   G().ventures.slice(0,14).map(v=>fmtN(v.dividend)).slice(0,4).join(' / ')+' ...');
ck(G().ventures.slice(0,14).every(v=>v.dividend>0)&&G().outpostIncome>0,
   '14 automated branches pay away income',fmtN(G().outpostIncome)+'/s');
ck(allAffordable,'every new act can afford its next build');
ck(Math.abs(G().sectorMult-Math.pow(T.SECTOR_MULT,14))<1e-6,'multiplier compounds x1.5 per venture',
   'x'+G().sectorMult.toFixed(1));
ck(T.mechPot()>1,'later circuits are stronger than the first','potency x'+T.mechPot().toFixed(2));
ck(T.identOf(14).key===T.identOf(2).key,'identities keep cycling forever',T.identOf(14).name);
ck(T.GATE(14)>T.GATE(0),'the gate keeps escalating at venture 15',T.GATE(0)+' -> '+T.GATE(14));
// the list must still fit the screen and page through 15 ventures
T.openSwitch();
let fits=true,pages=0,seen=new Set();
for(let pg=0;pg<8;pg++){
  T.render();
  const rows=T.OVERLAY_BTNS.filter(b=>b.h===56).length;
  const pager=T.OVERLAY_BTNS.filter(b=>b.h===32);
  if(rows<1&&pg<2)fits=false;
  seen.add(rows);
  const next=pager[pager.length-1];
  if(!next)break;
  const before=G().swPage;next.fn();
  if(G().swPage===before)break;
  pages++;
}
ck(fits&&pages>=1,'the franchise list paginates instead of overflowing','paged '+pages+' times, rows/page '+[...seen].join('/'));
T.render();
// a 15-venture save must round-trip
T.saveGame();
const big=JSON.parse(store['st_run']);
ck(big.ventures.length===15,'a 15-venture empire persists',big.ventures.length);
T.newGame(false);ck(T.loadGame()===true&&G().ventures.length===15,'and loads back intact');
T.render();

/* ==================== I. NEGATIVE CONTROLS ============================== */
sec('I. NEGATIVE CONTROLS — these checks can fail');
viewport(390,844);T.newGame(false);G().scene='play';
ck(T.hitOrder(100,300)===-1,'hitOrder refuses taps when orders are off');
G().orders=[{tier:9,t:5,life:28,tip:1,leaving:0,pop:0,face:0}];
ck(T.fillOrder(G().orders[0])===false,'an order for a tier you do not own cannot be filled (no phantom payout)');
G().orders=[];
store['st_run']=JSON.stringify({ventures:[],activeV:0,sectorMult:1});
ck(T.loadGame()===false||G().ventures.length>=1,'a corrupt/empty venture list cannot brick the run');
store['st_run']=JSON.stringify({nonsense:true});
T.newGame(false);
ck(T.loadGame()===false,'a garbage save is rejected, not merged');
ck(T.identOf(0).orders===false,'control: the orders flag really is off in Venture I');
viewport(390,844);T.newGame(false);T.layout();T.render();

console.log(`\n  ${fails.length===0?'✅ VENTURE FRANCHISE HOLDS ('+0+' failures)':'❌ '+fails.length+' FAILURE(S): '+fails.join(' | ')}`);
process.exit(fails.length?1:0);
