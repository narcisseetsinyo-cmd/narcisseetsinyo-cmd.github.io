// Menu mobile
(function(){
  var b=document.getElementById('menuBtn'),m=document.getElementById('mobileMenu');
  if(!b||!m)return;
  b.addEventListener('click',function(){var o=m.hidden;m.hidden=!o;b.setAttribute('aria-expanded',o?'true':'false');});
  m.addEventListener('click',function(e){if(e.target.tagName==='A'){m.hidden=true;b.setAttribute('aria-expanded','false');}});
})();
// Filtres de la page blog
(function(){
  var f=document.getElementById('filters');if(!f)return;
  var cards=document.querySelectorAll('[data-cat]');
  f.addEventListener('click',function(e){
    var btn=e.target.closest('button');if(!btn)return;
    f.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===btn?'true':'false')});
    var c=btn.getAttribute('data-filter');
    cards.forEach(function(k){k.hidden=!(c==='*'||k.getAttribute('data-cat')===c)});
  });
})();
document.querySelectorAll('[data-copy]').forEach(function(b){
  b.addEventListener('click',function(){
    var t=b.getAttribute('data-copy'), toast=document.getElementById('toast');
    var what=b.getAttribute('data-what');
    function ok(){toast.textContent=what+' copié'+(what==='Adresse'?'e':'')+'.';}
    function fb(){var r=document.createRange();r.selectNodeContents(document.getElementById(b.getAttribute('data-target')));var s=getSelection();s.removeAllRanges();s.addRange(r);toast.textContent=what+' sélectionné'+(what==='Adresse'?'e':'')+', copiez-le.';}
    try{navigator.clipboard.writeText(t).then(ok,fb);}catch(e){fb();}
  });
});

(function(){
  var d=document.getElementById('lightbox'),im=document.getElementById('lbImg'),cap=document.getElementById('lbCap');
  if(!d||typeof d.showModal!=='function')return;
  document.querySelectorAll('.zoom').forEach(function(b){
    b.addEventListener('click',function(){
      var i=b.querySelector('img'),fc=b.parentNode.querySelector('.cap');
      im.src=i.src;im.alt=i.alt;cap.innerHTML='';
      var t=document.createElement('b');t.textContent=fc.querySelector('b').textContent;
      var c=document.createElement('span');c.textContent=fc.querySelector('span').textContent;
      cap.appendChild(t);cap.appendChild(c);d.showModal();
    });
  });
  document.getElementById('lbClose').addEventListener('click',function(){d.close()});
  d.addEventListener('click',function(e){if(e.target===d)d.close()});
})();
