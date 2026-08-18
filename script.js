const dialog = document.querySelector('#person-dialog');
const form = document.querySelector('#person-form');
const canvas = document.querySelector('#tree-canvas');
const zoomValue = document.querySelector('#zoom-value');
let zoom = .75;
let selectedCard = null;
let audioContext;
let musicNodes;
const totalPeople = 1;
const archivedPeople = JSON.parse(localStorage.getItem('kinship-archive') || '[]');
const treeStage = document.querySelector('.tree-stage');
let dragState = null;
let didPan = false;
document.querySelectorAll('.person-card:not(.add-card)').forEach((card) => card.remove());
const meCard = document.createElement('article');
meCard.className = 'person-card selected root-person';
meCard.dataset.person = 'Me';
meCard.style.left = '1151px';
meCard.style.top = '220px';
meCard.innerHTML = '<div class="avatar">ME</div><div class="person-copy"><strong>Me</strong><span>2000</span><em>You</em></div><button class="card-menu">•••</button>';
canvas.append(meCard);
selectedCard = meCard;
document.querySelector('#music-toggle').title = 'Play 10-track relaxing ambient music';
document.querySelector('#music-toggle span').textContent = 'Relaxing';

function selectCard(card) {
  document.querySelector('.person-card.selected')?.classList.remove('selected');
  card.classList.add('selected');
  selectedCard = card;
  document.querySelector('#detail-name').textContent = card.dataset.person;
  document.querySelector('#detail-relation').textContent = card.querySelector('em').textContent + ' · ' + card.querySelector('span').textContent;
  document.querySelector('.detail-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

const contextMenu = document.querySelector('#person-context-menu');
let contextCard;
function bindPersonCard(card) {
  card.addEventListener('click', () => { if (!didPan) selectCard(card); });
  card.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (card.classList.contains('add-card')) return;
    selectCard(card);
    contextCard = card;
    contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 235)}px`;
    contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 165)}px`;
    contextMenu.classList.add('open');
  });
}

document.querySelectorAll('.person-card:not(.add-card)').forEach((card) => {
  bindPersonCard(card);
});
selectCard(meCard);

const familyNames = ['Morgan', 'Hayes', 'Bennett', 'Ellis', 'Reed', 'Parker', 'Carter', 'Wells'];
const givenNames = ['Avery', 'Riley', 'Jordan', 'Quinn', 'Taylor', 'Casey', 'Robin', 'Jamie', 'Skyler', 'Drew'];
const relationships = ['Cousin', 'Aunt', 'Uncle', 'Relative', 'Child'];
for (let index = 7; index < totalPeople; index += 1) {
  const card = document.createElement('article');
  const name = `${givenNames[index % givenNames.length]} ${familyNames[index % familyNames.length]} ${Math.floor(index / givenNames.length) + 1}`;
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  card.className = `person-card generated-card avatar-set-${index % 6}`;
  card.dataset.person = name;
  const branchColumn = index % 18;
  const branchRow = Math.floor((index - 7) / 18);
  const branchSpread = Math.min(9, branchRow + 2);
  const branchOffset = branchColumn - 9;
  card.style.left = `${1225 + branchOffset * 170 + (Math.abs(branchOffset) > branchSpread ? Math.sign(branchOffset) * 260 : 0)}px`;
  card.style.top = `${760 + branchRow * 135}px`;
  card.innerHTML = `<div class="avatar">${initials}</div><div class="person-copy"><strong>${name}</strong><span>${1950 + index % 66}</span><em>${relationships[index % relationships.length]}</em></div><button class="card-menu">•••</button>`;
  canvas.append(card);
  bindPersonCard(card);
}
document.querySelector('.storage small').textContent = `${totalPeople} of ${totalPeople} people added`;
document.querySelector('.storage-label span:last-child').textContent = '100%';
document.querySelector('.storage-track span').style.width = '100%';
canvas.style.height = `${760 + Math.ceil((totalPeople - 7) / 18) * 135}px`;
treeStage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  dragState = { x: event.clientX, y: event.clientY, left: treeStage.scrollLeft, top: treeStage.scrollTop };
  didPan = false;
  treeStage.classList.add('is-panning');
  treeStage.setPointerCapture(event.pointerId);
});
treeStage.addEventListener('pointermove', (event) => {
  if (!dragState) return;
  const distance = Math.abs(event.clientX - dragState.x) + Math.abs(event.clientY - dragState.y);
  if (distance > 6) didPan = true;
  treeStage.scrollLeft = dragState.left - (event.clientX - dragState.x);
  treeStage.scrollTop = dragState.top - (event.clientY - dragState.y);
});
function stopPanning(event) {
  if (!dragState) return;
  dragState = null;
  treeStage.classList.remove('is-panning');
  if (event?.pointerId !== undefined && treeStage.hasPointerCapture(event.pointerId)) treeStage.releasePointerCapture(event.pointerId);
  setTimeout(() => { didPan = false; }, 0);
}
treeStage.addEventListener('pointerup', stopPanning);
treeStage.addEventListener('pointercancel', stopPanning);

