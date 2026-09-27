const SUPABASE_URL = 'https://xwhztlpacoclpksehdvf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zFwURi3z7OQLZq2IrJLW5w_jsgkIli5';
const BUCKET = 'heroclass-media';
let db;
let galleryItems = [];

async function client() {
  if (window.supabase) return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Supabase tidak dapat dimuat'));
    document.head.append(script);
  });
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const pages = {
  anggota: ['anggota.html', '#member-list', 'Belum ada anggota. Tambahkan nama dan foto melalui halaman admin.'],
  pengurus: ['pengurus.html', '#leader-list', 'Belum ada pengurus. Isi jabatan saat menambahkan anggota di halaman admin.'],
  jadwal: ['jadwal.html', '#schedule-list', 'Jadwal kuliah belum ditambahkan.'],
  galeri: ['galeri.html', '#gallery-list', 'Album masih kosong. Foto kegiatan bisa ditambahkan melalui halaman admin.']
};

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function activePage() {
  const name = location.pathname.split('/').pop() || 'index.html';
  return Object.entries(pages).find(([, page]) => page[0] === name)?.[0];
}

function showEmpty(target, message) { target.replaceChildren(make('div', 'empty', message)); }
function publicUrl(path) { return path ? db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : ''; }

function personCard(item) {
  const card = make('article', 'profile-card');
  if (item.photo_path) {
    const image = make('img', 'profile-photo');
    image.src = publicUrl(item.photo_path); image.alt = `Foto profil ${item.name}`; image.loading = 'lazy'; card.append(image);
  } else card.append(make('span', 'profile-initial', item.name.slice(0, 1).toUpperCase()));
  const meta = make('div', 'profile-meta');
  meta.append(make('h3', '', item.name));
  if (item.role) meta.append(make('p', 'profile-role', item.role));
  card.append(meta); return card;
}

function scheduleDayCard(day, items) {
  const card = make('article', 'day-schedule-card');
  const head = make('div', 'day-schedule-head');
  head.append(make('span', 'day-schedule-label', day), make('span', 'day-schedule-count', `${items.length} kelas`));
  const list = make('div', 'day-schedule-list');
  if (!items.length) list.append(make('p', 'day-schedule-empty', 'Belum ada jadwal.'));
  else items.forEach((item) => {
    const lesson = make('article', 'day-lesson');
    const info = make('div', 'day-lesson-info');
    info.append(make('h3', '', item.course));
    info.append(make('p', '', item.room ? `Ruang ${item.room}` : 'Ruang belum diisi'));
    lesson.append(make('strong', 'day-lesson-time', `${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}`), info);
    list.append(lesson);
  });
  card.append(head, list); return card;
}

