// Ember Court — game state, turns and combat.
// One state object, plain functions over it; render.js paints whatever it holds.

const MAX_LIFE = 30;
const MAX_MANA = 10;
const MAX_HAND = 7;
const MAX_BOARD = 5;

function newHero() {
  return { life: MAX_LIFE, mana: 0, maxMana: 0, hand: [], board: [], deck: [] };
}

function newGame(seed) {
  const rng = mulberry32(seed || (Math.random() * 1e9) | 0);
  const state = {
    seed, rng, turn: 1, phase: 'title', // title | play | combat | ai | over
    my: newHero(), foe: newHero(),
    selected: -1, // index into my.hand, -1 = none
    log: 'Welcome to Ember Court.',
    winner: null, turnsPlayed: 0, muted: false,
  };
  state.my.deck = shuffledDeck(rng);
  state.foe.deck = shuffledDeck(rng);
  drawCards(state.my, 3);
  drawCards(state.foe, 3);
  return state;
}

function drawCards(hero, n) {
  for (let i = 0; i < n; i++) {
    if (hero.deck.length === 0 || hero.hand.length >= MAX_HAND) return;
    hero.hand.push(hero.deck.pop());
  }
}

function startTurn(state, who) {
  const hero = state[who];
  hero.maxMana = Math.min(MAX_MANA, hero.maxMana + 1);
  hero.mana = hero.maxMana;
  for (const m of hero.board) m.sick = false;
  drawCards(hero, 1);
}

function startPlayerTurn(state) {
  state.turn++;
  state.turnsPlayed++;
  startTurn(state, 'my');
  state.phase = 'play';
  setLog(state, 'Turn ' + state.turn + ' — your lanterns burn brighter. Mana ' + state.my.mana + '.');
}

// --- Playing cards ---

function canPlay(state, handIndex) {
  if (state.phase !== 'play') return false;
  const def = CARD_BY_ID[state.my.hand[handIndex]];
  if (!def || def.cost > state.my.mana) return false;
  if (def.kind === 'minion' && state.my.board.length >= MAX_BOARD) return false;
  return true;
}

function playCard(state, handIndex, target) {
  if (!canPlay(state, handIndex)) return false;
  const defId = state.my.hand[handIndex];
  const def = CARD_BY_ID[defId];
  state.my.mana -= def.cost;
  state.my.hand.splice(handIndex, 1);
  state.selected = -1;
  if (def.kind === 'minion') {
    state.my.board.push(makeMinion(defId, 'my'));
    setLog(state, 'You summon ' + def.name + ' (' + def.atk + '/' + def.hp + ').');
  } else {
    castSpell(state, 'my', def, target);
  }
  renderAll(state);
  checkEnd(state);
  return true;
}

function castSpell(state, who, def, target) {
  const me = state[who];
  const them = state[who === 'my' ? 'foe' : 'my'];
  if (def.effect === 'bolt') {
    if (target && target.startsWith('minion:')) {
      const uid = target.slice(7);
      const m = them.board.find(x => x.uid === uid);
      if (m) {
        hurtMinion(state, them, m, 4);
        setLog(state, (who === 'my' ? 'Your' : 'The Sage\'s') + ' Ember Bolt sears ' + CARD_BY_ID[m.defId].name + ' for 4.');
      }
    } else {
      hurtHero(state, them, 4);
      setLog(state, (who === 'my' ? 'Your' : 'The Sage\'s') + ' Ember Bolt strikes the hero for 4.');
    }
  } else if (def.effect === 'mend') {
    me.life = Math.min(MAX_LIFE, me.life + 7);
    setLog(state, (who === 'my' ? 'You mend' : 'The Sage mends') + ' a lantern — +7 life.');
  } else if (def.effect === 'surge') {
    drawCards(me, 2);
    setLog(state, (who === 'my' ? 'You draw' : 'The Sage draws') + ' 2 cards in a Lantern Surge.');
  } else if (def.effect === 'quake') {
    for (const m of [...them.board]) hurtMinion(state, them, m, 2);
    setLog(state, 'Quake! Every enemy minion takes 2.');
  }
}

