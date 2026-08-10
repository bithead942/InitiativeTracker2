let state = {
  characters: [],
  activeIndex: 0
};

const listEl = document.getElementById('list');

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

function conditionText(char) {
  const parts = [char.condition1];
  if (char.condition2 && char.condition2 !== 'Normal') {
    parts.push(char.condition2);
  }
  return parts.join(', ');
}

function render() {
  listEl.innerHTML = '';
  state.characters.forEach((char, index) => {
    const isActive = index === state.activeIndex;
    const dead = isDead(char);
    const row = document.createElement('div');
    row.className = `row ${isActive ? 'active' : ''} ${dead ? 'dead' : ''}`;

    row.innerHTML = `
      <div class="row-header">
        <span class="turn-num">${index + 1}</span>
        <span class="name-label">${escapeHtml(char.name)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Init: <span class="stat-value">${char.init}</span></span>
        <span class="stat-label condition-label">Condition: <span class="condition-value">${conditionText(char)}</span></span>
        ${!char.locked ? `<span class="stat-label size-label">Size: <span class="stat-value">${char.size || ''}</span></span>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  });

  scrollToActive();
}

async function loadState() {
  const saved = await window.api.loadData();
  if (saved) {
    state.characters = saved.characters || [];
    state.activeIndex = typeof saved.activeIndex === 'number' ? saved.activeIndex : 0;
  }
  render();
}

(function init() {
  loadState();

  window.api.onDataChange(() => {
    loadState();
  });
})();
