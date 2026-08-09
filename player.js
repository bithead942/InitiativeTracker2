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
  activeIndex: 0
};

const listEl = document.getElementById('list');

function conditionOptions(selected) {
  return conditions.map(c => `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`).join('');
}

function isDead(char) {
  return char.condition1 === 'Dead' || char.condition2 === 'Dead';
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

function render() {
  listEl.innerHTML = '';
  state.characters.forEach((char, index) => {
    const isActive = index === state.activeIndex;
    const showCondition2 = char.condition1 !== 'Normal';
    const dead = isDead(char);
    const row = document.createElement('div');
    row.className = `row ${isActive ? 'active' : ''} ${dead ? 'dead' : ''}`;
    row.dataset.index = index;

    row.innerHTML = `
      <div class="row-header">
        <span class="turn-num">${index + 1}</span>
        <div class="name-wrap">
          <input type="text" class="name" value="${escapeHtml(char.name)}" readonly data-field="name">
        </div>
      </div>
      <div class="stat-row">
        <label class="control-label">Init: <input type="number" class="init" value="${char.init}" readonly data-field="init"></label>
      </div>
      <div class="condition-row">
        <label class="control-label condition-label">Condition:</label>
        <select class="condition1" data-field="condition1" disabled>${conditionOptions(char.condition1)}</select>
        ${showCondition2 ? `<select class="condition2" data-field="condition2" disabled>${conditionOptions(char.condition2)}</select>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  });

  scrollToActive();
}

(async function init() {
  const saved = await window.api.loadData();
  if (saved) {
    state.characters = saved.characters || [];
    state.activeIndex = typeof saved.activeIndex === 'number' ? saved.activeIndex : 0;
  }
  render();
})();
