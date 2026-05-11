const DB_KEY = 'myhub-data';
let data = JSON.parse(localStorage.getItem(DB_KEY)) || {
  events: [], ideas: [], todos: []
};
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(data));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

document.querySelectorAll('nav button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

const modal = document.getElementById('itemModal');
let currentType = null, editingId = null;

function openModal(type, item = null) {
  currentType = type;
  editingId = item?.id || null;
  document.getElementById('modalTitle').textContent = item ? 'Edit' : 'New ' + type;
  document.getElementById('itemTitle').value = item?.title || '';
  document.getElementById('itemBody').value = item?.body || '';
  document.getElementById('itemDate').value = item?.date || '';
  document.getElementById('itemTags').value = (item?.tags || []).join(', ');
  document.getElementById('itemColor').value = item?.color || '#4f46e5';
  modal.showModal();
}

document.getElementById('itemForm').onsubmit = (e) => {
  if (e.submitter?.value !== 'save') return;
  const newItem = {
    id: editingId || uid(),
    title: document.getElementById('itemTitle').value,
    body: document.getElementById('itemBody').value,
    date: document.getElementById('itemDate').value,
    tags: document.getElementById('itemTags').value.split(',').map(t => t.trim()).filter(Boolean),
    color: document.getElementById('itemColor').value,
    done: false
  };
  const list = currentType === 'event' ? data.events : data.ideas;
  if (editingId) {
    const idx = list.findIndex(x => x.id === editingId);
    list[idx] = { ...list[idx], ...newItem };
  } else {
    list.push(newItem);
  }
  save();
  render();
};

function card(item, type) {
  const el = document.createElement('div');
  el.className = 'card';
  el.style.borderLeftColor = item.color;
  el.innerHTML = `
    <h4>${item.title}</h4>
    ${item.body ? `<p>${item.body}</p>` : ''}
    ${item.date ? `<p>🕐 ${new Date(item.date).toLocaleString()}</p>` : ''}
    <div class="tags">${item.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
  `;
  el.onclick = () => openModal(type, item);
  el.oncontextmenu = (e) => {
    e.preventDefault();
    if (confirm('Delete this item?')) {
      const list = type === 'event' ? data.events : data.ideas;
      const idx = list.findIndex(x => x.id === item.id);
      list.splice(idx, 1); save(); render();
    }
  };
  return el;
}

function render() {
  const eventsList = document.getElementById('eventsList');
  const filterDate = document.getElementById('schedDate').value;
  eventsList.innerHTML = '';
  const events = [...data.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  events
    .filter(e => !filterDate || (e.date || '').startsWith(filterDate))
    .forEach(e => eventsList.appendChild(card(e, 'event')));

  const ideasList = document.getElementById('ideasList');
  const q = document.getElementById('searchIdeas').value.toLowerCase();
  ideasList.innerHTML = '';
  data.ideas
    .filter(i => !q || (i.title + i.body + i.tags.join(' ')).toLowerCase().includes(q))
    .forEach(i => ideasList.appendChild(card(i, 'idea')));

  const todosList = document.getElementById('todosList');
  todosList.innerHTML = '';
  data.todos.forEach(t => {
    const row = document.createElement('div');
    row.className = 'card todo-item' + (t.done ? ' done' : '');
    row.innerHTML = `
      <input type="checkbox" ${t.done ? 'checked' : ''} />
      <span>${t.title}</span>
    `;
    row.querySelector('input').onchange = () => { t.done = !t.done; save(); render(); };
    row.oncontextmenu = (e) => {
      e.preventDefault();
      data.todos = data.todos.filter(x => x.id !== t.id); save(); render();
    };
    todosList.appendChild(row);
  });
}

document.getElementById('addEvent').onclick = () => openModal('event');
document.getElementById('addIdea').onclick = () => openModal('idea');
document.getElementById('schedDate').onchange = render;
document.getElementById('searchIdeas').oninput = render;

document.getElementById('addTodo').onclick = () => {
  const input = document.getElementById('newTodo');
  if (!input.value.trim()) return;
  data.todos.push({ id: uid(), title: input.value, done: false });
  input.value = ''; save(); render();
};
document.getElementById('newTodo').onkeydown = (e) => {
  if (e.key === 'Enter') document.getElementById('addTodo').click();
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

render();