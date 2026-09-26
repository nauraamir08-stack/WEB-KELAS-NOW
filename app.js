document.documentElement.classList.add('js');
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('a[href="./"]').forEach(link=>{link.setAttribute('href','./index.html')});
 const button=document.querySelector('.menu-toggle');
 const nav=document.querySelector('#site-navigation');
 const setOpen=open=>{button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');nav.classList.toggle('is-open',open)};
 button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus()}});
 document.addEventListener('click',event=>{if(!event.target.closest('header'))setOpen(false)});
 window.matchMedia('(min-width:681px)').addEventListener('change',()=>setOpen(false));
});
