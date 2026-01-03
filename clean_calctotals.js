let run = 0, pass = 0, runEff = 0, passEff = 0, expl = 0;
dataSubset.forEach(p => {
    const isRun = p.playType?.toLowerCase().includes('run');
    const isPass = p.playType?.toLowerCase().includes('pass');

    if (isRun) run++;
    if (isPass) pass++;

    let eff = false;
    if (p.down === 1 && p.gain >= 4) eff = true;
    else if (p.down === 2 && p.gain >= (p.distance / 2)) eff = true;
    else if ((p.down === 3 || p.down === 4) && p.gain >= p.distance) eff = true;

    if (eff) {
        if (isRun) runEff++;
        if (isPass) passEff++;
    }

    if ((isRun && p.gain >= 12) || (isPass && p.gain >= 16)) expl++;
});

return {
    total,
    runPct: Math.round((run / total) * 100),
    passPct: Math.round((pass / total) * 100),
    runEff: run > 0 ? Math.round((runEff / run) * 100) : 0,
    passEff: pass > 0 ? Math.round((passEff / pass) * 100) : 0,
    explosive: Math.round((expl / total) * 100)
};
