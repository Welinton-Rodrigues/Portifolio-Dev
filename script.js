// Visual 3D com três modos: Partículas, Rede (skills) e Monograma
(function(){
  if (typeof THREE === 'undefined') { console.warn('Three.js não carregado'); return; }
  const canvas = document.getElementById('bg3d');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.6, 4);

  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const colorA = 0x5a7cfb; // azul
  const colorB = 0x8a2be2; // roxo

  const state = {
    mode: (function(){
      try {
        var m = localStorage.getItem('visualMode') || 'particles';
        return (m === 'network') ? 'particles' : m;
      } catch(e){ return 'particles'; }
    })(),
    group: new THREE.Group(),
    isDragging: false,
    lastX: 0, lastY: 0,
    targetRotX: 0, targetRotY: 0,
    rotSpeed: 0.01,
    damp: 0.08,
    frame: 0,
    particles: null // data para atualização
  };
  scene.add(state.group);

  function clearGroup(){
    while(state.group.children.length){
      const obj = state.group.children.pop();
      obj.geometry && obj.geometry.dispose && obj.geometry.dispose();
      obj.material && obj.material.dispose && obj.material.dispose();
    }
  }

  // === Modo: Partículas Conectadas ===
  function buildParticles(){
    clearGroup();
    const COUNT = 120, R = 1.6, LINK_DIST = 0.7;
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for(let i=0;i<COUNT;i++){
      const r = R * Math.cbrt(Math.random());
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2*Math.random()-1);
      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.cos(ph) * 0.6; // achatado
      const z = r * Math.sin(ph) * Math.sin(th);
      positions[i*3] = x; positions[i*3+1] = y; positions[i*3+2] = z;
      velocities[i*3] = (Math.random()-0.5)*0.002;
      velocities[i*3+1] = (Math.random()-0.5)*0.002;
      velocities[i*3+2] = (Math.random()-0.5)*0.002;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: colorB, size: 0.03, transparent:true, opacity:0.9 });
    const points = new THREE.Points(pGeo, pMat);
    state.group.add(points);

    // linhas entre vizinhos próximos (estático para performance)
    const links = [];
    for(let i=0;i<COUNT;i++){
      for(let j=i+1;j<COUNT;j++){
        const dx = positions[i*3]-positions[j*3];
        const dy = positions[i*3+1]-positions[j*3+1];
        const dz = positions[i*3+2]-positions[j*3+2];
        const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(d < LINK_DIST && links.length < 400){
          links.push(positions[i*3], positions[i*3+1], positions[i*3+2], positions[j*3], positions[j*3+1], positions[j*3+2]);
        }
      }
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(links), 3));
    const lMat = new THREE.LineBasicMaterial({ color: colorA, transparent:true, opacity:0.8 });
    const lineSeg = new THREE.LineSegments(lGeo, lMat);
    state.group.add(lineSeg);

    state.particles = { positions, velocities, pGeo, R };
  }

  // === Utilitário: Sprite de texto ===
  function makeLabel(text){
    const padX = 12, padY = 6, font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + padX*2;
    const h = 28;
    canvas.width = w; canvas.height = h;
    ctx.font = font;
    ctx.fillStyle = 'rgba(21,26,43,0.9)';
    ctx.strokeStyle = 'rgba(138,43,226,0.6)';
    ctx.lineWidth = 2;
    ctx.roundRect(1,1,w-2,h-2,8); ctx.stroke(); ctx.fill();
    ctx.fillStyle = '#cfd8ff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padX, h/2);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(w/110, h/110, 1);
    return spr;
  }

  // === Modo: Rede de nós (skills) ===
  function buildNetwork(){
    clearGroup();
    const skills = ['JavaScript','React','Node','TypeScript','Java','Spring','PostgreSQL','n8n'];
    const radius = 1.8;
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color: colorA })
    );
    state.group.add(center);

    const lineMat = new THREE.LineBasicMaterial({ color: colorA, transparent:true, opacity:0.85 });
    const nodes = [];
    for(let i=0;i<skills.length;i++){
      const angle = (i/skills.length) * Math.PI*2;
      const y = (i%2===0? 0.35: -0.35);
      const x = Math.cos(angle) * radius*0.7;
      const z = Math.sin(angle) * radius*0.7;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: colorB }));
      const label = makeLabel(skills[i]);
      const group = new THREE.Group(); group.add(sphere); group.add(label);
      label.position.set(0.18, 0, 0);
      group.position.set(x, y, z);
      nodes.push({ group, angle, y });
      state.group.add(group);

      const geo = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(x,y,z) ]);
      const line = new THREE.Line(geo, lineMat);
      state.group.add(line);
    }
    state.network = { nodes, radius };
  }

  // === Modo: Monograma "W" extrudado (wireframe) ===
  function buildMonogram(){
    clearGroup();
    const pts = [
      new THREE.Vector3(-1.0,  1.0, 0),
      new THREE.Vector3(-0.6, -1.0, 0),
      new THREE.Vector3(-0.2,  0.3, 0),
      new THREE.Vector3( 0.0, -0.9, 0),
      new THREE.Vector3( 0.2,  0.3, 0),
      new THREE.Vector3( 0.6, -1.0, 0),
      new THREE.Vector3( 1.0,  1.0, 0)
    ];
    const depth = 0.35;
    const front = pts.map(p=> new THREE.Vector3(p.x, p.y, depth/2));
    const back  = pts.map(p=> new THREE.Vector3(p.x, p.y,-depth/2));

    const lineMat = new THREE.LineBasicMaterial({ color: colorA, transparent:true, opacity:0.95 });
    const geoFront = new THREE.BufferGeometry().setFromPoints(front);
    const geoBack  = new THREE.BufferGeometry().setFromPoints(back);
    const polyFront = new THREE.Line(geoFront, lineMat);
    const polyBack  = new THREE.Line(geoBack, lineMat);
    state.group.add(polyFront); state.group.add(polyBack);
    // conectores entre planos
    for(let i=0;i<pts.length;i++){
      const g = new THREE.BufferGeometry().setFromPoints([front[i], back[i]]);
      state.group.add(new THREE.Line(g, lineMat));
    }
  }

  function build(mode){
    state.mode = (mode === 'network') ? 'particles' : mode;
    try { localStorage.setItem('visualMode', mode); } catch(e){}
    if(state.mode==='particles') buildParticles();
    else buildMonogram();
    state.targetRotX = state.group.rotation.x;
    state.targetRotY = state.group.rotation.y;
    updateButtons();
  }

  // Interação (arraste e zoom)
  function onDown(e){ state.isDragging = true; state.lastX = e.clientX; state.lastY = e.clientY; }
  function onUp(){ state.isDragging = false; }
  function onMove(e){
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.targetRotY += dx * state.rotSpeed;
    state.targetRotX += dy * state.rotSpeed;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }
  function onWheel(e){ camera.position.z = Math.min(8, Math.max(4, camera.position.z + e.deltaY * 0.002)); }

  window.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('wheel', onWheel, { passive: true });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Botões de modo
  function updateButtons(){
    const el = document.querySelector('.visual-switch');
    if(!el) return;
    el.querySelectorAll('.vs-btn').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.mode === state.mode);
    });
  }
  (function bindButtons(){
    const el = document.querySelector('.visual-switch');
    if(!el) return;
    el.querySelectorAll('.vs-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> build(btn.dataset.mode));
    });
  })();

  // Inicializa modo escolhido e loop de animação
  build(state.mode);
  function animate(){
    requestAnimationFrame(animate);
    state.frame++;
    // rotação contínua suave
    state.targetRotY += 0.0012;
    state.group.rotation.y += (state.targetRotY - state.group.rotation.y) * state.damp;
    state.group.rotation.x += (state.targetRotX - state.group.rotation.x) * state.damp;

    // partículas: atualiza posições com drift e mantém dentro do raio
    if(state.particles){
      var positions = state.particles.positions;
      var velocities = state.particles.velocities;
      var pGeo = state.particles.pGeo;
      var R = state.particles.R;
      for(var i=0;i<positions.length;i+=3){
        positions[i]   += velocities[i];
        positions[i+1] += velocities[i+1];
        positions[i+2] += velocities[i+2];
        var len = Math.sqrt(positions[i]*positions[i] + positions[i+1]*positions[i+1] + positions[i+2]*positions[i+2]);
        if(len > R){ velocities[i]*=-1; velocities[i+1]*=-1; velocities[i+2]*=-1; }
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    // rede: orbita leve dos nós
    if(state.network){
      var nodes = state.network.nodes;
      var radius = state.network.radius;
      nodes.forEach(function(n){
        n.angle += 0.003;
        var x = Math.cos(n.angle) * radius*0.7;
        var z = Math.sin(n.angle) * radius*0.7;
        n.group.position.set(x, n.y, z);
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  // Efeito de digitação no título do Hero
  (function(){
    document.addEventListener('DOMContentLoaded', function(){
      var prefixEl = document.getElementById('typedPrefix');
      var nameEl = document.getElementById('typedName');
      if(!prefixEl || !nameEl) return;
      var h1 = prefixEl.parentElement || document.querySelector('#hero h1');
      if(h1) h1.classList.add('typed');
      var prefix = 'Olá, eu sou ';
      var name = 'Welinton Rodrigues';
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduceMotion){ prefixEl.textContent = prefix; nameEl.textContent = name; return; }
      prefixEl.textContent = ''; nameEl.textContent = '';
      var speed = 55; var pause = 250; var i = 0; var j = 0;
      function typePrefix(){ if(i < prefix.length){ prefixEl.textContent += prefix.charAt(i++); setTimeout(typePrefix, speed); } else { setTimeout(typeName, pause); } }
      function typeName(){ if(j < name.length){ nameEl.textContent += name.charAt(j++); setTimeout(typeName, speed); } }
      setTimeout(typePrefix, 300);
    });
  })();

  // Avatar fixo (sem upload): mantém o src definido no HTML
  (function(){
    document.addEventListener('DOMContentLoaded', function(){
      var img = document.getElementById('avatarImg');
      if(!img) return;
      // Nenhuma lógica de upload ou localStorage: usa a imagem estática definida em index.html
    });
  })();
})();

// === Menu Hambúrguer (Mobile) ===
(function initMobileNav(){
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    var backdrop = document.querySelector('.nav-backdrop');
    var panel = nav ? nav.querySelector('ul') : null;
    if(!btn || !nav) return;

    function isMobile(){ return window.matchMedia('(max-width: 900px)').matches; }

    function open(){
      var cs = window.getComputedStyle(btn);
      if(cs.display === 'none' || !isMobile()) return;
      nav.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      document.body.classList.add('nav-open');
      var header = document.querySelector('header');
      if(!document.querySelector('.drawer-close')){
        var cbtn = document.createElement('button');
        cbtn.className = 'drawer-close';
        cbtn.setAttribute('aria-label','Fechar menu');
        cbtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        cbtn.addEventListener('click', close);
        (header || document.body).appendChild(cbtn);
      }
    }
    function close(){
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      document.body.classList.remove('nav-open');
      var cxbtn = document.querySelector('.drawer-close');
      if(cxbtn && cxbtn.parentNode) cxbtn.parentNode.removeChild(cxbtn);
    }
    function toggle(){ if(nav.classList.contains('open')) close(); else open(); }

    btn.addEventListener('click', toggle);
    
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    // Fecha ao clicar em um link do menu
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function(a){ a.addEventListener('click', close); });

    

    

    // Fecha se redimensionar para desktop
    window.addEventListener('resize', function(){ if(!isMobile()) close(); });
  });
})();

