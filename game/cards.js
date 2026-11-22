// Ember Court — card catalogue, elements and decks.
// Four elements, one wheel: Ember beats Thorn, Thorn beats Tide, Tide beats Ember.
// Stone is neutral: it never gains or suffers the +2 element bonus.

const ELEMENTS = {
  ember: { name: 'Ember', icon: '🔥', art: '🔥', beats: 'thorn' },
  tide: { name: 'Tide', icon: '💧', art: '💧', beats: 'ember' },
  thorn: { name: 'Thorn', icon: '🌿', art: '🌿', beats: 'tide' },
  stone: { name: 'Stone', icon: '🗿', art: '🗿', beats: null },
};

// Every card: id, name, element, cost, kind, art, text.
// Minions carry attack/health; spells carry an effect id.
const CARD_DEFS = [
  { id: 'imp', name: 'Cinder Imp', el: 'ember', cost: 1, kind: 'minion', atk: 2, hp: 1, art: '😈', text: 'Quick and cruel.' },
  { id: 'whelp', name: 'Tide Whelp', el: 'tide', cost: 1, kind: 'minion', atk: 1, hp: 2, art: '🐉', text: 'Small splash, big bite.' },
  { id: 'sprout', name: 'Thorn Sprout', el: 'thorn', cost: 2, kind: 'minion', atk: 2, hp: 3, art: '🌱', text: 'Grows teeth fast.' },
  { id: 'golem', name: 'Stone Golem', el: 'stone', cost: 3, kind: 'minion', atk: 2, hp: 5, art: '🗿', text: 'Patient as a mountain.' },
  { id: 'knight', name: 'Ember Knight', el: 'ember', cost: 3, kind: 'minion', atk: 4, hp: 2, art: '⚔️', text: 'Charges in a blaze.' },
  { id: 'serpent', name: 'Tide Serpent', el: 'tide', cost: 4, kind: 'minion', atk: 4, hp: 4, art: '🐍', text: 'The river bites.' },
  { id: 'warden', name: 'Thorn Warden', el: 'thorn', cost: 4, kind: 'minion', atk: 3, hp: 6, art: '🌳', text: 'The grove defends itself.' },
  { id: 'colossus', name: 'Stone Colossus', el: 'stone', cost: 5, kind: 'minion', atk: 6, hp: 5, art: '🏔️', text: 'It walks. The ground agrees.' },
  { id: 'phoenix', name: 'Phoenix Herald', el: 'ember', cost: 5, kind: 'minion', atk: 5, hp: 4, art: '🦅', text: 'Born again in flame.' },
  { id: 'leviathan', name: 'Deep Leviathan', el: 'tide', cost: 6, kind: 'minion', atk: 7, hp: 6, art: '🐋', text: 'The deep keeps its own.' },
  { id: 'bolt', name: 'Ember Bolt', el: 'ember', cost: 2, kind: 'spell', effect: 'bolt', art: '☄️', text: 'Deal 4 to a minion or the hero.' },
  { id: 'mend', name: 'Mend Lantern', el: 'thorn', cost: 2, kind: 'spell', effect: 'mend', art: '💚', text: 'Restore 7 life to your hero.' },
  { id: 'surge', name: 'Lantern Surge', el: 'tide', cost: 1, kind: 'spell', effect: 'surge', art: '✨', text: 'Draw 2 cards.' },
  { id: 'quake', name: 'Quake', el: 'stone', cost: 3, kind: 'spell', effect: 'quake', art: '🌋', text: 'Deal 2 to all enemy minions.' },
];

const CARD_BY_ID = {};
for (const def of CARD_DEFS) CARD_BY_ID[def.id] = def;

// Element duel: +2 damage when the attacker's element beats the defender's.
function elementBonus(attackerEl, defenderEl) {
  return ELEMENTS[attackerEl].beats === defenderEl ? 2 : 0;
}

// Small deterministic RNG so demo/screenshot states are reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledDeck(rng) {
  const deck = [];
  for (const def of CARD_DEFS) { deck.push(def.id); deck.push(def.id); }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
  }
  return deck;
}

function makeMinion(defId, owner) {
  const def = CARD_BY_ID[defId];
  return {
    uid: owner + '-' + defId + '-' + Math.floor(Math.random() * 1e9),
    defId, owner, atk: def.atk, hp: def.hp, maxHp: def.hp,
    sick: true, justPlayed: true,
  };
}
