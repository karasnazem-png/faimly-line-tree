const dialog = document.querySelector('#person-dialog');
const form = document.querySelector('#person-form');
const canvas = document.querySelector('#tree-canvas');
const zoomValue = document.querySelector('#zoom-value');
let zoom = 1;
let selectedCard = document.querySelector('.person-card.selected');
let audioContext;
let musicNodes;
const totalPeople = 500;
document.querySelector('#music-toggle').title = 'Play relaxing ambient music';
document.querySelector('#music-toggle span').textContent = 'Relaxing';

function selectCard(card) {
  document.querySelector('.person-card.selected')?.classList.remove('selected');
  card.classList.add('selected');
  selectedCard = card;
  document.querySelector('#detail-name').textContent = card.dataset.person;
  document.querySelector('#detail-relation').textContent = card.querySelector('em').textContent + ' · ' + card.querySelector('span').textContent;
  document.querySelector('.detail-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.person-card:not(.add-card)').forEach((card) => {
  card.addEventListener('click', () => selectCard(card));
});

const familyNames = ['Morgan', 'Hayes', 'Bennett', 'Ellis', 'Reed', 'Parker', 'Carter', 'Wells'];
const givenNames = ['Avery', 'Riley', 'Jordan', 'Quinn', 'Taylor', 'Casey', 'Robin', 'Jamie', 'Skyler', 'Drew'];
const relationships = ['Cousin', 'Aunt', 'Uncle', 'Relative', 'Child'];
for (let index = 7; index < totalPeople; index += 1) {
  const card = document.createElement('article');
  const name = `${givenNames[index % givenNames.length]} ${familyNames[index % familyNames.length]} ${Math.floor(index / givenNames.length) + 1}`;
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  card.className = `person-card generated-card avatar-set-${index % 6}`;
  card.dataset.person = name;
  card.style.left = `${24 + (index % 10) * 220}px`;
  card.style.top = `${760 + Math.floor((index - 7) / 10) * 125}px`;
  card.innerHTML = `<div class="avatar">${initials}</div><div class="person-copy"><strong>${name}</strong><span>${1950 + index % 66}</span><em>${relationships[index % relationships.length]}</em></div><button class="card-menu">•••</button>`;
  canvas.append(card);
  card.addEventListener('click', () => selectCard(card));
}
document.querySelector('.storage small').textContent = `${totalPeople} of ${totalPeople} people added`;
document.querySelector('.storage-label span:last-child').textContent = '100%';
document.querySelector('.storage-track span').style.width = '100%';
canvas.style.height = `${760 + Math.ceil((totalPeople - 7) / 10) * 125}px`;

function openDialog() { dialog.showModal(); document.querySelector('#name-input').focus(); }
document.querySelector('#add-person').addEventListener('click', openDialog);
document.querySelector('#add-card').addEventListener('click', openDialog);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.querySelector('#name-input').value.trim();
  const relation = document.querySelector('#relation-input').value;
  const birthDate = document.querySelector('#birth-input').value;
  if (!name) return;
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const birthYear = new Date(`${birthDate}T00:00:00`).getFullYear();
  const card = document.createElement('article');
  card.className = 'person-card selected';
  card.dataset.person = name;
  card.style.left = '37%';
  card.style.top = '440px';
  card.innerHTML = `<div class="avatar avatar-gold">${initials}</div><div class="person-copy"><strong>${name}</strong><span>${birthYear}</span><em>${relation}</em></div><button class="card-menu">•••</button>`;
  document.querySelector('.person-card.selected')?.classList.remove('selected');
  canvas.append(card);
  selectedCard = card;
  card.addEventListener('click', () => { document.querySelector('.person-card.selected')?.classList.remove('selected'); card.classList.add('selected'); selectedCard = card; });
  dialog.close(); form.reset();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#zoom-in').addEventListener('click', () => setZoom(zoom + .1));
document.querySelector('#zoom-out').addEventListener('click', () => setZoom(zoom - .1));
document.querySelector('#reset-view').addEventListener('click', () => setZoom(1));
document.querySelector('#share-tree').addEventListener('click', async (event) => {
  await navigator.clipboard?.writeText(window.location.href);
  const label = event.currentTarget.querySelector('span');
  label.textContent = 'Link copied';
  setTimeout(() => { label.textContent = 'Share'; }, 1800);
});
function deleteSelectedPerson() {
  if (!selectedCard || selectedCard.classList.contains('add-card')) return;
  if (window.prompt('Owner code required to delete this person:') !== '6767') {
    window.alert('That owner code is not correct.');
    return;
  }
  if (!window.confirm(`Delete ${selectedCard.dataset.person} from this tree?`)) return;
  selectedCard.remove();
  selectedCard = null;
  document.querySelector('#detail-name').textContent = 'No person selected';
  document.querySelector('#detail-relation').textContent = 'Choose someone from the tree';
}
document.querySelector('#delete-person').addEventListener('click', deleteSelectedPerson);
document.querySelector('#delete-person-panel').addEventListener('click', deleteSelectedPerson);
function startMusic(event) {
  if (musicNodes) {
    musicNodes.oscillators.forEach((node) => node.stop());
    clearInterval(musicNodes.melodyTimer);
    musicNodes = null;
    event.currentTarget.classList.remove('playing');
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    window.alert('Music is not supported in this browser. Try Chrome, Edge, or Safari.');
    return;
  }
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();
  const masterGain = audioContext.createGain();
  masterGain.gain.value = .12;
  masterGain.connect(audioContext.destination);
  const padNotes = [130.81, 196, 261.63];
  const oscillators = padNotes.map((frequency) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .025;
    oscillator.connect(gain).connect(masterGain); oscillator.start(); return oscillator;
  });
  const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440];
  let melodyIndex = 0;
  const playNote = () => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'triangle';
    oscillator.frequency.value = melody[melodyIndex % melody.length];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.04, now + .18);
    gain.gain.exponentialRampToValueAtTime(.001, now + 2.2);
    oscillator.connect(gain).connect(masterGain);
    oscillator.start(now);
    oscillator.stop(now + 2.3);
    melodyIndex += 1;
  };
  playNote();
  const melodyTimer = setInterval(playNote, 2600);
  musicNodes = { oscillators, melodyTimer };
  event.currentTarget.classList.add('playing');
}
document.querySelector('#music-toggle').addEventListener('click', (event) => {
  if (musicNodes) { startMusic(event); return; }
  startMusic(event);
});
window.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('#music-toggle') && !musicNodes) startMusic({ currentTarget: document.querySelector('#music-toggle') });
}, { once: true });
function setZoom(value) { zoom = Math.min(1.3, Math.max(.8, value)); canvas.style.transform = `scale(${zoom})`; zoomValue.textContent = `${Math.round(zoom * 100)}%`; }