// === Galáxia de Projetos (Canvas 2D) ===
(function initProjectsGalaxy(){
  const section = document.getElementById('projetos');
  const canvas = document.getElementById('projectsCanvas');
  if(!section || !canvas) return;
  const ctx = canvas.getContext('2d');
  const galaxy = canvas.parentElement;

  let w = 0, h = 0, cx = 0, cy = 0, pr = Math.min(window.devicePixelRatio||1, 2);
  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width; h = rect.height;
    canvas.width = Math.floor(w * pr);
    canvas.height = Math.floor(h * pr);
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    cx = w/2; cy = h/2;
  }
  window.addEventListener('resize', resize);
  resize();

  const STAR_COUNT = 160;
  const ARMS = 4;
  const stars = [];
  function rand(min,max){ return Math.random()*(max-min)+min; }
  const maxR = Math.min(w,h)/2 - 24;
  for(let i=0;i<STAR_COUNT;i++){
    const arm = i % ARMS;
    const base = (arm/ARMS) * Math.PI*2;
    const angle = base + rand(-0.25, 0.25);
    const radius = rand(12, maxR);
    const speed = rand(0.001, 0.004) * (radius/maxR + 0.3);
    const size = rand(1.0, 2.2);
    const color = Math.random() < 0.65 ? 'rgba(165,180,252,0.9)' : 'rgba(138,43,226,0.9)';
    stars.push({ angle, radius, speed, size, color });
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w,h)/2);
    grd.addColorStop(0, 'rgba(79,70,229,0.22)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0,0,w,h);

    for(const s of stars){
      s.angle += s.speed;
      const x = cx + Math.cos(s.angle) * s.radius;
      const y = cy + Math.sin(s.angle) * s.radius * 0.6; // elipse sutil
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.arc(x, y, s.size, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

  canvas.addEventListener('click', ()=>{
    section.classList.add('show-projects');
    setTimeout(()=>{ if(galaxy) galaxy.style.display = 'none'; }, 420);
    setTimeout(function(){ try{ window.dispatchEvent(new Event('resize')); }catch(e){} }, 60);
    var pc = section.querySelector('.projects-carousel');
    if(pc) pc.scrollTo({ left: 0, behavior: 'auto' });
    const firstCard = section.querySelector('.project-card a');
    if(firstCard) setTimeout(()=> firstCard.focus(), 300);
  });
})();

// === Carrossel de Projetos: destaque central e navegação ===
(function initProjectsCarousel(){
  document.addEventListener('DOMContentLoaded', function(){
    var section = document.getElementById('projetos');
    if(!section) return;
    var container = section.querySelector('.projects-carousel');
    if(!container) return;
    var cards = Array.prototype.slice.call(container.querySelectorAll('.project-card'));
    if(cards.length === 0) return;

    function getCardWidth(){ return container.clientWidth; }
    function updateSidePad(){ container.style.removeProperty('--side-pad'); }
    updateSidePad();

    function setActive(){
      var idx = Math.round(container.scrollLeft / Math.max(1, getCardWidth()));
      idx = Math.max(0, Math.min(cards.length-1, idx));
      cards.forEach(function(c, i){ c.classList.toggle('active', i === idx); });
    }

    function scrollToCard(idx){
      var w = getCardWidth();
      var target = Math.max(0, Math.min(cards.length-1, idx)) * w;
      container.scrollTo({ left: target, behavior: 'smooth' });
    }

    var prev = section.querySelector('.carousel-btn.prev');
    var next = section.querySelector('.carousel-btn.next');
    if(prev) prev.addEventListener('click', function(){ setActive(); var activeIdx = cards.findIndex(function(c){ return c.classList.contains('active'); }); scrollToCard(activeIdx-1); });
    if(next) next.addEventListener('click', function(){ setActive(); var activeIdx = cards.findIndex(function(c){ return c.classList.contains('active'); }); scrollToCard(activeIdx+1); });

    container.addEventListener('scroll', function(){ window.requestAnimationFrame(setActive); });
    window.addEventListener('resize', setActive);
    window.addEventListener('resize', updateSidePad);
    window.addEventListener('resize', function(){
      var activeIdx = cards.findIndex(function(c){ return c.classList.contains('active'); });
      if(activeIdx < 0) activeIdx = 0;
      var w = getCardWidth();
      container.scrollTo({ left: activeIdx * w, behavior: 'auto' });
    });

    // Navegação por setas quando o usuário estiver na seção
    section.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); if(prev) prev.click(); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); if(next) next.click(); }
    });

    // Scroll horizontal com roda do mouse
    container.addEventListener('wheel', function(e){ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ container.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive:false });

    // Inicializa com o primeiro item centralizado
    setActive(); scrollToCard(0);

    // Botão para voltar à galáxia
    var back = section.querySelector('.back-to-galaxy');
    if(back){
      back.addEventListener('click', function(){
        var galaxy = section.querySelector('.projects-galaxy');
        if(galaxy){ galaxy.style.display = ''; }
        section.classList.remove('show-projects');
        // posiciona rolagem no início ao retornar
        container.scrollTo({ left: 0, behavior: 'auto' });
      });
    }
  });
})();

// Remove texto solto acidental antes do título da seção "Sobre"
(function fixSobreStrayText(){
  document.addEventListener('DOMContentLoaded', function(){
    var s = document.getElementById('sobre');
    if(!s) return;
    Array.prototype.slice.call(s.childNodes).forEach(function(n){
      if(n.nodeType === 3 && n.textContent && n.textContent.trim().length){
        n.parentNode.removeChild(n);
      }
    });
  });
})();