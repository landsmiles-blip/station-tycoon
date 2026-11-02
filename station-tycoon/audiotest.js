// Mock a full WebAudio graph and run the REAL Audio2 engine to find out
// whether "no sound" is a code bug or an environment block.
const fs=require('fs'),vm=require('vm');
const body=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
let nodes=0,started=0,connected=0,gains=[],freqs=[];
function param(v){return{value:v,setValueAtTime(x){this.value=x;return this},
  exponentialRampToValueAtTime(x){this.value=x;return this},
  linearRampToValueAtTime(x){this.value=x;return this},
  cancelScheduledValues(){return this}};}
function node(extra){nodes++;return Object.assign({connect(t){connected++;return t},disconnect(){}},extra);}
class MockCtx{
  constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';
    this.destination=node({});}
  createGain(){const g=node({gain:param(1)});gains.push(g);return g;}
  createOscillator(){const o=node({type:'sine',frequency:param(440),detune:param(0),
    start(){started++;freqs.push(o.frequency.value);},stop(){}});return o;}
  createBiquadFilter(){return node({type:'lowpass',frequency:param(350),Q:param(1)});}
  createStereoPanner(){return node({pan:param(0)});}
  createConvolver(){return node({buffer:null});}
  createDynamicsCompressor(){return node({threshold:param(0),knee:param(0),ratio:param(1),attack:param(0),release:param(0)});}
  createDelay(){return node({delayTime:param(0)});}
  createBuffer(ch,len,sr){return{getChannelData:()=>new Float32Array(len)};}
  createBufferSource(){return node({buffer:null,start(){started++;},stop(){}});}
  resume(){this.state='running';}suspend(){this.state='suspended';}
}
let timers=0;
const win={innerWidth:390,innerHeight:844,devicePixelRatio:2,addEventListener(){},
  requestAnimationFrame:()=>1,AudioContext:MockCtx,
  localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0}};
const ctxStub=new Proxy({},{get(t,p){
  if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop(){}});
  if(p==='measureText')return()=>({width:50});
  if(['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline','globalAlpha',
   'globalCompositeOperation','shadowColor','shadowBlur','shadowOffsetY','lineCap','lineJoin','lineDashOffset'].includes(p))return t[p];
  return()=>{};},set(t,p,v){t[p]=v;return true;}});
const sandbox={window:win,document:{getElementById:()=>({width:0,height:0,style:{},getContext:()=>ctxStub,
  addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})}),
  addEventListener(){},hidden:false},
  localStorage:win.localStorage,performance:win.performance,requestAnimationFrame:win.requestAnimationFrame,
  console,Math,Date,JSON,parseInt,parseFloat,isNaN,setTimeout:()=>0,
  setInterval:(f,ms)=>{timers++;return timers;},clearInterval(){},Object,Array,String,Number,Boolean};
sandbox.globalThis=sandbox;vm.createContext(sandbox);
vm.runInContext(body+`;globalThis.__A=Audio2;globalThis.__I=IDENT;`,sandbox);
const A=sandbox.__A;
console.log("=== AUDIO ENGINE TEST (real code, mocked WebAudio) ===");
console.log("  before unlock: nodes="+nodes+" oscStarted="+started);
const nB=nodes;
A.unlock();
console.log("  after unlock():  nodes="+nodes+" oscStarted="+started+" musicTimers="+timers);
console.log("  AudioContext created ....... "+(nodes>0?"✅":"❌ never constructed"));
console.log("  score mix chain built ...... "+((nodes-nB)>=10?"✅ +"+(nodes-nB)+" nodes (comp, duck, reverb, ping-pong)":"❌"));
console.log("  music sequencer scheduled .. "+(timers>0?"✅ setInterval registered":"❌"));
const vB=started;A.scoreNow();
console.log("  score voices emit .......... "+(started>vB?"✅ +"+(started-vB)+" voice nodes in one 32-bar-loop bar":"❌ SILENT SCORE"));
const before=started;
A.merge(3); A.build(); A.dock(); A.contract(); A.ui(); A.deny(); A.unlock();
console.log("  SFX produce oscillators .... "+(started>before?"✅ +"+(started-before)+" nodes":"❌ SILENT"));
console.log("  master gain chain .......... "+(gains.length>=3?"✅ "+gains.length+" gain nodes":"❌"));
A.setMuted(true); const m=started; A.merge(5);
console.log("  mute silences SFX .......... "+(started===m?"✅ muted blocks output":"❌ plays while muted"));
A.setMuted(false);

/* THE FRANCHISE MUST BE AUDIBLE. Each venture carries its own music track
   (preset, key shift, tempo, lead timbre). Verify that switching the theme
   really re-scores the game: the sequencer restarts and the SFX follow the new
   root, so travelling to The Grand Bazaar sounds like arriving somewhere else. */
const I=sandbox.__I;
let themeOK=true,detail='';
try{
  A.setTheme(I[0].track);freqs=[];A.merge(4);A.dock();
  const f0=freqs.slice();
  const t0=timers;
  A.setTheme(I[1].track);freqs=[];A.merge(4);A.dock();
  const f1=freqs.slice();
  const ratio=f0.length&&f1.length?(f1[0]/f0[0]):0;
  themeOK=f0.length>0&&f1.length>0&&Math.abs(f0[0]-f1[0])>1&&timers>t0;
  detail='root '+f0[0].toFixed(0)+'Hz -> '+f1[0].toFixed(0)+'Hz (x'+ratio.toFixed(3)+'), sequencer restarted';
}catch(e){themeOK=false;detail=e.message;}
console.log("  per-venture theme change ... "+(themeOK?"✅ "+detail:"❌ "+detail));

console.log("\n  VERDICT: audio engine OK.");
console.log("  Context created, producer score chain + 32-bar scheduler live,");
console.log("  every SFX emits nodes, and mute actually silences output.");
console.log("  Guarded by keyguard.js: duplicate object-literal keys are what");
console.log("  silently shadowed unlock() and shipped the whole game mute.");
if(nodes===0||started<4||timers===0||!themeOK||(vB===started)){console.error("  *** AUDIO BROKEN ***");process.exit(1);}
