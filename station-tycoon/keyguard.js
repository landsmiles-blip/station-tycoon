/* STATIC GUARD: duplicate keys in an object literal silently shadow the earlier
   one. That is exactly how Audio2 lost its context-initialiser and the whole
   game shipped mute. Fail the build if it ever happens again. */
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const lines=src.split('\n');
let depth=0,scopes=[],bad=[];
const KEY=/^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{\s*$/;
const KW=new Set(['if','for','while','switch','catch','function','return','do','else','try','with']);
lines.forEach((ln,i)=>{
  const m=ln.match(KEY);
  if(m&&KW.has(m[1]))return;
  if(m&&depth>0)scopes[depth]=scopes[depth]||{},(scopes[depth][m[1]]=scopes[depth][m[1]]||[]).push(i+1);
  for(const ch of ln){ if(ch==='{')depth++; if(ch==='}'){ if(depth>0&&scopes[depth]){
      for(const k in scopes[depth]){const at=scopes[depth][k];if(at.length>1)bad.push({k,at});}
      delete scopes[depth];} depth=Math.max(0,depth-1); } }
});
console.log("=== DUPLICATE-KEY GUARD ===");
if(bad.length){bad.forEach(b=>console.log("  ❌ '"+b.k+"' defined "+b.at.length+"x at lines "+b.at.join(", ")));process.exit(1);}
console.log("  ✅ no shadowed object-literal keys ("+lines.length+" lines scanned)");
const api=src.slice(src.indexOf('const Audio2'),src.indexOf('2. UTILS'));
const keys=[...api.matchAll(/^\s{4}([a-zA-Z]\w*)\s*\(/gm)].map(m=>m[1]);
const called=[...new Set([...src.matchAll(/Audio2\.(\w+)\(/g)].map(m=>m[1]))];
const missing=called.filter(c=>!keys.includes(c)&&!['setMuted','isMuted'].includes(c)&&!keys.includes(c));
console.log("  Audio2 API: "+keys.join(", "));
console.log("  call sites resolve: "+(missing.length?"❌ undefined -> "+missing.join(","):"✅ all "+called.length+" defined"));
if(missing.length)process.exit(1);
