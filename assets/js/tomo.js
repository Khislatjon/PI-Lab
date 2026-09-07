/* ==========================================================================
   Procedural tomographic slice renderer.

   Draws what the lab actually produces: an X-ray tomography slice through a
   porous structure, with a sweeping divider that turns raw greyscale into a
   D2IM-style predicted strain field.

   Trabecular bone is irregular rather than a lattice, so the structure comes
   from a narrow band around a level set of 3D fractal value noise. That
   yields curved, interconnected struts with marrow space between them, and a
   slice through the volume evolves smoothly as z advances.

   Exposes window.PiTomo = { initHero, drawTiles }.
   ========================================================================== */
window.PiTomo = (function(){
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BG = [7,12,13];

  /* ------------------------------------------------------- noise field -- */
  function h3(x,y,z){
    var n = Math.imul(x,374761393) ^ Math.imul(y,668265263) ^ Math.imul(z,1274126177);
    n = Math.imul(n ^ (n>>>13), 1274126177);
    return ((n ^ (n>>>16)) >>> 0) / 4294967296;
  }

  function vnoise(x,y,z){
    var xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
    var xf=x-xi, yf=y-yi, zf=z-zi;
    var u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf);
    var c000=h3(xi,yi,zi),     c100=h3(xi+1,yi,zi);
    var c010=h3(xi,yi+1,zi),   c110=h3(xi+1,yi+1,zi);
    var c001=h3(xi,yi,zi+1),   c101=h3(xi+1,yi,zi+1);
    var c011=h3(xi,yi+1,zi+1), c111=h3(xi+1,yi+1,zi+1);
    var x00=c000+(c100-c000)*u, x10=c010+(c110-c010)*u;
    var x01=c001+(c101-c001)*u, x11=c011+(c111-c011)*u;
    var y0=x00+(x10-x00)*v, y1=x01+(x11-x01)*v;
    return y0+(y1-y0)*w;
  }

  function fbm(x,y,z){
    var a=0.5, s=0, n=0;
    for(var o=0;o<4;o++){
      s += a*vnoise(x,y,z); n += a;
      x*=2.03; y*=2.03; z*=2.03; a*=0.5;
    }
    return s/n;
  }

  function smoothstep(a,b,t){ t=(t-a)/(b-a); t=t<0?0:t>1?1:t; return t*t*(3-2*t); }

  /* teal -> bone -> copper, the compressive/tensile strain ramp */
  function ramp(t,out){
    var lo=[24,120,130], mid=[233,228,216], hi=[214,110,42];
    var a,b,f;
    if(t<0.5){ a=lo; b=mid; f=t*2; } else { a=mid; b=hi; f=(t-0.5)*2; }
    out[0]=a[0]+(b[0]-a[0])*f;
    out[1]=a[1]+(b[1]-a[1])*f;
    out[2]=a[2]+(b[2]-a[2])*f;
  }

  /* --------------------------------------------------------------- job --
     A slice renders into two layers: raw greyscale, and the same structure
     colorized by a smooth strain field. Both are built once per slice, so
     the sweep between them costs nothing per frame. Work runs in row chunks
     so a rebuild never blocks a frame. */
  function makeJob(W,H,z,scale,seed,circular,ctxA,ctxB){
    return {
      W:W, H:H, z:z, scale:scale, seed:seed, circular:circular,
      dens:new Float32Array(W*H),
      gimg:ctxA.createImageData(W,H),
      simg:ctxB.createImageData(W,H),
      phase:0, row:0, done:false
    };
  }

  function stepJob(job,rows){
    var W=job.W, H=job.H, d=job.dens;
    var cx=W/2, cy=H/2, rad=Math.min(cx,cy)*0.98;
    var i,j,idx,end;

    if(job.phase===0){
      end=Math.min(H, job.row+rows);
      for(j=job.row;j<end;j++){
        for(i=0;i<W;i++){
          idx=j*W+i;
          var mask=1;
          if(job.circular){
            var dx=(i-cx)/rad, dy=(j-cy)/rad;
            var r=Math.sqrt(dx*dx+dy*dy);
            if(r>1){ d[idx]=-1; continue; }
            mask=smoothstep(1.0,0.82,r);
          }
          var X=i/W*job.scale + job.seed*3.1;
          var Y=j/W*job.scale + job.seed*1.7;
          var n=fbm(X,Y,job.z);
          /* the level set drifts so strut thickness varies across the
             specimen, the way bone volume fraction does in a real sample */
          var lev=0.5 + 0.05*Math.sin(X*0.55+job.z)*Math.cos(Y*0.47-job.z*0.6);
          d[idx]=(1-smoothstep(0.042,0.115,Math.abs(n-lev)))*mask;
        }
      }
      job.row=end;
      if(job.row>=H){ job.phase=1; job.row=0; }
      return;
    }

    var gp=job.gimg.data, sp=job.simg.data, c=[0,0,0];
    end=Math.min(H, job.row+rows);
    for(j=job.row;j<end;j++){
      for(i=0;i<W;i++){
        idx=j*W+i;
        var o=idx*4;
        var dv=d[idx];
        if(dv<0){
          gp[o]=BG[0]; gp[o+1]=BG[1]; gp[o+2]=BG[2]; gp[o+3]=255;
          sp[o]=BG[0]; sp[o+1]=BG[1]; sp[o+2]=BG[2]; sp[o+3]=255;
          continue;
        }
        /* phase-contrast style edge fringe from the local gradient */
        var l = i>0     ? d[idx-1] : dv;
        var rr= i<W-1   ? d[idx+1] : dv;
        var u = j>0     ? d[idx-W] : dv;
        var b = j<H-1   ? d[idx+W] : dv;
        if(l<0)l=dv; if(rr<0)rr=dv; if(u<0)u=dv; if(b<0)b=dv;
        var gx=rr-l, gy=b-u;
        var g=Math.sqrt(gx*gx+gy*gy);

        var grey=dv*0.80 + g*2.1 + 0.03;
        grey=grey<0?0:grey>1?1:grey;
        grey=Math.pow(grey,0.86);

        gp[o]=grey*243; gp[o+1]=grey*249; gp[o+2]=grey*247; gp[o+3]=255;

        /* a measured strain field is smooth and continuous: low-frequency
           noise, modulated by the structure it was measured on */
        var SX=i/W*job.scale + job.seed*3.1;
        var SY=j/W*job.scale + job.seed*1.7;
        var e = 0.5
              + 1.75*(vnoise(SX*0.17+11.3, SY*0.17+4.7, job.z*0.4)-0.5)
              + 0.55*(vnoise(SX*0.41+2.1,  SY*0.41+8.9, job.z*0.4)-0.5);
        e=e<0?0:e>1?1:e;
        ramp(e,c);
        var shade=0.14+1.05*grey;
        var sr=c[0]*shade, sg=c[1]*shade, sb=c[2]*shade;
        sp[o]=sr>255?255:sr; sp[o+1]=sg>255?255:sg; sp[o+2]=sb>255?255:sb; sp[o+3]=255;
      }
    }
    job.row=end;
    if(job.row>=H) job.done=true;
  }

  function layerCanvas(){ return document.createElement('canvas'); }

  /* --------------------------------------------------------------- hero -- */
  function initHero(canvas, opts){
    if(!canvas) return;
    opts = opts || {};
    var seed = opts.seed || 0;
    var readout = opts.readout || null;

    var ctx=canvas.getContext('2d');
    var gCur=layerCanvas(), sCur=layerCanvas(), gNext=layerCanvas(), sNext=layerCanvas();
    var gcN=gNext.getContext('2d'), scN=sNext.getContext('2d');
    var W=0, H=0, job=null, ready=false, slice=428, lastStart=-1e9;
    var SCALE=19, CADENCE=1100;

    function resize(){
      var r=canvas.getBoundingClientRect();
      var dpr=Math.min(window.devicePixelRatio||1, 2);
      canvas.width =Math.max(1,Math.round(r.width*dpr));
      canvas.height=Math.max(1,Math.round(r.height*dpr));
      W=Math.max(220,Math.min(660,Math.round(r.width)));
      H=Math.max(120,Math.round(W*(r.height/Math.max(r.width,1))));
      gCur.width=W;gCur.height=H; sCur.width=W;sCur.height=H;
      gNext.width=W;gNext.height=H; sNext.width=W;sNext.height=H;
      ready=false; job=null; lastStart=-1e9;
    }

    function begin(z){ job=makeJob(W,H,z,SCALE,seed,false,gcN,scN); }

    function finish(){
      gcN.putImageData(job.gimg,0,0);
      scN.putImageData(job.simg,0,0);
      var t1=gCur, t2=sCur;
      gCur=gNext; sCur=sNext; gNext=t1; sNext=t2;
      gcN=gNext.getContext('2d'); scN=sNext.getContext('2d');
      job=null; ready=true;
      slice=(slice+7)%1024;
      if(readout){
        readout.textContent='z '+String(slice).padStart(4,'0')+' / 1024';
      }
    }

    function draw(sweep){
      var cw=canvas.width, ch=canvas.height;
      var x=sweep*cw;
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(gCur,0,0,W,H,0,0,cw,ch);
      ctx.save();
      ctx.beginPath(); ctx.rect(x,0,cw-x,ch); ctx.clip();
      ctx.drawImage(sCur,0,0,W,H,0,0,cw,ch);
      ctx.restore();
      var glow=ctx.createLinearGradient(x-90,0,x+4,0);
      glow.addColorStop(0,'rgba(255,232,196,0)');
      glow.addColorStop(1,'rgba(255,232,196,.16)');
      ctx.fillStyle=glow; ctx.fillRect(x-90,0,94,ch);
      ctx.fillStyle='rgba(255,240,214,.92)';
      ctx.fillRect(x,0,Math.max(1.5,ch*0.0035),ch);
    }

    function frame(t){
      if(!job && (t-lastStart>CADENCE || !ready)){
        begin((slice/1024)*9.4 + t*0.00004 + seed*4);
        lastStart=t;
      }
      if(job){
        stepJob(job, Math.max(8, Math.ceil(H/9)));
        if(job.done) finish();
      }
      if(ready) draw(0.5 + 0.40*Math.sin(t*0.00019));
      requestAnimationFrame(frame);
    }

    /* build one slice synchronously so the panel is never empty on first
       paint, including in a background tab where rAF does not run */
    function still(){
      begin(3.4+seed*3);
      while(!job.done) stepJob(job, job.H);
      finish();
      draw(0.52);
    }

    resize();
    still();

    var rt=null;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt=setTimeout(function(){ resize(); still(); }, 160);
    });

    if(!reduce) requestAnimationFrame(frame);
  }

  /* -------------------------------------------------- specimen tiles -- */
  function drawTile(el){
    var seed=parseFloat(el.getAttribute('data-seed'))||1;
    var r=el.getBoundingClientRect();
    if(!r.width || !r.height) return;

    var dpr=Math.min(window.devicePixelRatio||1, 2);
    el.width =Math.max(1,Math.round(r.width*dpr));
    el.height=Math.max(1,Math.round(r.height*dpr));

    var W=Math.min(260, Math.max(90, Math.round(r.width*1.3)));
    var H=Math.max(50, Math.round(W*(r.height/r.width)));

    var a=layerCanvas(), b=layerCanvas();
    a.width=W;a.height=H; b.width=W;b.height=H;
    var ac=a.getContext('2d'), bc=b.getContext('2d');

    /* a circular field of view only reads as a specimen core on a squarish
       frame; portraits stay greyscale so they read as placeholders, while
       wide project strips carry the greyscale/strain split of the hero */
    var circular=(r.width/r.height) < 1.35;
    var job=makeJob(W,H,seed*2.3, circular?16:26, seed*0.37, circular, ac, bc);
    while(!job.done) stepJob(job,H);
    ac.putImageData(job.gimg,0,0);
    bc.putImageData(job.simg,0,0);

    var c=el.getContext('2d');
    var cw=el.width, ch=el.height;
    c.imageSmoothingEnabled=true;
    c.imageSmoothingQuality='high';
    c.drawImage(a,0,0,W,H,0,0,cw,ch);

    if(!circular){
      var x=cw*(0.34 + 0.16*Math.abs(Math.sin(seed*1.9)));
      c.save();
      c.beginPath(); c.rect(x,0,cw-x,ch); c.clip();
      c.drawImage(b,0,0,W,H,0,0,cw,ch);
      c.restore();
      c.fillStyle='rgba(255,240,214,.5)';
      c.fillRect(x,0,Math.max(1,ch*0.006),ch);
    }
    /* placeholders sit behind the type, not competing with it — portraits
       go quieter still, so a real photograph is an obvious upgrade */
    c.fillStyle = circular ? 'rgba(8,13,14,.58)' : 'rgba(8,13,14,.34)';
    c.fillRect(0,0,cw,ch);
  }

  function drawTiles(){
    var tiles=document.querySelectorAll('canvas.tile');
    for(var i=0;i<tiles.length;i++) drawTile(tiles[i]);
  }

  return { initHero:initHero, drawTiles:drawTiles };
})();
