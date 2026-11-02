/* COMMISSION BOARD TEST — the continuation layer.
   Properties that must hold for a per-player per-moment goal engine:
   always solvable, always correctly scaled to THIS player's income, session-
   aware, varied, completable, and never touching the authored 14. */
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
const store={};
const win={innerWidth:390,innerHeight:844,devicePixelRatio:3,addEventListener(){},requestAnimationFrame:()=>1,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},performance:{now:()=>0}};
const sb={window:win,document:{getElementById:id=>id==='c'?canvas:null,addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},
  Object,Array,String,Number,Boolean};
sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},update,newGame,layout,resize,tryBuild,doMerge,
  progress,issueCommission,commissionCandidates,completeContract,get CONTRACTS(){return CONTRACTS},
  get MAXTIER(){return MAXTIER},counters,recompute,slotPos,saveGame,loadGame,buildCost,get OVERLAY_BTNS(){return OVERLAY_BTNS},render};`,sb);
const T=sb.__T,G=()=>T.G;
let fails=[];const ck=(ok,l,x)=>{console.log(`  ${ok?'✅':'❌'} ${l}${x?'  ('+x+')':''}`);if(!ok)fails.push(l);};
const dt=1/120;

function playTo(seconds,policy){
  let t=0,act=0;
  while(t<seconds&&G().scene==='play'){
    T.update(dt);t+=dt;act-=dt;
    if(act<=0){act=1/3;policy&&policy();}
  }
  return t;
}
function greedy(){
  // a human builds when they can afford to and merges when they cannot
  const n=G().mods.filter(Boolean).length;
  if(n<G().slots&&G().coins>=T.buildCost?false:false){}
  let best=-1,ba=null,bb=null;
  G().mods.forEach((m,i)=>{if(!m)return;G().mods.forEach((o,j)=>{
    if(j<=i||!o)return;if(o.tier===m.tier&&m.tier<T.MAXTIER&&m.tier>best){best=m.tier;ba=m;bb=o;}});});
  const room=G().slots-G().mods.filter(Boolean).length;
  const wantBuild=(G().commissionGoal&&G().commissionGoal.kind==='built')||room>0;
  if(wantBuild){const before=G().built;T.tryBuild();if(G().built>before)return;}
  if(ba)T.doMerge(ba,bb);else T.tryBuild();
}
// ---- authored spine untouched: header for contracts 1-14
T.resize();T.newGame(false);T.layout();G().scene='play';
ck(/^CONTRACT 1 \/ 14$/.test(T.progress().header),'authored contracts keep their own header',T.progress().header);

// ---- reach endless, then LEAVE the completion screen the way a player does
playTo(600,greedy);
if(G().scene==='done'){T.render();
  // leave the completion screen the way a player who wants to keep playing does
  const keep=T.OVERLAY_BTNS.filter(b=>b.label==='KEEP BUILDING')[0]||T.OVERLAY_BTNS[0];
  keep.fn();}
ck(G().contract===14,'reached endless (14/14)','contract='+G().contract);
const p0=T.progress();
ck(p0.header.startsWith('COMMISSION 1'),'endless posts a commission',p0.header);
ck(!!G().commissionGoal,'a goal object exists',G().commissionGoal&&G().commissionGoal.kind);
ck(p0.showV>0&&p0.showV<1e9,'goal delta is finite and relative',p0.showCur+'/'+p0.showV);
ck(G().commissionGoal.r>0,'goal pays a reward','+'+G().commissionGoal.r);
// ---- variety: a GROWABLE board must be offered real choice (checked mid-game,
//      before the ladder maxes the board out)
const pool=T.commissionCandidates().c.map(k=>k.kind);
ck(new Set(pool).size>=4,'growable board gets real choice',pool.join(','));

// ---- session awareness: same board, short vs long session target beat
const inc=G().income;
const shortBeat=T.commissionCandidates.call? null:null;
G().time=60;  const cs=T.commissionCandidates();
G().time=900; const cl=T.commissionCandidates();
G().time=600;
ck(cs.beat<cl.beat,'long sessions get bigger beats than short ones',cs.beat+'s vs '+cl.beat+'s');

// ---- scaling: goal delta tracks the player's own income
const g1=G().commissionGoal;
ck(g1.kind==='earned'? (g1.v-g1.base)<=inc*120 && (g1.v-g1.base)>=inc*15 : true,
   'bank goal sized to this player\'s income',g1.kind+' delta='+(g1.v-g1.base)+' inc='+inc.toFixed(0));

// ---- completability + ladder: complete 12 commissions by playing them out
let completed=0,kinds=[],stuck=0;
for(let n=0;n<12;n++){
  const before=G().commission;
  let t=0;
  while(G().commission===before&&t<400&&G().scene!=='done'){
    // a sector charter may present itself mid-ladder: dismiss it like a player would
    if(G().scene==='sector'){T.render();T.OVERLAY_BTNS[T.OVERLAY_BTNS.length-1].fn();continue;}
    if(G().scene!=='play')break;
    T.update(dt);t+=dt;greedy();
  }
  if(G().commission===before){stuck++;
    const g=G().commissionGoal;
    console.log('   STUCK on',g&&g.kind,'base',g&&g.base,'v',g&&g.v,'cur',T.counters()[g&&g.kind],'slots',G().slots,'mods',G().mods.filter(Boolean).length,'coins',Math.round(G().coins),'tier',G().stationTier);
    break;}
  completed++;kinds.push(G().recentKinds[G().recentKinds.length-1]);
}
ck(stuck===0,'every posted commission was completable by play',completed+' completed');
ck(completed>=12,'ladder advances',completed);
const triple=kinds.some((k,i)=>i>=2&&k===kinds[i-1]&&k===kinds[i-2]);
ck(!triple,'no goal kind repeats 3x in a row',kinds.join(','));

// ---- and a FULLY MAXED board must still get a goal (no deadlock), passive only
const savedMods=G().mods.slice(), savedSlots=G().slots, savedTier=G().stationTier;
for(let i=0;i<8;i++){const p=T.slotPos(i);G().mods[i]={slot:i,tier:8,pop:1,glow:0,spin:0,bob:i,x:p.x,y:p.y,home:p,returning:false,credT:0};}
G().slots=8;G().stationTier=8;T.recompute();
const mx=T.commissionCandidates().c.map(k=>k.kind);
ck(mx.length>=1&&mx.every(k=>['earned','ships','rush'].includes(k)),
   'maxed board posts only reachable (passive) goals',mx.join(',')||'NONE');
G().commissionGoal=null;T.progress();
ck(!!G().commissionGoal,'maxed board never deadlocks: a goal is always posted',G().commissionGoal.kind);
G().mods=savedMods;G().slots=savedSlots;G().stationTier=savedTier;T.recompute();

if(G().scene==='sector'){T.render();T.OVERLAY_BTNS[T.OVERLAY_BTNS.length-1].fn();}
// ---- rush expiry re-posts instead of punishing
G().commissionGoal={kind:'rush',base:G().earned,v:G().earned+1e9,r:10,t:'x',rushSecs:1,deadline:G().time-1};
T.update(dt);
ck(G().commissionGoal&&G().commissionGoal.kind!=='rush'||G().commissionGoal.deadline>G().time,
   'expired rush is replaced, never a dead card',G().commissionGoal.kind);

// ---- persistence round-trip of the continuation state
T.saveGame();
const saved=JSON.parse(store['st_run']);
const av=saved.ventures&&saved.ventures[saved.activeV||0];
ck(!!(av&&av.commissionGoal)&&typeof av.commission==='number'&&saved.ventures.length===1,
   'continuation state is saved inside the venture record','commission='+av.commission);

console.log(`\n  ${fails.length===0?'✅ COMMISSION BOARD PASSES':'❌ FAILS: '+fails.join(' | ')}`);
process.exit(fails.length?1:0);
