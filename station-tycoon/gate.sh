#!/usr/bin/env bash
# VERIFICATION GATE — runs every check in MASTER_PROMPT_V2.md §8.
# Nothing may be presented as finished until this is fully green.
cd "$(dirname "$0")"
pass=0; fail=0
run(){ # name, gate, command
  local n="$1" g="$2"; shift 2
  local out rc
  out=$("$@" 2>&1); rc=$?
  if [ $rc -eq 0 ] && ! grep -qE "❌|FAIL|BROKEN|SyntaxError|AssertionError" <<<"$out"; then
    echo "  ✅ [$g] $n"; pass=$((pass+1))
  else
    echo "  ❌ [$g] $n"; fail=$((fail+1))
    grep -E "❌|FAIL|BROKEN|SyntaxError|AssertionError|Error" <<<"$out" | head -5 | sed 's/^/       /'
  fi
}
echo "=============================================================="
echo " STATION TYCOON — VERIFICATION GATE"
echo "=============================================================="
echo
echo " G6  ENGINEERING HYGIENE"
run "JS syntax check"            G6 node --check _check.js
run "duplicate-key static guard" G6 node keyguard.js
run "no external references"     G6 bash -c "! grep -qE 'https?://|src=|cdn' index.html"
run "size within 30MB budget"    G6 bash -c "test \$(stat -c%s index.html) -lt 31457280"
echo
echo " G4  AUDIO"
run "audio engine emits nodes"   G4 node audiotest.js
echo
echo " G1  DESIGN MATH   +   G3  PLATFORM COMPLIANCE   +   G5  PERSISTENCE"
run "device matrix + economy + save" G1/G3/G5 node verify.js
run "headless full playthrough"      G1/G5     node headless.js
echo
echo " G3  PLATFORM COMPLIANCE — overlays (the gap that hid C5)"
run "title screen + tutorial geometry" G3 node titletest.js
run "render smoke: 4 viewports x 21 scenes" G3 node rendersmoke.js
echo
echo " G2  CONTINUITY — the game must never end (Beaupre: always a best next thing)"
run "commission board: per-player goals"  G2 node commissiontest.js
run "return hook: pile then best goal"    G2 node returntest.js
run "ventures: franchise + orders"       G2 node venturetest.js
run "60-min franchise playthrough"       G2 node franchisesim.js
echo
echo " G5  LIFECYCLE — pause/resume must actually resume (the freeze bug)"
run "visibility freeze + keep-building" G5 node freezetest.js
echo
echo "=============================================================="
echo " $pass passed, $fail failed"
if [ $fail -eq 0 ]; then echo " ✅ ALL GATES GREEN"; else echo " ❌ GATE FAILED — do not present as finished"; fi
echo "=============================================================="
[ $fail -eq 0 ]
