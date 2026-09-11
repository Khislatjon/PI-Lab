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

  /* ---------------------------------------------------- mobile drawer --
     Below DRAWER_MAX the primary links live in an off-canvas panel. Keep the
     value in step with the drawer media query in site.css. */
  var DRAWER_MAX = 560;
  var navBtn = document.getElementById('navtoggle');
  var nav = document.getElementById('primary-nav');
  var scrim = document.getElementById('navscrim');

  if(navBtn && nav && scrim){
    var mq = window.matchMedia('(max-width:' + DRAWER_MAX + 'px)');

    function drawerOpen(){ return root.classList.contains('nav-open'); }

    function setDrawer(open, refocus){
      root.classList.toggle('nav-open', open);
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      navBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if(open){
        var first = nav.querySelector('a');
        if(first){ first.focus(); }
      } else if(refocus){
        navBtn.focus();
      }
    }

    navBtn.addEventListener('click', function(){ setDrawer(!drawerOpen(), true); });
    scrim.addEventListener('click', function(){ setDrawer(false, true); });

    /* Following a link closes the panel without pulling focus back to the
       button, so the destination page starts focus where it normally would. */
    nav.addEventListener('click', function(e){
      if(e.target.closest('a')){ setDrawer(false, false); }
    });

    document.addEventListener('keydown', function(e){
      if(!drawerOpen()){ return; }
      if(e.key === 'Escape'){
        e.preventDefault();
        setDrawer(false, true);
        return;
      }
      if(e.key !== 'Tab'){ return; }
      /* The button sits above the scrim and acts as the panel's close, so it
         belongs inside the ring rather than outside it. */
      var ring = [navBtn].concat(Array.prototype.slice.call(nav.querySelectorAll('a')));
      var i = ring.indexOf(document.activeElement);
      if(i === -1){ return; }
      var next = e.shiftKey ? i - 1 : i + 1;
      if(next < 0){ next = ring.length - 1; }
      if(next >= ring.length){ next = 0; }
      e.preventDefault();
      ring[next].focus();
    });

    /* Widening past the breakpoint puts the links back in the bar, so drop the
       open state rather than leaving a stuck scroll lock behind. */
    function onBreakpoint(e){
      if(!e.matches){ setDrawer(false, false); }
    }
    if(mq.addEventListener){ mq.addEventListener('change', onBreakpoint); }
    else if(mq.addListener){ mq.addListener(onBreakpoint); }
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
    }, { rootMargin: '-46px 0px -69px' });
    nodes.forEach(function(n){ io.observe(n); });
  } else {
    nodes.forEach(function(n){ n.classList.add('in'); });
  }
})();
