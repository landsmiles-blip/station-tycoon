/* FRANCHISE SIM — an hour of the shipped game, auto-played.
   The gate proves invariants; this proves PACING. Two runs, identical policy,
   one difference: does the player answer the traders of The Grand Bazaar?
     run A  fills every ticket   -> the signature mechanic is worth playing
     run B  ignores every ticket -> the control
   Reports time-to-first-charter, ventures opened, hops, order economics, the
   lift the mechanic provides, and any stall (no goal, stuck scene, broken
   board after a hop). Fails on stall, exception, board loss, or a signature
   mechanic that turns out to be worth nothing - because a signature that is
   not worth tapping is a signature that should not ship.
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
/* Seeded RNG. Both runs must see the SAME dice, or the comparison between
   "plays the market" and "ignores the market" is just noise - and a gate that
   flakes is a gate nobody trusts. */
let seed=1;
const srand=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};
const reseed=k=>{seed=k||20261030;};
const SM=new Proxy(Math,{get(t,k){if(k==='random')return srand;
  const v=t[k];return typeof v==='function'?v.bind(t):v;}});
const sb={window:win,document:{getElementById:()=>canvas,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math:SM,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`;globalThis.__T={get G(){return G},update,newGame,layout,resize,render,recompute,
  tryBuild,doMerge,progress,rate,buildCost,slotPos,mkMod,identOf,ventureName,ventureShort,GATE,ordersOn,
  openVenture,openSwitch,openCharter,chipAction,charterReady,switchVenture,arriveTravel,
  mkVenture,spawnOrder,fillOrder,orderRects,saveGame,loadGame,loadActive,syncActive,TIP_BOARD_S,TIP_MACHINE_S,
  dispatchOn,sendDispatch,routeCost,routePay,get ROUTES(){return ROUTES},
  guestsOn,spawnGuest,seatGuest,crackOn,startCrack,sellTank,tanksInit,
  get TANK_CAP(){return TANK_CAP},growOn,plantCrop,harvestCrop,cloneInfo,tryClone,
  get OUTPOST_EFF(){return OUTPOST_EFF},
  get MAXSLOTS(){return MAXSLOTS},get MAXTIER(){return MAXTIER},get CONTRACTS(){return CONTRACTS},
  get OVERLAY_BTNS(){return OVERLAY_BTNS}};`,sb);
const T=sb.__T,G=()=>T.G;
const F=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const fmtN=v=>Math.round(v).toLocaleString('en-US');
const board=()=>G().mods.map(m=>m?m.tier:0).join('.');

/* one auto-played run. fill=true answers the traders, fill=false ignores them. */
function play(MINUTES,fill,hopEvery,disp){
  if(disp===undefined)disp=true;
  const dt=1/60;
  reseed();                             // identical dice for both arms of the test
  T.newGame(false);T.layout();G().scene='play';
  let t=0,act=0,react=0,hopT=hopEvery,err=null;
  let contractsAt=0,charterAt=0,doneAt=0,ordersFilled=0,tips=0,hops=0,venturesOpened=0,
      noGoalFor=0,stuckFor=0,lastScene='play',maxTier=1,boardBreaks=0,unaffordableFor=0,
      flatFor=0,lastEarned=0,chipT=0,chipTaps=0,morphBreaks=0,pendingMorph=null,
      dispT=1,dispatches=0,stake=0,haul=0,morphs=[],hostedSeen=false,gardensSecs=0,
      dailies=0,goldens=0;
  const seen=new Set();                 // every ticket that ever docked
  try{
    while(t<MINUTES*60){
      const sc=G().scene;
      // "stuck" means an OVERLAY that never hands control back. 'play' is the
      // normal state, so progress there is watched by earnings instead.
      if(sc!==lastScene){stuckFor=0;lastScene=sc;}else if(sc!=='play')stuckFor+=dt;
      if(stuckFor>45)throw new Error('scene "'+sc+'" never resolved in '+stuckFor.toFixed(0)+'s');

      if(sc==='travel'){                // age the transition exactly like frame()
        G().travel.t+=dt;
        if(G().travel.t>=1.25){
          T.arriveTravel();
          /* THE MORPH LAW: a metamorphosis re-skins the ONE board. If the
             machines changed during it, the player was made to rebuild. */
          if(pendingMorph!==null){
            if(board()!==pendingMorph)morphBreaks++;
            pendingMorph=null;
          }
        }
        t+=dt;continue;
      }
      if(sc==='sector'){                // the expansion charter: accept it
        if(!charterAt)charterAt=t;
        morphs.push(t);
        const before=G().ventures.length;
        pendingMorph=board();           // what the board looks like going in
        T.render();                     // the real overlay draws and registers its buttons
        T.openVenture();
        if(G().ventures.length!==before+1)throw new Error('charter did not open a business');
        venturesOpened++;t+=dt;continue;
      }
      if(sc==='done'){                  // spine complete -> take the PRIMARY action
        if(!doneAt)doneAt=t;
        T.render();
        /* take the charter when it is offered (that IS the act-II beat), else
           keep building - chosen by label, never by position */
        const primary=T.OVERLAY_BTNS.filter(b=>b.label==='OPEN EXPANSION CHARTER')[0]
                   ||T.OVERLAY_BTNS.filter(b=>b.label==='KEEP BUILDING')[0]
                   ||T.OVERLAY_BTNS[0];
        if(!primary)throw new Error('completion overlay offers no way forward');
        primary.fn();
        if(G().scene!=='play'&&G().scene!=='sector')
          throw new Error('completion overlay did not hand back to play/charter');
        t+=dt;continue;
      }
      if(sc!=='play')throw new Error('unexpected scene "'+sc+'" during play');

      G().orders.forEach(o=>seen.add(o));
      T.update(dt);t+=dt;act-=dt;react-=dt;hopT-=dt;
      if(G().contract===T.CONTRACTS.length&&!contractsAt)contractsAt=t;
      if(G().stationTier>maxTier)maxTier=G().stationTier;

      // a stall is a dead game: there must always be a posted goal
      if(G().contract>=T.CONTRACTS.length&&!G().commissionGoal)noGoalFor+=dt;else noGoalFor=0;
      if(noGoalFor>20)throw new Error('no commission posted for '+noGoalFor.toFixed(0)+'s');
      // ...and the next build must always come within reach
      if(G().coins<T.buildCost()&&G().mods.filter(Boolean).length<G().slots)unaffordableFor+=dt;
      else unaffordableFor=0;
      if(unaffordableFor>180)throw new Error('no affordable build for 3 minutes');
      // earnings must always be moving: a frozen economy is a frozen game
      if(G().earned>lastEarned+0.5){lastEarned=G().earned;flatFor=0;}else flatFor+=dt;
      if(flatFor>60)throw new Error('earnings flat for 60s - the loop has stalled');

      /* an attentive player answers traders in the Bazaar, and answers the
         empire tickets (daily contract, golden trader) WHEREVER they dock */
      if(fill&&react<=0&&(T.ordersOn()||G().orders.some(x=>!x.leaving&&(x.daily||x.golden)))){
        react=0.22;
        const o=G().orders.filter(x=>!x.leaving&&(T.ordersOn()||x.daily||x.golden))[0];
        if(o){const wasD=!!o.daily,wasG=!!o.golden;
          const c0=G().coins;if(T.fillOrder(o)){ordersFilled++;tips+=G().coins-c0;
            if(wasD)dailies++;if(wasG)goldens++;}}
      }

      chipT-=dt;
      if(chipT<=0){                               // tap the HUD chip like a player would
        chipT=4;
        if(T.charterReady()&&G().scene==='play'){T.chipAction();chipTaps++;
          if(G().scene!=='sector')throw new Error('chip did not open the ready charter');}
      }

      if(act<=0){                               // merge the best pair, else build
        act=1/3;
        let best=-1,ba=null,bb=null;
        G().mods.forEach((m,i)=>{if(!m)return;G().mods.forEach((o,j)=>{
          if(j<=i||!o)return;if(o.tier===m.tier&&m.tier<T.MAXTIER&&m.tier>best){best=m.tier;ba=m;bb=o;}});});
        if(ba)T.doMerge(ba,bb);
        else{
          // a prudent player never builds into a jam: filling the LAST slot with
          // a tier that creates no pair is how boards die
          const free=G().slots-G().mods.filter(Boolean).length;
          let pairs=false;G().mods.forEach((m,i)=>{if(!m)return;G().mods.forEach((o,j)=>{
            if(j>i&&o&&o.tier===m.tier)pairs=true;});});
          const safe=free>1||pairs||G().mods.some(m=>m&&m.tier===1);
          if(free>0&&safe)T.tryBuild();
        }
      }

      if(T.growOn())gardensSecs+=dt;   // how much of this hour was the Gardens window
      /* CLONE: dead cash becomes the missing pair, so attending the market
         compounds again at the slot cap. */
      const ci=T.cloneInfo();
      if(ci&&G().coins>ci.cost*1.4)T.tryClone();

      /* CRACK + GROW: the Refinery runs its pipeline and sells into spikes; the
         Gardens harvests every ripe crop and keeps two plots growing. */
      if(T.crackOn()){
        if(G().mods.filter(m=>m&&m.crackT).length<3){
          const m=G().mods.find(m=>m&&!m.crackT&&!m.busy&&!m.hostT&&!m.crop);
          if(m)T.startCrack(m);
        }
        T.tanksInit().forEach((tk,i)=>{
          if(tk.v>0&&(tk.fill>=T.TANK_CAP*0.9||tk.d>=1.45))T.sellTank(i);});
      }
      if(T.growOn()){
        G().mods.forEach(m=>{if(m&&m.crop&&m.crop.ripe&&!m.crop.over)T.harvestCrop(m);});
        if(G().mods.filter(m=>m&&m.crop).length<2){
          const m=G().mods.find(m=>m&&!m.crop&&!m.busy&&!m.hostT&&!m.crackT);
          if(m)T.plantCrop(m);}
      }

      /* HOST: in the Resort, a player who understands the verb checks guests in
         as fast as suites are free. Both arms do this identically. */
      if(T.guestsOn()&&G().guests&&G().guests.length){
        const g=G().guests.filter(x=>!x.leaving)[0];
        if(g){T.seatGuest(g);if(G().hosted!==undefined)hostedSeen=true;}
      }

      /* DISPATCH: in the Drydock, a player who understands the verb sends the
         longest haul they can afford. Both arms do this identically, so the
         Bazaar-lift comparison below stays clean. */
      dispT-=dt;
      if(dispT<=0){
        dispT=4;
        if(disp&&T.dispatchOn()&&!G().freight){
          let pick=-1;
          for(let i=T.ROUTES.length-1;i>=0;i--)
            if(G().coins>T.routeCost(i)*1.15){pick=i;break;}
          if(pick>=0){
            const st=T.routeCost(pick),py=T.routePay(pick);
            if(T.sendDispatch(pick)){dispatches++;stake+=st;haul+=py;}
          }
        }
      }

      if(hopT<=0&&G().ventures.length>1){       // exercise the free hop both ways
        hopT=hopEvery;
        const to=(G().activeV+1)%G().ventures.length;
        const before=board();
        T.switchVenture(to);
        if(G().scene!=='travel')throw new Error('switch did not start a travel');
        G().travel.t=1.3;T.arriveTravel();hops++;
        /* ONE BOARD: a hop changes the business, never the machines. */
        if(board()!==before)boardBreaks++;
        if(G().activeV!==to)boardBreaks++;
      }
    }
  }catch(e){err=e.message;}
  return {err,t,contractsAt,charterAt,doneAt,ventures:G().ventures.length,venturesOpened,hops,
    boardBreaks,chipTaps,tickets:seen.size,ordersFilled,tips,lapsed:seen.size-ordersFilled,
    slots:G().slots,machines:G().mods.filter(Boolean).length,board:board(),morphBreaks,
    morphs,dispatches,dispatched:G().dispatches||0,stake,haul,
    hosted:G().hosted||0,hostedSeen,fuelSells:G().fuelSells||0,harvests:G().harvests||0,gardensMin:gardensSecs/60,
    dailies,goldens,streakN:(G().streak||{}).n||0,events:G().eventsSeen||0,
    dividends:G().ventures.filter((v,i)=>i!==G().activeV&&(v.dividend||0)>0).length,
    income:G().income,active:G().activeIncome,away:G().outpostIncome,earned:G().earned,
    mult:G().sectorMult,maxTier,fill,activeV:G().activeV,
    commission:G().ventures.reduce((a,v)=>a+(v.commission||0),0),
    names:G().ventures.map(v=>T.ventureShort(v.k)).join(' > ')};
}

/* Is the signature mechanic worth tapping? Lifetime earnings are dominated by
   exponential merge growth, so "% of an hour's total" hides the answer. The
   honest measure is the lift WHILE YOU ARE STANDING THERE: identical mature
   Bazaar board, identical 120 seconds, one run answers the traders and one
   does not. */
function bazaarLift(fill){
  const dt=1/60;
  reseed(777);
  T.newGame(false);T.layout();G().scene='play';
  G().contract=T.CONTRACTS.length;G().endless=true;
  vm.runInContext(`for(let i=0;i<9;i++)G.mods[i]=mkMod(i,7); G.slots=9;`,sb);
  T.recompute();T.syncActive();
  G().ventures.push(T.mkVenture(1));G().sectorMult=1.5;
  T.loadActive(1);
  vm.runInContext(`for(let i=0;i<9;i++)G.mods[i]=mkMod(i,7); G.slots=9;`,sb);
  T.recompute();
  const inc0=G().income;
  let t=0,react=0,tickets=0,tips=0;const e0=G().earned;
  while(t<20){T.update(dt);t+=dt;}                      // let the market open
  /* measure the TRADERS' market only: the once-a-day contract and the event
     rotation are separate systems — parking a day's wage inside a 120-second
     window would drown the honest lift number. */
  vm.runInContext(`G.orders=G.orders.filter(o=>!o.daily&&!o.golden);
    if(!G.streak)G.streak=streakInit(); G.streak.dailyDay=dayKey();
    G.eventT=1e9;G.event=null;`,sb);
  const e1=G().earned;t=0;
  while(t<120){
    T.update(dt);t+=dt;react-=dt;
    if(fill&&react<=0){react=0.2;
      const o=G().orders.filter(x=>!x.leaving)[0];
      if(o){const c0=G().coins;if(T.fillOrder(o)){tickets++;tips+=G().coins-c0;}}}
  }
  return {lift:((G().earned-e1)/(inc0*120)-1)*100,tickets,tips,inc:inc0};
}

console.log('=== FRANCHISE SIM — 60 minutes of the shipped game, auto-played ===\n');
const LA=bazaarLift(true),LB=bazaarLift(false);
const A=play(60,true,180);      // plays the Bazaar, hops every 3 minutes
const B=play(60,false,180);     // control: ignores every ticket
const Cc=play(60,true,180,false); // control: same play, never dispatches a freighter
const D=play(90,true,180);      // long haul: proves the top of the spine is reached

const line=(k,v)=>console.log('  '+k.padEnd(34)+v);
let fails=[];
const ck=(ok,l,x)=>{console.log(`  ${ok?'✅':'❌'} ${l}${x!==undefined&&x!==''?'  ('+x+')':''}`);if(!ok)fails.push(l);};

console.log(' RUN A — answers the traders');
line('simulated time',F(A.t)+(A.err?'  ⚠ ended early':''));
line('franchise',A.names);
line('authored spine',A.contractsAt?F(A.contractsAt)+' for 14/14 contracts':'not reached');
line('completion overlay',A.doneAt?F(A.doneAt)+' -> primary action taken':'not reached');
line('first metamorphosis',A.charterAt?F(A.charterAt)+'  (act II, inside session one)':'not reached');
line('businesses owned',A.ventures+'   multiplier x'+A.mult.toFixed(1));
line('metamorphoses / hops',A.venturesOpened+' / '+A.hops);
line('branch dividends paying',A.dividends+' automated branches');
line('the ONE shared board',A.machines+' machines in '+A.slots+' slots   ['+A.board+']');
line('metamorphosis times',A.morphs.slice(0,5).map(F).join('  ->  ')+(A.morphs.length>5?'  ...':''));
line('freighters dispatched',A.dispatches+'   staked '+fmtN(A.stake)+' -> hauling '+fmtN(A.haul));
line('guests checked in / out',A.hosted+' checkouts in the Resort');
line('fuel tanks sold / harvests',A.fuelSells+' / '+A.harvests+'  ('+A.gardensMin.toFixed(1)+' min inside the Gardens window)');
line('daily / golden / events fired',A.dailies+' / '+A.goldens+' / '+A.events+'   streak day '+A.streakN);
line('HUD chip taps -> charter',A.chipTaps);
line('commissions completed',A.commission);
line('tickets docked / sold',A.tickets+' / '+A.ordersFilled+(A.lapsed?'   ('+A.lapsed+' lapsed)':''));
line('tips earned',fmtN(A.tips)+' credits');
line('income now',fmtN(A.income)+'/s  = active '+fmtN(A.active)+' + away '+fmtN(A.away));
line('lifetime earned',fmtN(A.earned));
line('highest machine tier',A.maxTier+'/8');
console.log('\n RUN B — control, ignores every ticket');
line('ventures owned',B.ventures+'   multiplier x'+B.mult.toFixed(1));
line('tickets docked / sold',B.tickets+' / '+B.ordersFilled);
line('income now',fmtN(B.income)+'/s');
line('lifetime earned',fmtN(B.earned));
line('commissions completed',B.commission);
console.log('\n RUN C — control, never dispatches a freighter');
line('businesses owned',Cc.ventures+'   multiplier x'+Cc.mult.toFixed(1));
line('metamorphosis times',Cc.morphs.slice(0,5).map(F).join('  ->  '));
line('commissions completed',Cc.commission);
line('income now',fmtN(Cc.income)+'/s  = active '+fmtN(Cc.active)+' + away '+fmtN(Cc.away));
line('lifetime earned',fmtN(Cc.earned));

console.log('\n RUN D — long haul, 90 attentive minutes');
line('franchise',D.names);
line('businesses owned',D.ventures+'   multiplier x'+D.mult.toFixed(1));
line('metamorphosis times',D.morphs.slice(0,6).map(F).join('  ->  '));
line('Gardens window played',D.gardensMin.toFixed(1)+' min -> '+D.harvests+' harvests');
line('fuel tanks sold',D.fuelSells);
line('lifetime earned',fmtN(D.earned));

// Both runs collect cargo-ship payments, so the baseline is identical; the
// DIFFERENCE between them is the market. That difference is the number that
// matters, and it is measured on the board the player is actually standing on.
const net=LA.lift-LB.lift;
console.log('\n THE BAZAAR, MEASURED WHERE IT LIVES (same board, same 120 seconds)');
line('board income',fmtN(LA.inc)+'/s on 9x Tier 7');
line('answering the traders','+'+LA.lift.toFixed(1)+'% over board rate  ('+LA.tickets+' tickets, '+fmtN(LA.tips)+' credits)');
line('ignoring the traders','+'+LB.lift.toFixed(1)+'% over board rate  ('+LB.tickets+' tickets) - cargo ships only');
line('THE MARKET ITSELF','+'+net.toFixed(1)+'% income for watching and tapping');

console.log('\n RESULTS');
ck(net>=25,'in a MARKET venture, selling is the main event, not a garnish','+'+net.toFixed(1)+'% income for attending');
ck(net<=90,'...without making the rest of the game irrelevant','+'+net.toFixed(1)+'% income');
ck(LA.tips>0&&LB.tips===0,'the premium is tips, and tips only come from selling',fmtN(LA.tips)+' vs '+fmtN(LB.tips));
ck(LA.tickets>=5,'traders dock often enough to be worth watching',LA.tickets+' in 120s');
ck(!A.err,'60 minutes with no stall, no stuck scene, no exception',A.err||'clean');
ck(!B.err,'control run also clean for 60 minutes',B.err||'clean');
ck(A.boardBreaks===0&&B.boardBreaks===0,'every hop kept the ONE shared board exactly as it was',A.boardBreaks+' breaks');
ck(A.morphBreaks===0&&B.morphBreaks===0,'no metamorphosis ever reset or rebuilt the board',A.morphBreaks+' breaks');
ck(A.machines>=6&&A.slots>=7,'the hour ends on a full-strength board, not a starter ring',
   A.machines+' machines / '+A.slots+' slots');
ck(A.dividends>=Math.max(0,A.ventures-2),'every business you LEFT is paying a dividend',A.dividends+' branches, away +'+fmtN(A.away)+'/s');
ck(A.dispatches>=3,'the Drydock verb gets used across an hour of play',A.dispatches+' freighters sent');
ck(A.hosted>=4,'the Resort verb gets used across an hour of play',A.hosted+' checkouts');
ck(A.fuelSells>=3,'the Refinery market gets played across an hour',A.fuelSells+' tanks sold');
ck(A.gardensMin<0.5||A.harvests>=4,
   A.gardensMin<0.5
     ? 'the Gardens gate sits past the 60-min hour (authored GATE(5)=12) — RUN D proves it is played'
     : 'the Gardens window gets played across an hour',
   A.harvests+' harvests, '+A.gardensMin.toFixed(1)+' min of Gardens');
ck(D.gardensMin>1.5&&D.harvests>0,'the 90-min attentive run reaches AND plays the Gardens',
   D.harvests+' harvests across '+D.gardensMin.toFixed(1)+' min');
ck(D.ventures>=6,'the long haul banks the full six-business spine',D.ventures+' businesses');
ck(A.dailies>=1,'the daily contract docks and gets fulfilled across the hour',A.dailies+' fulfilled');
ck(A.events>=8,'the event cadence keeps firing across an attentive hour',A.events+' events');
ck(A.goldens>=1,'golden traders dock and get caught',A.goldens+' caught');
ck(A.streakN>=1,'the hour banks streak day 1','day '+A.streakN);
ck(B.streakN===0&&B.ventures>=2,'ignoring the rhythm costs upside, never progress (the verb law)',
   'control: day '+B.streakN+', '+B.ventures+' businesses');
ck(!D.err,'the long haul is clean for 90 minutes',D.err||'clean');
ck(A.haul>A.stake*1.5,'dispatching pays for itself many times over',
   fmtN(A.stake)+' staked -> '+fmtN(A.haul)+' hauling (x'+(A.haul/Math.max(1,A.stake)).toFixed(2)+')');
/* The verb must EARN its place: an hour with dispatch has to be at least as
   prosperous as the identical hour without it, or players will learn to ignore
   the Drydock and the act is decoration. */
ck(A.earned>=Cc.earned*0.98,'dispatching never costs you the hour',
   fmtN(A.earned)+' with vs '+fmtN(Cc.earned)+' without ('+((A.earned/Cc.earned-1)*100).toFixed(1)+'%)');
ck(A.ventures>=Cc.ventures,'...and never slows the franchise',A.ventures+' vs '+Cc.ventures+' businesses');
ck(A.commission>=Cc.commission*0.95,'...and never stalls the commission ladder',
   A.commission+' vs '+Cc.commission+' commissions');
ck(A.morphs.length>=2&&A.morphs[1]-A.morphs[0]<=900,
   'act III follows act II inside the next quarter hour',
   F(A.morphs[0])+' -> '+(A.morphs[1]?F(A.morphs[1]):'-'));
ck(A.contractsAt>0&&A.contractsAt<700,'the authored spine still finishes in ~9-10 minutes',F(A.contractsAt));
ck(A.doneAt>0,'the game never ends: the completion overlay hands back to play',F(A.doneAt));
ck(A.charterAt>0&&A.charterAt<640,'act II arrives ON ITS OWN inside the first ~10-minute session',F(A.charterAt));
ck(A.ventures>=4,'an hour of play builds a franchise, not a single upgrade',A.ventures+' businesses');
ck(A.hops>=8,'the free hop is exercised repeatedly, both directions',A.hops+' hops');
ck(A.tickets>20,'traders keep docking in the Bazaar',A.tickets+' tickets');
ck(A.ordersFilled/Math.max(1,A.tickets)>0.5,'an attentive player catches most of them',
   Math.round(A.ordersFilled/Math.max(1,A.tickets)*100)+'% sold');
ck(A.tips>A.earned*0.02,'an hour of hopping still banks real tip money',
   fmtN(A.tips)+' = '+(A.tips/A.earned*100).toFixed(1)+'% of lifetime earnings');
ck(A.earned>=B.earned*0.99,'attending the market never leaves you worse off overall',
   fmtN(A.earned)+' vs '+fmtN(B.earned)+'  ('+(((A.earned/B.earned)-1)*100).toFixed(1)+'%)');
// Commissions are posted against your own income, so a richer player is given
// richer targets: pace is expected to be a wash. What must NOT happen is the
// market dragging the ladder or the franchise backwards.
ck(A.commission>=B.commission-3,'selling does not slow the ladder (within run noise)',
   A.commission+' vs '+B.commission+' commissions');
ck(A.ventures>=B.ventures,'...and never slows the franchise',A.ventures+' vs '+B.ventures+' ventures');

console.log(`\n  ${fails.length===0?'✅ THE FRANCHISE PLAYS FOR AN HOUR WITHOUT STALLING':'❌ '+fails.length+' FAILURE(S): '+fails.join(' | ')}`);
process.exit(fails.length?1:0);