function renderArchive() {
  const list = document.querySelector('#leaderboard-list');
  document.querySelector('#archive-count').textContent = archivedPeople.length;
  list.innerHTML = archivedPeople.length ? archivedPeople.map((person, index) => `<li><span class="archive-rank">${index + 1}</span><span class="archive-avatar">${person.initials}</span><span><strong>${person.name}</strong><small>${person.relation}</small></span></li>`).join('') : '<li class="leaderboard-empty">No archived members yet</li>';
}
renderArchive();

function openDialog() { dialog.showModal(); document.querySelector('#name-input').focus(); }
document.querySelector('#add-person').addEventListener('click', openDialog);
document.querySelector('#add-card').addEventListener('click', openDialog);
function updatePreview() {
  const name = document.querySelector('#name-input').value.trim() || 'New family member';
  const initials = name === 'New family member' ? '?' : name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  document.querySelector('#preview-avatar').textContent = initials;
  document.querySelector('#preview-name').textContent = name;
  document.querySelector('#preview-relation').textContent = document.querySelector('#relation-input').value;
}
document.querySelector('#name-input').addEventListener('input', updatePreview);
document.querySelector('#relation-input').addEventListener('change', updatePreview);
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
  card.addEventListener('click', () => { if (!didPan) selectCard(card); });
  dialog.close(); form.reset();
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#zoom-in').addEventListener('click', () => setZoom(zoom + .1));
document.querySelector('#zoom-out').addEventListener('click', () => setZoom(zoom - .1));
document.querySelector('#reset-view').addEventListener('click', () => setZoom(.75));
document.querySelector('#share-tree').addEventListener('click', async (event) => {
  await navigator.clipboard?.writeText(window.location.href);
  const label = event.currentTarget.querySelector('span');
  label.textContent = 'Link copied';
  setTimeout(() => { label.textContent = 'Share'; }, 1800);
});
function deleteSelectedPerson() {
  if (!selectedCard || selectedCard.classList.contains('add-card')) return;
  archivedPeople.unshift({
    name: selectedCard.dataset.person,
    initials: selectedCard.querySelector('.avatar').textContent,
    relation: selectedCard.querySelector('em').textContent
  });
  localStorage.setItem('kinship-archive', JSON.stringify(archivedPeople));
  renderArchive();
  selectedCard.remove();
  selectedCard = null;
  document.querySelector('#detail-name').textContent = 'No person selected';
  document.querySelector('#detail-relation').textContent = 'Choose someone from the tree';
}
document.querySelector('#delete-person').addEventListener('click', deleteSelectedPerson);
document.querySelector('#delete-person-panel').addEventListener('click', deleteSelectedPerson);
document.addEventListener('click', (event) => {
  if (!event.target.closest('#person-context-menu')) contextMenu.classList.remove('open');
});
contextMenu.addEventListener('click', (event) => {
  const action = event.target.closest('button')?.dataset.action;
  if (!action || !contextCard) return;
  if (action === 'profile') selectCard(contextCard);
  if (action === 'help') {
    helpPanel.classList.add('open');
    helpAnswer.textContent = `I can help you learn about ${contextCard.dataset.person}. Their card shows their name, year, and family relationship.`;
  }
  if (action === 'archive') deleteSelectedPerson();
  contextMenu.classList.remove('open');
});
const helpPanel = document.querySelector('#help-panel');
const helpInput = document.querySelector('#help-input');
const helpAnswer = document.querySelector('#help-answer');
const helpAnswers = [
  { matches: ['add', 'person', 'someone'], answer: 'Choose Add person in the top bar or the large card in the tree, then enter a name, relationship, and birth date.' },
  { matches: ['delet', 'archive', 'leader'], answer: 'Deleted members are remembered in the Family Archive at the bottom of the left sidebar. They stay there after removal.' },
  { matches: ['music', 'relax', 'sound'], answer: 'Press Relaxing in the top bar to start or stop the gentle ambient music.' },
  { matches: ['photo', 'picture', 'image', 'see'], answer: 'The family photo is used as the warm background behind the tree. The 500 family members stay as readable name cards on top, so the people are easy to find.' },
  { matches: ['find', 'search', 'relative'], answer: 'Use the tree scroll area to browse all 500 people, then select a name card to see its details.' }
];
function answerHelp(question) {
  const normalized = question.toLowerCase();
  const result = helpAnswers.find((item) => item.matches.some((word) => normalized.includes(word)));
  helpAnswer.textContent = result?.answer || 'I can help with adding people, deleted members, music, and finding relatives in your tree.';
}
document.querySelector('#help-toggle').addEventListener('click', () => { helpPanel.classList.toggle('open'); if (helpPanel.classList.contains('open')) helpInput.focus(); });
document.querySelector('#help-close').addEventListener('click', () => helpPanel.classList.remove('open'));
document.querySelectorAll('.help-suggestions button').forEach((button) => button.addEventListener('click', () => answerHelp(button.dataset.question)));
document.querySelector('#help-form').addEventListener('submit', (event) => { event.preventDefault(); answerHelp(helpInput.value); helpInput.select(); });
const musicTracks = [
  { pad: [130.81, 196, 261.63], melody: [523.25, 587.33, 659.25, 783.99] },
  { pad: [146.83, 220, 293.66], melody: [587.33, 659.25, 739.99, 880] },
  { pad: [164.81, 246.94, 329.63], melody: [659.25, 739.99, 830.61, 987.77] },
  { pad: [174.61, 261.63, 349.23], melody: [698.46, 783.99, 880, 1046.5] },
  { pad: [196, 293.66, 392], melody: [783.99, 880, 987.77, 1174.66] },
  { pad: [220, 329.63, 440], melody: [880, 987.77, 1108.73, 1318.51] },
  { pad: [246.94, 369.99, 493.88], melody: [987.77, 1108.73, 1244.51, 1479.98] },
  { pad: [261.63, 392, 523.25], melody: [1046.5, 1174.66, 1318.51, 1567.98] },
  { pad: [293.66, 440, 587.33], melody: [1174.66, 1318.51, 1479.98, 1760] },
  { pad: [329.63, 493.88, 659.25], melody: [1318.51, 1479.98, 1661.22, 1975.53] }
];
let musicTrackIndex = 0;
let musicRotationTimer;
function stopMusic() {
  if (!musicNodes) return;
  musicNodes.oscillators.forEach((node) => { try { node.stop(); } catch {} });
  clearInterval(musicNodes.melodyTimer);
  clearTimeout(musicRotationTimer);
  musicNodes = null;
  document.querySelector('#music-toggle').classList.remove('playing');
  document.querySelector('#music-stop').classList.remove('active');
}
function startMusic(event) {
  if (musicNodes) { stopMusic(); return; }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume();
  const masterGain = audioContext.createGain();
  masterGain.gain.value = .12;
  masterGain.connect(audioContext.destination);
  const track = musicTracks[musicTrackIndex];
  musicTrackIndex = (musicTrackIndex + 1) % musicTracks.length;
  const padNotes = track.pad;
  const oscillators = padNotes.map((frequency) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .025;
    oscillator.connect(gain).connect(masterGain); oscillator.start(); return oscillator;
  });
  const melody = track.melody;
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
  musicRotationTimer = setTimeout(() => { stopMusic(); startMusic({ currentTarget: document.querySelector('#music-toggle') }); }, 120000);
  event.currentTarget.classList.add('playing');
  document.querySelector('#music-stop').classList.add('active');
}
document.querySelector('#music-toggle').addEventListener('click', (event) => {
  startMusic(event);
});
document.querySelector('#music-stop').addEventListener('click', stopMusic);
window.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('#music-toggle') && !musicNodes) startMusic({ currentTarget: document.querySelector('#music-toggle') });
}, { once: true });
function setZoom(value) { zoom = Math.min(1.2, Math.max(.55, value)); canvas.style.transform = `scale(${zoom})`; zoomValue.textContent = `${Math.round(zoom * 100)}%`; }
setZoom(zoom);
