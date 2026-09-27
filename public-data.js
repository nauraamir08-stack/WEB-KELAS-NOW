const SUPABASE_URL = 'https://xwhztlpacoclpksehdvf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zFwURi3z7OQLZq2IrJLW5w_jsgkIli5';
const BUCKET = 'heroclass-media';
let db;

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

function scheduleCard(item) {
  const card = make('article', 'schedule-card');
  const info = make('div', 'schedule-info');
  info.append(make('h3', '', item.course));
  info.append(make('p', '', item.room ? `Ruang ${item.room}` : 'Mata kuliah'));
  card.append(make('span', 'schedule-day', item.day), make('strong', 'schedule-time', `${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}`), info);
  return card;
}

function galleryCard(item) {
  const card = make('article', 'gallery-card');
  if (item.photo_path) {
    const image = make('img', 'gallery-photo');
    image.src = publicUrl(item.photo_path); image.alt = item.title; image.loading = 'lazy'; card.append(image);
  }
  const body = make('div', 'gallery-copy');
  body.append(make('h3', '', item.title));
  if (item.caption) body.append(make('p', '', item.caption));
  if (item.event_date) body.append(make('time', '', item.event_date));
  card.append(body); return card;
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
      target.replaceChildren(...(data.length ? data.map(scheduleCard) : [make('div', 'empty', emptyMessage)])); return;
    }
    const { data, error } = await db.from('class_gallery').select('*').order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
    if (error) throw error;
    target.replaceChildren(...(data.length ? data.map(galleryCard) : [make('div', 'empty', emptyMessage)]));
  } catch (error) {
    console.error(error); showEmpty(target, 'Data belum dapat dimuat. Coba buka kembali beberapa saat lagi.');
  }
}

document.addEventListener('DOMContentLoaded', loadPage);
