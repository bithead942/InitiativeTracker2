const conditions = [
  'Normal',
  'Blinded',
  'Charmed',
  'Dead',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious'
];

let state = {
  characters: [],
  activeIndex: 0,
  dm: true
};

const listEl = document.getElementById('list');
const dmCheck = document.getElementById('dmCheck');

function createCharacter() {
  return {
    id: Date.now() + Math.random(),
    name: 'NEW',
    init: 0,
    ac: '',
    hp: '',
    damage: '',
    condition1: 'Normal',
    condition2: 'Normal',
    locked: false
  };
}

function conditionOptions(selected) {
  return conditions.map(c => `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`).join('');
}

function render() {
  document.body.classList.toggle('player', !state.dm);
  dmCheck.checked = state.dm;

  listEl.innerHTML = '';
  state.characters.forEach((char, index) => {
    const isActive = index === state.activeIndex;
    const showCondition2 = char.condition1 !== 'Normal';
    const isDead = char.condition1 === 'Dead' || char.condition2 === 'Dead';
    const row = document.createElement('div');
    row.className = `row ${isActive ? 'active' : ''} ${isDead ? 'dead' : ''}`;
    row.dataset.index = index;

    row.innerHTML = `
      <div class="row-header">
        <span class="turn-num">${index + 1}</span>
        <div class="name-wrap">
          <input type="text" class="name" value="${escapeHtml(char.name)}" maxlength="15" ${state.dm ? '' : 'readonly'} data-field="name">
        </div>
        <div class="row-controls dm-only">
          <label class="control-label"><input type="checkbox" class="lock" ${char.locked ? 'checked' : ''} data-field="locked"> Lock</label>
          <button class="icon-btn up dm-only" title="Move Up" data-action="up" aria-label="Move Up">
            <img src="img/UpArrow.jpg" alt="Up" class="btn-img">
          </button>
          <button class="icon-btn down dm-only" title="Move Down" data-action="down" aria-label="Move Down">
            <img src="img/DownArrow.jpg" alt="Down" class="btn-img">
          </button>
          <button class="icon-btn delete dm-only" title="Delete" data-action="delete" aria-label="Delete">
            <img src="img/Delete.jpg" alt="Delete" class="btn-img">
          </button>
        </div>
      </div>
      <div class="stat-row">
        <label class="control-label">Init: <input type="number" class="init" min="1" max="99" value="${char.init}" data-field="init"></label>
        <label class="control-label dm-only">AC: <input type="number" class="ac" value="${char.ac}" data-field="ac"></label>
        <label class="control-label dm-only">HP: <input type="number" class="hp" value="${char.hp}" data-field="hp"></label>
        <div class="dmg-row dm-only">
          <input type="number" class="damage" value="${char.damage}" data-field="damage">
          <button class="dmg-btn dm-only" data-action="damage" title="Subtract">-</button>
        </div>
      </div>
      <div class="condition-row">
        <label class="control-label condition-label">Condition:</label>
        <select class="condition1" data-field="condition1">${conditionOptions(char.condition1)}</select>
        ${showCondition2 ? `<select class="condition2" data-field="condition2">${conditionOptions(char.condition2)}</select>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  });

  scrollToActive();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;');
}

function scrollToActive() {
  if (state.activeIndex < 0 || state.activeIndex >= state.characters.length) return;
  const activeRow = listEl.children[state.activeIndex];
  if (activeRow) {
    activeRow.scrollIntoView({ block: 'center' });
  }
}

function updateFromInput(index, field, value) {
  const char = state.characters[index];
  if (field === 'name') {
    char.name = value.toUpperCase().slice(0, 15);
  } else if (['init', 'ac', 'hp'].includes(field)) {
    const num = parseInt(value, 10);
    char[field] = isNaN(num) ? '' : num;
    if (field === 'init') {
      if (char.init > 99) char.init = 99;
      if (char.init < 0) char.init = 0;
    } else if (field === 'hp' && char.hp === 0) {
      char.condition1 = 'Dead';
      char.condition2 = 'Normal';
    }
  } else if (field === 'damage') {
    const num = parseInt(value, 10);
    char.damage = isNaN(num) ? '' : num;
  } else if (field === 'condition1') {
    char.condition1 = value;
    if (char.condition1 === 'Normal') {
      char.condition2 = 'Normal';
    }
  } else if (field === 'condition2') {
    char.condition2 = value;
  } else if (field === 'locked') {
    char.locked = value;
  }
  render();
  // restore focus if possible
  const row = listEl.querySelector(`.row[data-index="${index}"]`);
  if (row) {
    const el = row.querySelector(`[data-field="${field}"]`);
    if (el) {
      el.focus();
      if (el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length);
    }
  }
}

