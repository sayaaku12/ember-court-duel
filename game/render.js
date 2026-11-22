// Ember Court — paints the state into the DOM: heroes, hands, boards, overlays.

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function manaPips(hero) {
  let s = '';
  for (let i = 0; i < MAX_MANA; i++) s += i < hero.mana ? '🔷' : (i < hero.maxMana ? '🔹' : '▫️');
  return s + ' ' + hero.mana + '/' + hero.maxMana;
}

function cardNode(state, defId, opts) {
  const def = CARD_BY_ID[defId];
  const card = el('div', 'card ' + def.el + (def.kind === 'spell' ? ' spell' : ''));
  card.appendChild(el('div', 'cost', String(def.cost)));
  card.appendChild(el('div', 'suit', ELEMENTS[def.el].icon));
  card.appendChild(el('div', 'art', def.art));
  card.appendChild(el('div', 'name', def.name));
  card.appendChild(el('div', 'text', def.text));
  if (def.kind === 'minion') {
    const stats = el('div', 'stats');
    stats.appendChild(el('span', 'atk', String(def.atk)));
    stats.appendChild(el('span', 'hp', String(def.hp)));
    card.appendChild(stats);
  }
  if (opts && opts.key) card.appendChild(el('div', 'key', opts.key));
  if (opts && opts.onClick) card.addEventListener('click', opts.onClick);
  return card;
}

function minionNode(state, m, slot, owner) {
  const def = CARD_BY_ID[m.defId];
  const card = el('div', 'card ' + def.el + (m.sick ? ' sick' : ' ready'));
  card.appendChild(el('div', 'cost', String(def.cost)));
  card.appendChild(el('div', 'suit', ELEMENTS[def.el].icon));
  card.appendChild(el('div', 'art', def.art));
  card.appendChild(el('div', 'name', def.name));
  // Board minions show no flavour line: it would collide with the stats row.
  const stats = el('div', 'stats');
  stats.appendChild(el('span', 'atk', String(m.atk)));
  stats.appendChild(el('span', 'hp', String(m.hp)));
  card.appendChild(stats);
  if (state.selected >= 0) {
    const sel = CARD_BY_ID[state.my.hand[state.selected]];
    if (sel && sel.effect === 'bolt' && owner === 'foe') {
      card.classList.add('targetable');
      card.addEventListener('click', () => onTargetMinion(state, m.uid));
    }
  }
  return card;
}

function renderBoard(state, who) {
  const boardEl = document.getElementById(who === 'my' ? 'my-board' : 'foe-board');
  boardEl.innerHTML = '';
  const board = state[who].board;
  for (let slot = 0; slot < MAX_BOARD; slot++) {
    if (board[slot]) boardEl.appendChild(minionNode(state, board[slot], slot, who));
    else boardEl.appendChild(el('div', 'slot'));
  }
}

function renderHands(state) {
  const myHand = document.getElementById('my-hand');
  myHand.innerHTML = '';
  state.my.hand.forEach((defId, i) => {
    const playable = canPlay(state, i);
    const node = cardNode(state, defId, {
      key: String(i + 1),
      onClick: () => onHandCard(state, i),
    });
    if (!playable) node.classList.add('unplayable');
    if (state.selected === i) node.classList.add('selected');
    myHand.appendChild(node);
  });
  const foeHand = document.getElementById('foe-hand');
  foeHand.innerHTML = '';
  for (let i = 0; i < state.foe.hand.length; i++) {
    foeHand.appendChild(el('div', 'card back'));
  }
}

function renderHeroes(state) {
  document.getElementById('my-life').textContent = state.my.life;
  document.getElementById('foe-life').textContent = state.foe.life;
  document.getElementById('my-mana').textContent = 'Mana ' + manaPips(state.my);
  document.getElementById('foe-mana').textContent = 'Mana ' + manaPips(state.foe);
  const foeHero = document.getElementById('foe-hero');
  const myHero = document.getElementById('my-hero');
  const boltSelected = state.selected >= 0 &&
    CARD_BY_ID[state.my.hand[state.selected]] &&
    CARD_BY_ID[state.my.hand[state.selected]].effect === 'bolt';
  foeHero.classList.toggle('targetable', boltSelected && state.phase === 'play');
  myHero.classList.toggle('targetable', false);
  document.getElementById('turn-banner').textContent =
    state.phase === 'over'
      ? (state.winner === 'my' ? '🏆 VICTORY' : '💀 DEFEAT')
      : state.phase === 'ai'
        ? '🦉 The Owl Sage is thinking…'
        : state.phase === 'combat'
          ? '⚔️ Your minions strike!'
          : 'Turn ' + state.turn + ' — Your move';
  document.getElementById('end-turn').disabled = state.phase !== 'play';
}

function renderEndScreen(state) {
  const screen = document.getElementById('end-screen');
  if (state.phase !== 'over') { screen.classList.add('hidden'); return; }
  const win = state.winner === 'my';
  document.getElementById('end-emblem').textContent = win ? '🏆' : '🦉';
  const title = document.getElementById('end-title');
  title.textContent = win ? 'VICTORY' : 'DEFEAT';
  title.classList.toggle('lose', !win);
  document.getElementById('end-sub').textContent = win
    ? 'The Owl Sage bows to the Ember Fox.'
    : 'The Owl Sage keeps the court tonight.';
  document.getElementById('end-detail').textContent =
    'Final score — You ' + state.my.life + ' ❤ · Sage ' + state.foe.life + ' ❤ · ' +
    state.turnsPlayed + ' turns played. The lanterns dim… until the next duel.';
  screen.classList.remove('hidden');
}

function renderAll(state) {
  renderHeroes(state);
  renderBoard(state, 'foe');
  renderBoard(state, 'my');
  renderHands(state);
  renderEndScreen(state);
  const logEl = document.getElementById('log');
  if (logEl) logEl.textContent = state.log;
}

// Floating damage / heal number over a screen point.
function floatText(x, y, text, kind) {
  const host = document.getElementById('floaters');
  const n = el('div', 'floater' + (kind === 'heal' ? ' heal' : ''), text);
  n.style.left = x + 'px';
  n.style.top = y + 'px';
  host.appendChild(n);
  setTimeout(() => n.remove(), 1200);
}
