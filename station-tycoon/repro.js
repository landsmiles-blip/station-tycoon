/* REPRO: finish all contracts, land on EMPIRE COMPLETE, press KEEP BUILDING,
   then watch G.shake and G.scene over the next few seconds. */
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
vm.runInContext(body+`\n;globalThis.__T={get G(){return G},update,render,newGame,layout,resize,tryBuild,doMerge,get MAXTIER(){return MAXTIER},
  get OVERLAY_BTNS(){return OVERLAY_BTNS},get L(){return L},saveGame,loadGame,progress};`,sb);
const T=sb.__T,G=()=>T.G;
T.resize();T.newGame(false);T.layout();G().scene='play';
const dt=1/120;let t=0,act=0;
while(t<2400&&G().scene==='play'){
  T.update(dt);t+=dt;act-=dt;
  if(act<=0){act=1/3;
    let best=-1,ba=null,bb=null;
    G().mods.forEach((m,i)=>{if(!m)return;G().mods.forEach((o,j)=>{
      if(j<=i||!o)return;if(o.tier===m.tier&&m.tier<T.MAXTIER&&m.tier>best){best=m.tier;ba=m;bb=o;}});});
    if(ba)T.doMerge(ba,bb);else T.tryBuild();
  }
}
console.log('reached scene='+G().scene+' contract='+G().contract+' merges='+G().merges+' builds='+G().built+' income='+G().income.toFixed(0)+' at t='+t.toFixed(1));
if(G().scene!=='done'){console.log('DID NOT REACH DONE - abort');process.exit(1);}
console.log('EMPIRE COMPLETE shown. shake='+G().shake.toFixed(2)+' flash='+G().flash.toFixed(2));
T.render(); // populate OVERLAY_BTNS
const kb=T.OVERLAY_BTNS.find(b=>/KEEP/i.test(''+b.label))||T.OVERLAY_BTNS[T.OVERLAY_BTNS.length-1];
console.log('overlay buttons:',T.OVERLAY_BTNS.length);
kb.fn();                       // <- this is literally what the button does
console.log('after KEEP BUILDING: scene='+G().scene);
for(let i=0;i<10;i++){
  for(let k=0;k<30;k++){T.update(dt);}   // 0.25s of sim
  T.render();
  console.log(`  +${((i+1)*0.25).toFixed(2)}s  scene=${G().scene}  shake=${G().shake.toFixed(3)}  flash=${G().flash.toFixed(3)}  credits=${Math.round(G().coins)}  income=${G().income.toFixed(0)}/s`);
}