function addCharacter() {
  state.characters.push(createCharacter());
  state.activeIndex = Math.min(state.activeIndex, state.characters.length - 1);
  render();
}

function deleteCharacter(index) {
  state.characters.splice(index, 1);
  if (state.activeIndex >= state.characters.length) state.activeIndex = Math.max(0, state.characters.length - 1);
  render();
}

function moveCharacter(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= state.characters.length) return;
  [state.characters[index], state.characters[newIndex]] = [state.characters[newIndex], state.characters[index]];
  if (state.activeIndex === index) state.activeIndex = newIndex;
  else if (state.activeIndex === newIndex) state.activeIndex = index;
  render();
}

function sortInitiative() {
  state.characters.sort((a, b) => b.init - a.init);
  state.activeIndex = 0;
  render();
}

function clearUnlocked() {
  state.characters = state.characters.filter(c => c.locked);
  state.activeIndex = 0;
  render();
}

function isDead(char) {
  return char.condition1 === 'Dead' || char.condition2 === 'Dead';
}

function getNextAliveIndex(direction) {
  const n = state.characters.length;
  if (n === 0) return -1;
  if (state.characters.every(isDead)) return -1;
  let i = state.activeIndex;
  do {
    i = (i + direction + n) % n;
    if (!isDead(state.characters[i])) return i;
  } while (i !== state.activeIndex);
  return -1;
}

function nextInit() {
  const next = getNextAliveIndex(1);
  if (next !== -1) state.activeIndex = next;
  render();
}

function prevInit() {
  const prev = getNextAliveIndex(-1);
  if (prev !== -1) state.activeIndex = prev;
  render();
}

function applyDamage(index) {
  const char = state.characters[index];
  const damage = parseInt(char.damage, 10);
  if (isNaN(damage) || damage === 0) return;
  const hp = parseInt(char.hp, 10) || 0;
  let newHp = hp - damage;
  if (newHp < 0) newHp = 0;
  char.hp = newHp;
  char.damage = '';
  if (newHp === 0) {
    char.condition1 = 'Dead';
    char.condition2 = 'Normal';
  }
  render();
}

function saveState() {
  try {
    window.api.saveDataSync(state);
  } catch {
    // renderer may not be ready or main unavailable
  }
}

function loadState(data) {
  if (data && data.characters) {
    state = { ...state, ...data };
  }
  render();
}

// Event delegation
listEl.addEventListener('input', (e) => {
  const target = e.target;
  if (!target.dataset.field) return;
  const row = target.closest('.row');
  if (!row) return;
  const index = parseInt(row.dataset.index, 10);
  const value = target.type === 'checkbox' ? target.checked : target.value;
  updateFromInput(index, target.dataset.field, value);
});

listEl.addEventListener('change', (e) => {
  const target = e.target;
  if (target.tagName === 'SELECT' && target.dataset.field) {
    const row = target.closest('.row');
    if (!row) return;
    const index = parseInt(row.dataset.index, 10);
    updateFromInput(index, target.dataset.field, target.value);
  }
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const row = btn.closest('.row');
  if (!row) return;
  const index = parseInt(row.dataset.index, 10);
  const action = btn.dataset.action;
  if (action === 'delete') deleteCharacter(index);
  else if (action === 'up') moveCharacter(index, -1);
  else if (action === 'down') moveCharacter(index, 1);
  else if (action === 'damage') applyDamage(index);
});

document.getElementById('addBtn').addEventListener('click', addCharacter);
document.getElementById('prevBtn').addEventListener('click', prevInit);
document.getElementById('nextBtn').addEventListener('click', nextInit);
document.getElementById('sortBtn').addEventListener('click', sortInitiative);
document.getElementById('clearBtn').addEventListener('click', clearUnlocked);
dmCheck.addEventListener('change', (e) => {
  state.dm = e.target.checked;
  render();
});

window.addEventListener('beforeunload', () => {
  saveState();
});

(async function init() {
  const saved = await window.api.loadData();
  loadState(saved);
})();
