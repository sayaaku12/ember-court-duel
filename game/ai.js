// Ember Court — the Owl Sage's brain.
// A readable, greedy heuristic: spend mana on the best value it can afford,
// bolt the hero when lethal is near, mend when hurt, and never hold back.

// Plays are named by card id, not hand index: the hand shrinks as cards
// are played, so an index recorded earlier would point at the wrong card.
function aiChoosePlays(state) {
  const foe = state.foe;
  const plays = [];
  let mana = foe.mana;
  let boardRoom = 5 - foe.board.length;
  // Try cards from most expensive to cheapest, so big threats land first.
  const order = foe.hand
    .map((id) => ({ id, def: CARD_BY_ID[id] }))
    .sort((a, b) => b.def.cost - a.def.cost);
  for (const pick of order) {
    const def = pick.def;
    if (def.cost > mana) continue;
    if (def.kind === 'minion') {
      if (boardRoom <= 0) continue;
      plays.push({ defId: pick.id, target: 'board' });
      mana -= def.cost; boardRoom--;
    } else if (def.effect === 'bolt') {
      // Save the bolt for the killing blow, else throw it at the biggest threat.
      const lethal = foe.life > 0 && state.my.life <= 4;
      const bigFoe = state.my.board.reduce((best, m) =>
        (!best || m.atk > best.atk ? m : best), null);
      if (lethal) plays.push({ defId: pick.id, target: 'hero' });
      else if (bigFoe && bigFoe.atk >= 4) plays.push({ defId: pick.id, target: 'minion:' + bigFoe.uid });
      else if (state.my.board.length === 0) plays.push({ defId: pick.id, target: 'hero' });
      else continue;
      mana -= def.cost;
    } else if (def.effect === 'mend') {
      if (foe.life <= 18) { plays.push({ defId: pick.id, target: 'self' }); mana -= def.cost; }
    } else if (def.effect === 'surge') {
      if (foe.hand.length <= 4) { plays.push({ defId: pick.id, target: 'self' }); mana -= def.cost; }
    } else if (def.effect === 'quake') {
      const worthIt = state.my.board.filter(m => m.hp <= 2).length >= 2;
      if (worthIt) { plays.push({ defId: pick.id, target: 'self' }); mana -= def.cost; }
    }
  }
  return plays;
}

// The Sage's table talk: short, in character, shown in the log.
function aiTaunt(kind) {
  const lines = {
    open: ['The Owl Sage adjusts his spectacles.', 'Mistral hoots softly. "Your move, little fox."'],
    bolt: ['"A spark, well aimed," hoots the Sage.', 'The Sage flicks a bolt across the table.'],
    mend: ['The Sage sips lantern-light and stands taller.', '"Patience," says the Sage, mending his lantern.'],
    big: ['"A fine beast," the Sage admits.', 'The Sage eyes your minion warily.'],
    win: ['"The court is mine tonight," hoots Mistral.', 'The Owl Sage bows. "A lesson, little fox."'],
    lose: ['"Well played," the Sage concedes.', 'Mistral ruffles his feathers. "Again, then."'],
  };
  const pool = lines[kind] || lines.open;
  return pool[Math.floor(Math.random() * pool.length)];
}
