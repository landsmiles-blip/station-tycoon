// Human-like player: max ~3 actions/sec, ONE merge per action (not a chain).
const CONTRACTS=[["earned",150,60],["tier",3,120],["slots",5,180],["ships",14,220],["earned",2000,400],
["merges",10,500],["tier",5,900],["slots",7,1600],["earned",14000,1200],["tier",6,2600],["slots",9,6000],["tier",8,15000]];
function sim(P,label){
  const rate=t=>P.rateBase*Math.pow(P.rateMul,t-1);
  const buildCost=n=>Math.round(P.costBase*Math.pow(P.costMul,n));
  const burst=t=>Math.round(P.burstBase*Math.pow(P.burstMul,t-1));
  const fmtT=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  let slots=P.startSlots, mods=new Array(9).fill(0); mods[0]=1; mods[1]=1;
  let coins=P.startCoins,earned=0,t=0,contract=0,merges=0,ships=0,shipT=2.4,maxTier=1,act=0,ms=[];
  let r=42;const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};
  const income=()=>mods.reduce((s,x)=>s+(x?rate(x):0),0);
  const dt=1/60; const inc1=income();
  while(t<2400 && contract<CONTRACTS.length){
    t+=dt; const inc=income(), g=inc*dt; coins+=g; earned+=g;
    shipT-=dt; if(shipT<=0){ shipT=Math.max(1.6,4.6-maxTier*0.3); ships++;
      const pay=Math.round(P.shipBase+inc*P.shipMul+maxTier*3); coins+=pay; earned+=pay; }
    act-=dt;
    if(act<=0){ act=1/3; // one human action
      let did=false;
      for(let a=0;a<9&&!did;a++)for(let b=a+1;b<9;b++)
        if(mods[a]&&mods[a]===mods[b]&&mods[a]<8){const nt=mods[a]+1;mods[b]=0;mods[a]=nt;merges++;
          const bn=burst(nt);coins+=bn;earned+=bn;maxTier=Math.max(maxTier,nt);did=true;break;}
      if(!did){const n=mods.filter(Boolean).length;
        if(n<slots&&coins>=buildCost(n)){coins-=buildCost(n);const fr=[];
          mods.forEach((m,i)=>{if(!m&&i<slots)fr.push(i);});if(fr.length)mods[fr[(rnd()*fr.length)|0]]=1;}}
    }
    const key=CONTRACTS[contract][0];
    const st={earned,tier:maxTier,slots,ships,merges}[key]||0;
    if(st>=CONTRACTS[contract][1]){ coins+=CONTRACTS[contract][2]; earned+=CONTRACTS[contract][2];
      ms.push(`   ${fmtT(t).padStart(5)}  #${contract+1} ${key} ${CONTRACTS[contract][1]}  |  income ${inc.toFixed(0)}/s  tier ${maxTier}  slots ${slots}`);
      contract++; if(contract>=CONTRACTS.length)break;
      const unlock={3:5,5:6,7:7,9:8,11:9}[contract]; if(unlock) slots=Math.max(slots,unlock); }
  }
  const done=contract>=CONTRACTS.length;
  console.log(`\n### ${label}`);
  ms.forEach(m=>console.log(m));
  console.log(`   ${done?'✅ ALL 12 CONTRACTS DONE at '+fmtT(t):'❌ STALLED at contract '+(contract+1)+' after '+fmtT(t)}`);
  console.log(`   income@1s ${inc1.toFixed(1)}/s | end income ${income().toFixed(0)}/s | earned ${Math.round(earned).toLocaleString()} | merges ${merges} | maxTier ${maxTier}`);
  return {done,t,inc1,endInc:income(),maxTier};
}
const base={rateBase:1.5,rateMul:2.0,costBase:25,costMul:2.1,burstBase:6,burstMul:1.9,shipBase:8,shipMul:1.2,startSlots:4,startCoins:80};
console.log("TARGET: income@1s should be small (~3/s), all 12 contracts in 12-18 min, tier 8 reachable");
sim(base,"A. baseline tuning");
sim({...base,rateMul:2.05,costMul:2.35,burstMul:1.75},"B. steeper costs, softer bursts");
sim({...base,rateMul:2.05,costMul:2.6,burstMul:1.6,shipMul:0.9},"C. much steeper costs");
sim({...base,rateMul:2.1,costMul:2.8,burstMul:1.55,shipMul:0.8,startCoins:60},"D. steepest");
