// Contract list: reward UNLOCKS slots, next contract USES them. Final goal = Tier 7; Tier 8 is endless brag.
const CONTRACTS=[
 ["earned",150,  60,  5,"Bank 150 credits"],
 ["tier",3,     140,  0,"Reach a Tier 3 module"],
 ["mods",5,     220,  6,"Own 5 modules at once"],
 ["ships",14,   260,  0,"Dock 14 cargo ships"],
 ["earned",2500,500,  7,"Bank 2,500 credits"],
 ["merges",10,  550,  0,"Perform 10 merges"],
 ["tier",5,    1100,  8,"Reach a Tier 5 module"],
 ["earned",18000,2000,0,"Bank 18,000 credits"],
 ["tier",6,    3200,  9,"Reach a Tier 6 module"],
 ["mods",9,    7000,  0,"Fill every module slot"],
 ["earned",120000,14000,0,"Bank 120,000 credits"],
 ["tier",7,   30000,  0,"Forge the Fusion Spike"]];
function sim(P,label){
  const rate=t=>P.rateBase*Math.pow(P.rateMul,t-1);
  const burst=t=>Math.round(P.burstBase*Math.pow(P.burstMul,t-1));
  const fmtT=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  let slots=P.startSlots,mods=new Array(9).fill(0);mods[0]=1;mods[1]=1;
  let coins=P.startCoins,earned=0,t=0,contract=0,merges=0,ships=0,shipT=2.4,maxTier=1,act=0,built=0,ms=[];
  let r=42;const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  const income=()=>mods.reduce((s,x)=>s+(x?rate(x):0),0);
  // COST SCALES WITH INCOME, not with grind count -> can never wall off.
  const buildCost=()=>Math.max(P.costFloor,Math.round(P.costK*(income()+P.costPad)));
  const dt=1/60;
  while(t<2700&&contract<CONTRACTS.length){
    t+=dt;const inc=income(),g=inc*dt;coins+=g;earned+=g;
    shipT-=dt;if(shipT<=0){shipT=Math.max(1.6,4.6-maxTier*0.3);ships++;
      const pay=Math.round(P.shipBase+inc*P.shipMul+maxTier*4);coins+=pay;earned+=pay;}
    act-=dt;
    if(act<=0){act=1/3;let did=false;
      let best=-1,ba=-1,bb=-1;
      for(let a=0;a<9;a++)for(let b=a+1;b<9;b++)
        if(mods[a]&&mods[a]===mods[b]&&mods[a]<8&&mods[a]>best){best=mods[a];ba=a;bb=b;}
      if(ba>=0){const nt=best+1;mods[bb]=0;mods[ba]=nt;merges++;const bn=burst(nt);
        coins+=bn;earned+=bn;maxTier=Math.max(maxTier,nt);did=true;}
      if(!did){const n=mods.slice(0,slots).filter(Boolean).length,c=buildCost();
        if(n<slots&&coins>=c){coins-=c;built++;
          const fr=[];for(let i=0;i<slots;i++)if(!mods[i])fr.push(i);
          if(fr.length)mods[fr[(rnd()*fr.length)|0]]=1;}}
    }
    const c=CONTRACTS[contract],key=c[0];
    const st={earned,tier:maxTier,mods:mods.filter(Boolean).length,ships,merges}[key]||0;
    if(st>=c[1]){coins+=c[2];earned+=c[2];if(c[3])slots=Math.max(slots,c[3]);
      ms.push(`   ${fmtT(t).padStart(5)}  #${String(contract+1).padStart(2)} ${c[4].padEnd(28)} inc ${inc.toFixed(0).padStart(5)}/s  T${maxTier}  ${slots} slots  builds ${built}`);
      contract++;if(contract>=CONTRACTS.length)break;}
  }
  const done=contract>=CONTRACTS.length;
  console.log(`\n### ${label}`);
  ms.forEach(m=>console.log(m));
  console.log(`   ${done?'✅ COMPLETE in '+fmtT(t)+` (${(t/60).toFixed(1)} min)`:'❌ stalled at #'+(contract+1)+' "'+CONTRACTS[contract][4]+'" after '+fmtT(t)}`);
  console.log(`   end inc ${income().toFixed(0)}/s | earned ${Math.round(earned).toLocaleString()} | merges ${merges} | T${maxTier} | builds ${built}`);
  return done?t:null;
}
console.log("TARGET: all 12 contracts in ~12-18 min, steady escalation, Tier 7 reached");
const B={rateBase:1.5,rateMul:2.15,burstBase:10,burstMul:2.0,shipBase:8,shipMul:1.4,startSlots:4,startCoins:90,costFloor:15,costPad:4};
sim({...B,costK:4},"A. build = 4s of income");
sim({...B,costK:6},"B. build = 6s of income");
sim({...B,costK:8},"C. build = 8s of income");
sim({...B,costK:6,rateMul:2.25,burstMul:2.1},"D. 6s + faster income growth");
