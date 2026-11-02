const rate=t=>2*Math.pow(2.2,t-1), buildCost=n=>Math.round(20*Math.pow(1.55,n)), mergeBurst=t=>Math.round(8*Math.pow(2.2,t));
const SLOTS=6, MAXTIER=8;
console.log("=== THE FIX: does merging pay now? (was -40% in Astro Merge) ===");
for(let t=1;t<MAXTIER;t++){
  const before=2*rate(t), after=rate(t+1);
  console.log(`  2x T${t} (${before.toFixed(1)}/s) -> 1x T${t+1} (${after.toFixed(1)}/s) = ${((after/before-1)*100).toFixed(0)}% income  + frees a slot  + ${mergeBurst(t+1)} instant credits`);
}
const CONTRACTS=[["earned",150,60],["tier",3,120],["mods",5,180],["ships",12,220],["earned",1500,400],
["merges",8,500],["tier",5,900],["earned",9000,1600],["mods",6,1200],["tier",7,2600],["earned",60000,6000],["tier",8,15000]];

function play(seed,label){
  let mods=new Array(SLOTS).fill(0); mods[0]=1; mods[1]=1;
  let coins=70,earned=0,t=0,contract=0,merges=0,ships=0,shipT=2.2,maxTier=1,milestones=[];
  let r=seed; const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  const income=()=>mods.reduce((s,x)=>s+(x?rate(x):0),0);
  const dt=1/30;
  const marks={t1:null,t2:null,t5:null,t10:null,t300:null,t600:null};
  while(t<1800 && contract<CONTRACTS.length){
    t+=dt;
    const inc=income(), gain=inc*dt; coins+=gain; earned+=gain;
    shipT-=dt;
    if(shipT<=0){ shipT=Math.max(1.5,4.4-maxTier*0.28); ships++;
      const pay=Math.round(6+inc*1.6+maxTier*3); coins+=pay; earned+=pay; }
    // player acts ~3x/sec: merge first (frees slots + income), then build
    for(let a=0;a<SLOTS;a++) for(let b=a+1;b<SLOTS;b++)
      if(mods[a]&&mods[a]===mods[b]&&mods[a]<MAXTIER){
        const nt=mods[a]+1; mods[b]=0; mods[a]=nt; merges++;
        coins+=mergeBurst(nt); earned+=mergeBurst(nt);
        maxTier=Math.max(maxTier,nt); a=SLOTS; break; }
    const n=mods.filter(Boolean).length;
    if(n<SLOTS && coins>=buildCost(n)){ coins-=buildCost(n);
      const free=[]; mods.forEach((m,i)=>{if(!m)free.push(i);}); mods[free[(rnd()*free.length)|0]]=1; }
    const st={earned,tier:maxTier,mods:mods.filter(Boolean).length,ships,merges}[CONTRACTS[contract][0]]||0;
    if(st>=CONTRACTS[contract][1]){ coins+=CONTRACTS[contract][2]; earned+=CONTRACTS[contract][2];
      milestones.push(`  ${fmtT(t)}  Contract ${contract+1}: ${CONTRACTS[contract][0]} ${CONTRACTS[contract][1]}  income ${inc.toFixed(0)}/s  tier ${maxTier}`);
      contract++; if(contract>=CONTRACTS.length) break; }
    if(!marks.t1 && t>=1) marks.t1=inc; if(!marks.t2 && t>=60) marks.t2=inc;
    if(!marks.t5 && t>=300) marks.t5=inc; if(!marks.t10 && t>=600) marks.t10=inc;
  }
  const fmtT2=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  function fmtT(s){return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`}
  console.log(`\n--- ${label} (seed ${seed}) ---`);
  milestones.forEach(m=>console.log(m));
  console.log(`  FINISHED all ${CONTRACTS.length} contracts at ${fmtT(t)} (${(t/60).toFixed(1)} min)`);
  console.log(`  income: t=1s ${marks.t1?marks.t1.toFixed(1):'-'} /s | t=1min ${marks.t2?marks.t2.toFixed(0):'-'} /s | t=5min ${marks.t5?marks.t5.toFixed(0):'-'} /s | t=10min ${marks.t10?marks.t10.toFixed(0):'-'} /s`);
  console.log(`  total earned ${Math.round(earned).toLocaleString()} | merges ${merges} | ships ${ships} | max tier ${maxTier}`);
  return t;
}
console.log("\n=== SIMULATED SESSIONS (Playgama's bar is ~10 min average playtime) ===");
[1,7,42].forEach(s=>play(s,'competent player'));
console.log("\n=== CONTRAST ===");
console.log("  Astro Merge : 28-53 seconds, NO restart button, optimal strategy = do nothing");
