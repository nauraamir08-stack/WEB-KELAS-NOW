document.documentElement.classList.add('js');
if (!document.querySelector('link[href="./enhancements.css"]')) {
 const enhancements=document.createElement('link');enhancements.rel='stylesheet';enhancements.href='./enhancements.css';document.head.append(enhancements);
}
document.addEventListener('DOMContentLoaded',()=>{
 const pageName=(location.pathname.split('/').pop()||'index.html').replace('.html','');
 document.body.classList.add('view-'+pageName);
 const showDesktopSuggestion=()=>{
  const isPhone=window.matchMedia('(max-width:680px)').matches&&/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if(!isPhone||sessionStorage.getItem('heroclass-desktop-suggestion'))return;
  const notice=document.createElement('div');
  notice.className='desktop-suggestion';notice.setAttribute('role','dialog');notice.setAttribute('aria-modal','true');notice.setAttribute('aria-labelledby','desktop-suggestion-title');
  notice.innerHTML='<section class="desktop-suggestion-card"><span class="desktop-suggestion-icon" aria-hidden="true">▣</span><p class="desktop-suggestion-eyebrow">TAMPILAN HEROCLASS</p><h2 id="desktop-suggestion-title">Lebih nyaman di layar luas.</h2><p>Untuk melihat profil dan galeri dengan ruang lebih leluasa, gunakan laptop atau aktifkan <strong>Situs desktop</strong> dari menu browser. Website ini tetap dapat digunakan di ponsel.</p><div class="desktop-suggestion-actions"><button type="button" class="button" data-desktop-continue>Lanjutkan di ponsel <span aria-hidden="true">↗</span></button></div><p class="desktop-suggestion-help">Chrome: ketuk menu ⋮ lalu pilih “Situs desktop”.</p></section>';
  const close=()=>{sessionStorage.setItem('heroclass-desktop-suggestion','1');notice.remove()};
  notice.querySelector('[data-desktop-continue]').addEventListener('click',close);document.body.append(notice);
 };
 showDesktopSuggestion();
 document.querySelectorAll('a[href="./"]').forEach(link=>{link.setAttribute('href','./index.html')});
 const button=document.querySelector('.menu-toggle');
 const nav=document.querySelector('#site-navigation');
 const setOpen=open=>{button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');nav.classList.toggle('is-open',open)};
 button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus()}});
 document.addEventListener('click',event=>{if(!event.target.closest('header'))setOpen(false)});
 window.matchMedia('(min-width:681px)').addEventListener('change',()=>setOpen(false));
});