function galleryCard(item) {
  const card = make('article', 'gallery-card');
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Buka foto ${item.title}`);
  if (item.photo_path) {
    const image = make('img', 'gallery-photo');
    image.src = publicUrl(item.photo_path); image.alt = item.title; image.loading = 'lazy'; card.append(image);
  }
  const body = make('div', 'gallery-copy');
  body.append(make('h3', '', item.title));
  if (item.caption) body.append(make('p', '', item.caption));
  if (item.event_date) body.append(make('time', '', item.event_date));
  body.append(make('span', 'gallery-open-hint', 'Klik untuk melihat foto'));
  card.append(body);
  const open = () => openGallery(item);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  return card;
}

function galleryDialog() {
  let dialog = document.querySelector('#gallery-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'gallery-dialog'; dialog.className = 'gallery-dialog';
  const shell = make('div', 'gallery-dialog-shell');
  const close = make('button', 'gallery-dialog-close', '×');
  close.type = 'button'; close.setAttribute('aria-label', 'Tutup tampilan foto');
  const previous = make('button', 'gallery-dialog-nav gallery-dialog-previous', '‹'); previous.type = 'button'; previous.setAttribute('aria-label', 'Foto sebelumnya');
  const next = make('button', 'gallery-dialog-nav gallery-dialog-next', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Foto berikutnya');
  const image = make('img', 'gallery-dialog-image'); image.alt = '';
  const details = make('div', 'gallery-dialog-details');
  const title = make('h2', ''); const caption = make('p', ''); const date = make('time', '');
  const download = make('button', 'gallery-download', 'Simpan foto ↓'); download.type = 'button';
  details.append(title, caption, date, download); shell.append(close, previous, image, next, details); dialog.append(shell);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  previous.addEventListener('click', () => renderGalleryDialog(dialog, dialog.galleryIndex - 1));
  next.addEventListener('click', () => renderGalleryDialog(dialog, dialog.galleryIndex + 1));
  dialog.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') renderGalleryDialog(dialog, dialog.galleryIndex - 1); if (event.key === 'ArrowRight') renderGalleryDialog(dialog, dialog.galleryIndex + 1); });
  let swipeStart = 0;
  image.addEventListener('touchstart', (event) => { swipeStart = event.changedTouches[0].clientX; }, { passive: true });
  image.addEventListener('touchend', (event) => { const distance = event.changedTouches[0].clientX - swipeStart; if (Math.abs(distance) > 40) renderGalleryDialog(dialog, dialog.galleryIndex + (distance < 0 ? 1 : -1)); }, { passive: true });
  document.body.append(dialog);
  return dialog;
}

async function downloadGalleryPhoto(item, button) {
  if (!item.photo_path) return;
  const original = button.textContent; button.disabled = true; button.textContent = 'Menyiapkan foto…';
  try {
    const { data, error } = await db.storage.from(BUCKET).download(item.photo_path);
    if (error) throw error;
    const extension = item.photo_path.split('.').pop() || 'jpg';
    const safeName = (item.title || 'foto-heroclass').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const href = URL.createObjectURL(data); const link = document.createElement('a');
    link.href = href; link.download = `${safeName || 'foto-heroclass'}.${extension}`; document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch (error) { console.error(error); button.textContent = 'Unduh gagal, coba lagi'; }
  finally { button.disabled = false; window.setTimeout(() => { button.textContent = original; }, 1500); }
}

function renderGalleryDialog(dialog, index) {
  if (!galleryItems.length) return;
  dialog.galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[dialog.galleryIndex];
  const image = dialog.querySelector('.gallery-dialog-image');
  const title = dialog.querySelector('h2'); const caption = dialog.querySelector('p'); const date = dialog.querySelector('time');
  image.src = publicUrl(item.photo_path); image.alt = item.title; title.textContent = item.title;
  caption.textContent = item.caption || 'Momen bersama PGSD Heroclass.'; date.textContent = item.event_date || '';
  date.hidden = !item.event_date;
  const download = dialog.querySelector('.gallery-download');
  download.disabled = !item.photo_path; download.onclick = () => downloadGalleryPhoto(item, download);
  dialog.querySelector('.gallery-dialog-previous').hidden = galleryItems.length < 2;
  dialog.querySelector('.gallery-dialog-next').hidden = galleryItems.length < 2;
}

function openGallery(item) {
  const dialog = galleryDialog();
  renderGalleryDialog(dialog, Math.max(0, galleryItems.findIndex((photo) => photo.id === item.id)));
  dialog.showModal();
}

async function loadPage() {
  const key = activePage();
  if (!key) return;
  const [, selector, emptyMessage] = pages[key];
  const target = document.querySelector(selector) || (key === 'pengurus' ? document.querySelector('#pengurus .people') : null);
  if (!target) return;
  if (key === 'pengurus') target.classList.add('profile-grid');
  showEmpty(target, 'Memuat data…');
  try {
    db = await client();
    if (key === 'anggota' || key === 'pengurus') {
      const { data, error } = await db.from('class_members').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      const people = data.filter((person) => key === 'pengurus' ? Boolean(person.role) : !person.role);
      target.replaceChildren(...(people.length ? people.map(personCard) : [make('div', 'empty', emptyMessage)])); return;
    }
    if (key === 'jadwal') {
      const { data, error } = await db.from('class_schedules').select('*');
      if (error) throw error;
      const order = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      data.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day) || a.start_time.localeCompare(b.start_time));
      target.replaceChildren(...order.map((day) => scheduleDayCard(day, data.filter((item) => item.day === day)))); return;
    }
    const { data, error } = await db.from('class_gallery').select('*').order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) throw error;
    galleryItems = data;
    target.replaceChildren(...(data.length ? data.map(galleryCard) : [make('div', 'empty', emptyMessage)]));
  } catch (error) {
    console.error(error); showEmpty(target, 'Data belum dapat dimuat. Coba buka kembali beberapa saat lagi.');
  }
}

document.addEventListener('DOMContentLoaded', loadPage);
