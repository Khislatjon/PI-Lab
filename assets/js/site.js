/* ==========================================================================
   Site behaviour: theme toggle, scroll reveals, canvas bootstrapping.
   ========================================================================== */
(function(){
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- theming -- */
  function readStored(){
    try { return localStorage.getItem('pilab-theme'); } catch(e){ return null; }
  }
  var stored = readStored();
  if(stored) root.setAttribute('data-theme', stored);

  var btn = document.getElementById('theme');
  if(btn){
    btn.addEventListener('click', function(){
      var cur = root.getAttribute('data-theme');
      if(!cur){
        cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('pilab-theme', next); } catch(e){}
    });
  }

  /* ---------------------------------------------------------- canvases -- */
  if(window.PiTomo){
    var hero = document.getElementById('tomo');
    if(hero){
      window.PiTomo.initHero(hero, { readout: document.getElementById('zread') });
    }
    window.PiTomo.drawTiles();
    window.addEventListener('load', window.PiTomo.drawTiles);
  }

  /* ----------------------------------------------------------- reveals --
     A page that loads hidden (background tab, link preview, thumbnailer) may
     never receive an intersection callback, so reveal outright there rather
     than risk the content staying invisible. */
  var nodes = document.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce && !document.hidden){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '-40px 0px -60px' });
    nodes.forEach(function(n){ io.observe(n); });
  } else {
    nodes.forEach(function(n){ n.classList.add('in'); });
  }
})();
