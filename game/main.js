// Ember Court — boot, input and demo states.
// Loads the title screen; Enter / the button starts a real duel.
// ?shot=table|win|loss opens a fixed, reproducible mid-game state for screenshots.

let state = newGame(20261123);

function beginDuel() {
  state = newGame((Math.random() * 1e9) | 0);
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('end-screen').classList.add('hidden');
  startTurn(state, 'my');
  state.phase = 'play';
  state.turn = 1;
  setLog(state, 'Turn 1 — play a card, then end your turn. The Sage awaits.');
  renderAll(state);
}

// Click a card in your hand: minions and instant spells play at once;
// Ember Bolt waits for a target (click the Sage or one of his minions).
function onHandCard(s, i) {
  if (s.phase !== 'play') return;
  const def = CARD_BY_ID[s.my.hand[i]];
  if (!def) return;
  if (def.effect === 'bolt') {
    s.selected = s.selected === i ? -1 : i;
    setLog(s, s.selected >= 0
      ? 'Ember Bolt armed — click the Sage or one of his minions.'
      : 'Bolt lowered.');
    renderAll(s);
    return;
  }
  playCard(s, i, 'self');
}

function onTargetMinion(s, uid) {
  if (s.selected < 0) return;
  playCard(s, s.selected, 'minion:' + uid);
}

function onTargetHero(s) {
  if (s.selected < 0) return;
  playCard(s, s.selected, 'hero');
}

function onEndTurn() {
  endPlayerTurn(state);
}

// Keyboard: 1-7 play a card, Space ends the turn, Enter starts / plays again.
document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '7') {
    const i = Number(e.key) - 1;
    if (state.phase === 'play') onHandCard(state, i);
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (state.phase === 'play') onEndTurn();
  } else if (e.key === 'Enter') {
    if (!document.getElementById('title-screen').classList.contains('hidden')) beginDuel();
    else if (state.phase === 'over') beginDuel();
  }
});

document.getElementById('start-btn').addEventListener('click', beginDuel);
document.getElementById('again-btn').addEventListener('click', beginDuel);
document.getElementById('end-turn').addEventListener('click', onEndTurn);
document.getElementById('foe-hero').addEventListener('click', () => onTargetHero(state));
document.getElementById('mute-btn').addEventListener('click', (e) => {
  state.muted = !state.muted;
  e.currentTarget.textContent = state.muted ? '🔇' : '🔊';
});

// --- Demo states for screenshots (?shot=...) ---
// These are fixed states of the real game code — the same render path,
// the same cards — so the screenshots are true renders of the game.

function demoState(kind) {
  const s = newGame(20261123);
  s.phase = 'play';
  document.getElementById('title-screen').classList.add('hidden');
  if (kind === 'table') {
    s.turn = 5; s.turnsPlayed = 4;
    s.my.maxMana = 6; s.my.mana = 4; s.my.life = 27;
    s.foe.maxMana = 6; s.foe.mana = 2; s.foe.life = 22;
    s.my.hand = ['knight', 'bolt', 'mend', 'serpent', 'sprout'];
    s.foe.hand = ['imp', 'whelp', 'golem', 'bolt'];
    s.my.board = [makeMinion('golem', 'my'), makeMinion('knight', 'my')];
    s.foe.board = [makeMinion('serpent', 'foe'), makeMinion('warden', 'foe')];
    s.my.board.forEach(m => { m.sick = false; });
    s.foe.board.forEach(m => { m.sick = false; });
    setLog(s, 'Turn 5 — your Golem and Knight stand ready. The Sage is at 22 ❤.');
  } else if (kind === 'win') {
    s.turn = 9; s.turnsPlayed = 8;
    s.my.maxMana = 9; s.my.mana = 5; s.my.life = 14;
    s.foe.maxMana = 9; s.foe.mana = 0; s.foe.life = 0;
    s.my.hand = ['phoenix', 'bolt'];
    s.foe.hand = ['imp'];
    s.my.board = [makeMinion('phoenix', 'my'), makeMinion('colossus', 'my')];
    s.my.board.forEach(m => { m.sick = false; });
    endGame(s, 'my');
  } else if (kind === 'loss') {
    s.turn = 8; s.turnsPlayed = 7;
    s.my.maxMana = 8; s.my.mana = 1; s.my.life = 0;
    s.foe.maxMana = 8; s.foe.mana = 6; s.foe.life = 19;
    s.my.hand = ['imp', 'mend'];
    s.foe.hand = ['leviathan', 'serpent'];
    s.foe.board = [makeMinion('leviathan', 'foe'), makeMinion('serpent', 'foe')];
    s.foe.board.forEach(m => { m.sick = false; });
    endGame(s, 'foe');
  }
  return s;
}

function boot() {
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot === 'table' || shot === 'win' || shot === 'loss') {
    state = demoState(shot);
  }
  renderAll(state);
}

boot();