// --- Damage ---

function hurtHero(state, hero, amount) {
  hero.life = Math.max(0, hero.life - amount);
}

function hurtMinion(state, ownerHero, minion, amount) {
  minion.hp -= amount;
  if (minion.hp <= 0) {
    ownerHero.board = ownerHero.board.filter(m => m.uid !== minion.uid);
  }
}

// One ready minion strikes the foe across from it, or the hero if none.
function minionStrike(state, attacker, defender, slot) {
  const m = attacker.board[slot];
  if (!m || m.sick) return;
  const def = CARD_BY_ID[m.defId];
  const foeMinion = defender.board[slot];
  if (foeMinion) {
    const foeDef = CARD_BY_ID[foeMinion.defId];
    const bonus = elementBonus(def.el, foeDef.el);
    const dmg = m.atk + bonus;
    hurtMinion(state, defender, foeMinion, dmg);
    setLog(state, def.name + ' strikes ' + foeDef.name + ' for ' + dmg +
      (bonus ? ' (element advantage +2!)' : '') + '.');
  } else {
    hurtHero(state, defender, m.atk);
    setLog(state, def.name + ' hits the hero for ' + m.atk + '.');
  }
}

function combatPhase(state, who) {
  const attacker = state[who];
  const defender = state[who === 'my' ? 'foe' : 'my'];
  for (let slot = 0; slot < attacker.board.length; slot++) {
    minionStrike(state, attacker, defender, slot);
    if (defender.life <= 0) break;
  }
}

function checkEnd(state) {
  if (state.phase === 'over') return true;
  if (state.my.life <= 0 && state.foe.life <= 0) {
    endGame(state, state.my.board.length >= state.foe.board.length ? 'my' : 'foe');
  } else if (state.foe.life <= 0) {
    endGame(state, 'my');
  } else if (state.my.life <= 0) {
    endGame(state, 'foe');
  }
  return state.phase === 'over';
}

function endGame(state, winner) {
  state.phase = 'over';
  state.winner = winner;
  if (winner === 'my') {
    setLog(state, 'VICTORY! The Owl Sage bows to the Ember Fox.');
  } else {
    setLog(state, 'DEFEAT. ' + aiTaunt('win'));
  }
}

// --- Turn flow ---

function endPlayerTurn(state, done) {
  if (state.phase !== 'play') return;
  state.phase = 'combat';
  state.selected = -1;
  combatPhase(state, 'my');
  renderAll(state);
  if (checkEnd(state)) return;
  state.phase = 'ai';
  renderAll(state);
  setTimeout(() => aiTurn(state), 700);
  if (done) done();
}

function aiTurn(state) {
  if (state.phase !== 'ai') return;
  startTurn(state, 'foe');
  const plays = aiChoosePlays(state);
  let i = 0;
  const step = () => {
    if (state.phase !== 'ai') return;
    if (i < plays.length) {
      const play = plays[i++];
      const idx = state.foe.hand.indexOf(play.defId);
      const def = CARD_BY_ID[play.defId];
      if (idx >= 0 && def && def.cost <= state.foe.mana) {
        state.foe.mana -= def.cost;
        state.foe.hand.splice(idx, 1);
        if (def.kind === 'minion') {
          state.foe.board.push(makeMinion(play.defId, 'foe'));
          setLog(state, 'The Sage summons ' + def.name + ' (' + def.atk + '/' + def.hp + ').');
        } else {
          castSpell(state, 'foe', def, play.target);
        }
        renderAll(state);
        setTimeout(step, 650);
        return;
      }
      setTimeout(step, 120);
      return;
    }
    combatPhase(state, 'foe');
    renderAll(state);
    if (checkEnd(state)) return;
    setTimeout(() => {
      if (state.phase !== 'ai') return;
      startPlayerTurn(state);
      renderAll(state);
    }, 700);
  };
  step();
}

function setLog(state, text) {
  state.log = text;
  const el = document.getElementById('log');
  if (el) el.textContent = text;
}
