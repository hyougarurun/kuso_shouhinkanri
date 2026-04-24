// Balance simulator for arigatorun.html
// Runs N races with identical logic and prints win rate / avg rank / duration stats.
// Usage: node sim-arigatorun.js [N]

const RUNNERS = [
  { id: 'sushi',   name: '寿司ロボ',     speed: 3, stamina: 3 },
  { id: 'onigiri', name: 'おにぎり侍',   speed: 3, stamina: 3 },
  { id: 'turtle',  name: 'カメハメ吉',   speed: 2, stamina: 5 },
  { id: 'rocket',  name: 'ロケット部長', speed: 3, stamina: 2 },
  { id: 'ice',     name: '氷ブロック',   speed: 3, stamina: 3 },
  { id: 'octopus', name: 'タコ先生',     speed: 3, stamina: 3 },
];

const CONDITIONS = {
  good:   { mult: 1.15 },
  normal: { mult: 1.00 },
  bad:    { mult: 0.85 },
};

// --- tunable constants (mirror arigatorun.html) ---
const STEP = 0.00030;
const TOTAL_LAPS = 3;
const FPS = 60;
const TICK_MS = 1000 / FPS;
const POST_WINNER_MS = 3000;

const ULT = {
  sushi:   { boostMs: 1100, mult: 1.55 },
  onigiri: { mult: 1.5, drag: 0.92 },   // lap 1 0-0.4 boost, light drag
  turtle:  { mult: 3.0, lap2Mult: 1.04 },// lap 2 tiny boost, lap 3+ 3.0x
  rocket:  { boostMs: 1400, coolMs: 1400, mult: 1.9, drag: 0.78, chance: 0.20, rollMs: 900 },
  ice:     { boostMult: 1.45, posThreshold: 3 }, // lap 3 && pos>=3 → boost
  octopus: { mult: 1.1, minPos: 3, maxPos: 4 },  // 3-4位で加速
};

function randCond() {
  const r = Math.random();
  return r < 0.28 ? 'good' : r < 0.75 ? 'normal' : 'bad';
}

function posMap(state) {
  const m = {};
  state.ranking.forEach((rid, i) => { m[rid] = i + 1; });
  const live = RUNNERS.filter(r => !state.ranking.includes(r.id));
  live.sort((a, b) => state.prog[b.id] - state.prog[a.id]);
  live.forEach((r, i) => { m[r.id] = state.ranking.length + i + 1; });
  return m;
}

function applyUlt(state, r, now, prog, position) {
  const us = state.ult[r.id];
  const lap = Math.floor(prog) + 1;
  switch (r.id) {
    case 'sushi': {
      if ((lap === 2 || lap === 3) && us.lastLap !== lap) {
        us.lastLap = lap;
        us.boostUntil = now + ULT.sushi.boostMs;
      }
      return now < (us.boostUntil || 0) ? ULT.sushi.mult : 1;
    }
    case 'onigiri': {
      return prog < 0.4 ? ULT.onigiri.mult : (prog < 1.0 ? ULT.onigiri.drag : 1);
    }
    case 'turtle': {
      if (lap >= 3) return ULT.turtle.mult;
      if (lap >= 2) return ULT.turtle.lap2Mult;
      return 1;
    }
    case 'rocket': {
      if (!us.nextRoll) us.nextRoll = now + 1500;
      if (now >= us.nextRoll) {
        us.nextRoll = now + ULT.rocket.rollMs;
        if (!us.boostUntil && !us.cooldownUntil && Math.random() < ULT.rocket.chance) {
          us.boostUntil = now + ULT.rocket.boostMs;
        }
      }
      if (us.boostUntil && now < us.boostUntil) return ULT.rocket.mult;
      if (us.boostUntil && now >= us.boostUntil && !us.cooldownUntil) {
        us.cooldownUntil = now + ULT.rocket.coolMs;
        us.boostUntil = null;
      }
      if (us.cooldownUntil && now < us.cooldownUntil) return ULT.rocket.drag;
      if (us.cooldownUntil && now >= us.cooldownUntil) us.cooldownUntil = null;
      return 1;
    }
    case 'ice': {
      if (lap >= 3 && position >= ULT.ice.posThreshold) return ULT.ice.boostMult;
      return 1;
    }
    case 'octopus': {
      return (position >= ULT.octopus.minPos && position <= ULT.octopus.maxPos) ? ULT.octopus.mult : 1;
    }
  }
  return 1;
}

