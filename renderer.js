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

const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

let isDM = true;

let state = {
  characters: [],
  activeIndex: 0
};

const listEl = document.getElementById('list');

function createCharacter() {
  return {
    id: Date.now() + Math.random(),
    name: 'NEW',
    size: 'Medium',
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

function sizeOptions(selected) {
  return sizes.map(s => `<option value="${s}"${s === selected ? ' selected' : ''}>${s}</option>`).join('');
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

function render() {
  listEl.innerHTML = '';
  state.characters.forEach((char, index) => {
    const isActive = index === state.activeIndex;
    const showCondition2 = char.condition1 !== 'Normal';
    const dead = isDead(char);
    const row = document.createElement('div');
    row.className = `row ${isActive ? 'active' : ''} ${dead ? 'dead' : ''}`;
    row.draggable = true;
    row.title = 'Drag to reorder';
    row.dataset.index = index;

    row.innerHTML = `
      <div class="row-header">
        <span class="turn-num">${index + 1}</span>
        <div class="name-wrap">
          <input type="text" class="name" value="${escapeHtml(char.name)}" maxlength="15" ${isDM ? '' : 'readonly'} data-field="name">
        </div>
        <div class="row-controls dm-only">
          <label class="control-label"><input type="checkbox" class="lock" ${char.locked ? 'checked' : ''} data-field="locked"> Lock</label>
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
        <select class="condition1" data-field="condition1" ${isDM ? '' : 'disabled'}>${conditionOptions(char.condition1)}</select>
        ${showCondition2 ? `<select class="condition2" data-field="condition2" ${isDM ? '' : 'disabled'}>${conditionOptions(char.condition2)}</select>` : ''}
      </div>
      <div class="size-row">
        <label class="control-label">Size: <select class="size" data-field="size" ${isDM ? '' : 'disabled'}>${sizeOptions(char.size)}</select></label>
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

function saveState() {
  try {
    window.api.saveData({ characters: state.characters, activeIndex: state.activeIndex });
  } catch {
    // main may not be ready
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
  } else if (field === 'size') {
    char.size = value;
  } else if (field === 'locked') {
    char.locked = value;
  }
  render();
  saveState();
}

function addCharacter() {
  state.characters.push(createCharacter());
  state.activeIndex = Math.min(state.activeIndex, state.characters.length - 1);
  render();
  saveState();
}

function deleteCharacter(index) {
  state.characters.splice(index, 1);
  if (state.activeIndex >= state.characters.length) state.activeIndex = Math.max(0, state.characters.length - 1);
  render();
  saveState();
}

function sortInitiative() {
  state.characters.sort((a, b) => b.init - a.init);
  state.activeIndex = 0;
  render();
  saveState();
}

function clearUnlocked() {
  state.characters = state.characters.filter(c => c.locked);
  state.activeIndex = 0;
  render();
  saveState();
}

function nextInit() {
  const next = getNextAliveIndex(1);
  if (next !== -1) state.activeIndex = next;
  render();
  saveState();
}

function prevInit() {
  const prev = getNextAliveIndex(-1);
  if (prev !== -1) state.activeIndex = prev;
  render();
  saveState();
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
  saveState();
}

function loadState(data) {
  if (data) {
    if (data.characters) state.characters = data.characters;
    if (typeof data.activeIndex === 'number') state.activeIndex = data.activeIndex;
  }
  render();
}

// Event delegation for inputs and selects
listEl.addEventListener('change', (e) => {
  const target = e.target;
  if (!target.dataset.field) return;
  const row = target.closest('.row');
  if (!row) return;
  const index = parseInt(row.dataset.index, 10);
  const value = target.type === 'checkbox' ? target.checked : target.value;
  updateFromInput(index, target.dataset.field, value);
});

// For name: enforce uppercase live as the user types (do not save on every keystroke)
listEl.addEventListener('input', (e) => {
  const target = e.target;
  if (target.dataset.field === 'name' && target.value) {
    target.value = target.value.toUpperCase().slice(0, 15);
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
  else if (action === 'damage') applyDamage(index);
});

listEl.addEventListener('dragstart', (e) => {
  const row = e.target.closest('.row');
  if (!row) return;
  e.dataTransfer.setData('text/plain', row.dataset.index);
  e.dataTransfer.effectAllowed = 'move';
  row.classList.add('dragging');
});

listEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});

listEl.addEventListener('drop', (e) => {
  e.preventDefault();
  const targetRow = e.target.closest('.row');
  if (!targetRow) return;
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
  const toIndex = parseInt(targetRow.dataset.index, 10);
  if (isNaN(fromIndex) || isNaN(toIndex) || fromIndex === toIndex) return;
  const activeId = state.characters[state.activeIndex]?.id;
  const [char] = state.characters.splice(fromIndex, 1);
  state.characters.splice(toIndex, 0, char);
  state.activeIndex = activeId ? state.characters.findIndex(c => c.id === activeId) : 0;
  render();
  saveState();
});

listEl.addEventListener('dragend', (e) => {
  const row = e.target.closest('.row');
  if (row) row.classList.remove('dragging');
});

document.getElementById('addBtn').addEventListener('click', addCharacter);
document.getElementById('prevBtn').addEventListener('click', prevInit);
document.getElementById('nextBtn').addEventListener('click', nextInit);
document.getElementById('sortBtn').addEventListener('click', sortInitiative);
document.getElementById('clearBtn').addEventListener('click', clearUnlocked);

window.addEventListener('beforeunload', () => {
  saveState();
});

(async function init() {
  const saved = await window.api.loadData();
  loadState(saved);
})();
