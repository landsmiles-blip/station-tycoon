// Contracts now UNLOCK slots as a reward, then the NEXT contract uses them. No deadlock.
// [key, target, reward, unlockSlots]
const CONTRACTS=[
 ["earned",150,   60,   5],["tier",3,     120,  0],["mods",5,    180, 6],["ships",14,  220,0],
 ["earned",2000,  400,  7],["merges",10,  500,  0],["tier",5,    900, 8],["earned",14000,1600,0],
 ["tier",6,      2600,  9],["mods",9,    6000, 0],["earned",90000,12000,0],["tier",8, 30000,0]];
function sim(P,label){
  const rate=t=>P.rateBase*Math.pow(P.rateMul,t-1);
  const buildCost=()=>Math.round(P.costBase*Math.pow(P.costMul,built));
  const burst=t=>Math.round(P.burstBase*Math.pow(P.burstMul,t-1));
  const fmtT=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  let slots=P.startSlots,mods=new Array(9).fill(0);mods[0]=1;mods[1]=1;
  let coins=P.startCoins,earned=0,t=0,contract=0,merges=0,ships=0,shipT=2.4,maxTier=1,act=0,built=0,ms=[];
  let r=42;const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  const income=()=>mods.reduce((s,x)=>s+(x?rate(x):0),0);
  const dt=1/60;
  while(t<2400&&contract<CONTRACTS.length){
    t+=dt;const inc=income(),g=inc*dt;coins+=g;earned+=g;
    shipT-=dt;if(shipT<=0){shipT=Math.max(1.6,4.6-maxTier*0.3);ships++;
      const pay=Math.round(P.shipBase+inc*P.shipMul+maxTier*3);coins+=pay;earned+=pay;}
    act-=dt;
    if(act<=0){act=1/3;let did=false;
      // human merges the HIGHEST pair available (greedy but sane)
      let best=-1,ba=-1,bb=-1;
      for(let a=0;a<9;a++)for(let b=a+1;b<9;b++)
        if(mods[a]&&mods[a]===mods[b]&&mods[a]<8&&mods[a]>best){best=mods[a];ba=a;bb=b;}
      if(ba>=0){const nt=best+1;mods[bb]=0;mods[ba]=nt;merges++;const bn=burst(nt);
        coins+=bn;earned+=bn;maxTier=Math.max(maxTier,nt);did=true;}
      if(!did){const n=mods.slice(0,slots).filter(Boolean).length;
        if(n<slots&&coins>=buildCost()){coins-=buildCost();built++;
          const fr=[];for(let i=0;i<slots;i++)if(!mods[i])fr.push(i);
          if(fr.length)mods[fr[(rnd()*fr.length)|0]]=1;}}
    }
    const key=CONTRACTS[contract][0];
    const st={earned,tier:maxTier,mods:mods.filter(Boolean).length,ships,merges}[key]||0;
    if(st>=CONTRACTS[contract][1]){const c=CONTRACTS[contract];
      coins+=c[2];earned+=c[2];if(c[3])slots=Math.max(slots,c[3]);
      ms.push(`   ${fmtT(t).padStart(5)}  #${String(contract+1).padStart(2)} ${key} ${c[1]}  |  inc ${inc.toFixed(0)}/s  T${maxTier}  ${slots} slots  builds ${built}`);
      contract++;if(contract>=CONTRACTS.length)break;}
  }
  const done=contract>=CONTRACTS.length;
  console.log(`\n### ${label}`);
  ms.forEach(m=>console.log(m));
  console.log(`   ${done?'✅ COMPLETE in '+fmtT(t)+` (${(t/60).toFixed(1)} min)`:'❌ stalled at #'+(contract+1)+' ('+CONTRACTS[contract][0]+' '+CONTRACTS[contract][1]+') after '+fmtT(t)}`);
  console.log(`   end income ${income().toFixed(0)}/s | earned ${Math.round(earned).toLocaleString()} | merges ${merges} | T${maxTier} | builds ${built}`);
}
const B={rateBase:1.5,rateMul:2.0,burstBase:6,burstMul:1.9,shipBase:8,shipMul:1.2,startSlots:4,startCoins:80};
console.log("TARGET: complete all 12 in 12-18 min, tier 8 reached, steady escalation (no 32-second burn)");
sim({...B,costBase:30,costMul:1.22},"A. cost 30 x 1.22^builds");
sim({...B,costBase:25,costMul:1.30},"B. cost 25 x 1.30^builds");
sim({...B,costBase:40,costMul:1.38},"C. cost 40 x 1.38^builds");
sim({...B,costBase:30,costMul:1.30,rateMul:2.05,burstMul:2.0},"D. B + richer progression");