function simRace() {
  const state = { prog: {}, ranking: [], ult: {}, cond: {} };
  RUNNERS.forEach(r => { state.prog[r.id] = 0; state.ult[r.id] = {}; state.cond[r.id] = randCond(); });
  let now = 0, winnerTime = null;
  while (state.ranking.length < RUNNERS.length) {
    now += TICK_MS;
    const pm = posMap(state);
    for (const r of RUNNERS) {
      if (state.ranking.includes(r.id)) continue;
      const cmult = CONDITIONS[state.cond[r.id]].mult;
      const prog = state.prog[r.id];
      const staminaFactor = r.stamina / 5;
      const fatigue = Math.max(0.55, 1 - (prog / TOTAL_LAPS) * (1 - staminaFactor) * 0.7);
      const noise = 0.7 + Math.random() * 0.6;
      const um = applyUlt(state, r, now, prog, pm[r.id] || 6);
      state.prog[r.id] += r.speed * cmult * fatigue * noise * um * STEP;
      if (state.prog[r.id] >= TOTAL_LAPS) {
        state.prog[r.id] = TOTAL_LAPS;
        state.ranking.push(r.id);
        if (winnerTime === null) winnerTime = now;
      }
    }
    if (winnerTime !== null && now - winnerTime > POST_WINNER_MS) {
      const remain = RUNNERS.filter(r => !state.ranking.includes(r.id));
      remain.sort((a, b) => state.prog[b.id] - state.prog[a.id]);
      remain.forEach(r => state.ranking.push(r.id));
      break;
    }
    if (now > 200000) break; // safety
  }
  return { ranking: state.ranking, winnerTime: winnerTime / 1000 };
}

function main() {
  const N = parseInt(process.argv[2] || '2000', 10);
  const stats = {};
  RUNNERS.forEach(r => { stats[r.id] = { wins: 0, ranks: [0,0,0,0,0,0,0], totalRank: 0 }; });
  const times = [];
  let top2Margin = 0, top3Margin = 0;

  for (let i = 0; i < N; i++) {
    const res = simRace();
    res.ranking.forEach((rid, idx) => {
      const rank = idx + 1;
      stats[rid].ranks[rank]++;
      stats[rid].totalRank += rank;
      if (rank === 1) stats[rid].wins++;
    });
    times.push(res.winnerTime);
  }
  times.sort((a, b) => a - b);

  console.log(`== ${N} races ==`);
  console.log(`winner time: min=${times[0].toFixed(1)}s  p25=${times[Math.floor(N*0.25)].toFixed(1)}s  med=${times[Math.floor(N*0.5)].toFixed(1)}s  p75=${times[Math.floor(N*0.75)].toFixed(1)}s  max=${times[N-1].toFixed(1)}s  avg=${(times.reduce((a,b)=>a+b,0)/N).toFixed(1)}s`);
  console.log('');
  console.log('name          speed sta | win% avgR | 1位   2位   3位   4位   5位   6位');
  console.log('-'.repeat(92));
  RUNNERS.forEach(r => {
    const s = stats[r.id];
    const winPct = (s.wins / N * 100).toFixed(1);
    const avgRank = (s.totalRank / N).toFixed(2);
    const dist = s.ranks.slice(1).map(c => (c/N*100).toFixed(1).padStart(4) + '%').join(' ');
    console.log(`${r.name.padEnd(12)}  ${r.speed}    ${r.stamina}   |${winPct.padStart(5)}% ${avgRank.padStart(5)} | ${dist}`);
  });

  // imbalance summary
  const winPcts = RUNNERS.map(r => stats[r.id].wins / N);
  const maxW = Math.max(...winPcts), minW = Math.min(...winPcts);
  const idealMin = 1/6 - 0.08, idealMax = 1/6 + 0.08;
  console.log('');
  console.log(`spread: max=${(maxW*100).toFixed(1)}%  min=${(minW*100).toFixed(1)}%  target=16.7%±8%`);
  if (maxW > idealMax) console.log(`  OP: ${RUNNERS.find(r => stats[r.id].wins/N === maxW).name}`);
  if (minW < idealMin) console.log(`  weak: ${RUNNERS.find(r => stats[r.id].wins/N === minW).name}`);
}

main();
