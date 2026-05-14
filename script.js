/* ========== LOADER ========== */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 2200);
});

/* ========== CUSTOM CURSOR ========== */
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animCursor() {
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
  requestAnimationFrame(animCursor);
})();

/* ========== NAV SCROLL HIDE/SHOW ========== */
let lastScroll = 0;
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  const st = window.scrollY;
  nav.classList.toggle('hide-nav', st > lastScroll && st > 100);
  lastScroll = st;
});

/* ========== MOBILE MENU ========== */
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');
toggle.addEventListener('click', () => {
  menu.classList.toggle('open');
  const spans = toggle.querySelectorAll('span');
  if (menu.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});
menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  menu.classList.remove('open');
  toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}));

/* ========== ACTIVE SECTION TRACKING ========== */
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const dots = document.querySelectorAll('.dot');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
      dots.forEach(d => d.classList.toggle('active', d.dataset.section === id));
    }
  });
}, { threshold: 0.35 });
sections.forEach(s => observer.observe(s));

/* ========== REVEAL ON SCROLL ========== */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal-item, .timeline-item').forEach(el => revealObs.observe(el));

/* ========== COUNTER ANIMATION ========== */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = +el.dataset.count;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 60));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current;
      }, 25);
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(el => counterObs.observe(el));

/* ========== PARALLAX ========== */
window.addEventListener('scroll', () => {
  const st = window.scrollY;
  document.querySelectorAll('.parallax-container').forEach(c => {
    const rect = c.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const offset = (rect.top / window.innerHeight - 0.5) * -30;
      const img = c.querySelector('.parallax-img');
      if (img) img.style.transform = `translateY(${offset}px) scale(1.08)`;
    }
  });
});

/* ========== DRAGGABLE GALLERY (with Momentum & Wheel) ========== */
const track = document.getElementById('galleryTrack');
let isDrag = false, startX = 0, scrollLeft = 0, currentX = 0;
let velocity = 0, lastMoveX = 0, lastMoveTime = 0;
let momentumRAF = null;
let dragDistance = 0; // track total drag distance for click vs drag
const FRICTION = 0.94;        // momentum decay factor
const VELOCITY_SCALE = 1.2;   // amplify velocity for snappier feel
const DRAG_THRESHOLD = 6;     // px — below this, treat as click not drag
const WHEEL_SPEED = 1.8;      // wheel scroll multiplier

function getMaxScroll() {
  return track.scrollWidth - track.parentElement.clientWidth;
}
function clampX(x) {
  // Add rubber-band effect at edges
  const max = getMaxScroll();
  if (x > 0) return x * 0.3;
  if (x < -max) return -max + (x + max) * 0.3;
  return x;
}
function snapToBounds() {
  const max = getMaxScroll();
  if (currentX > 0) currentX = 0;
  if (currentX < -max) currentX = -max;
}
function applyTransform(x) {
  track.style.transform = `translateX(${x}px)`;
}
function startMomentum() {
  if (momentumRAF) cancelAnimationFrame(momentumRAF);
  function step() {
    velocity *= FRICTION;
    if (Math.abs(velocity) < 0.5) {
      velocity = 0;
      snapToBounds();
      applyTransform(currentX);
      return;
    }
    currentX += velocity;
    // Bounce back if overshooting
    const max = getMaxScroll();
    if (currentX > 0 || currentX < -max) {
      velocity *= 0.4; // heavy damping at edges
      snapToBounds();
    }
    applyTransform(currentX);
    momentumRAF = requestAnimationFrame(step);
  }
  momentumRAF = requestAnimationFrame(step);
}

// === Mouse Events ===
track.addEventListener('mousedown', e => {
  isDrag = true;
  dragDistance = 0;
  startX = e.pageX;
  scrollLeft = currentX;
  lastMoveX = e.pageX;
  lastMoveTime = Date.now();
  velocity = 0;
  if (momentumRAF) cancelAnimationFrame(momentumRAF);
  track.style.cursor = 'grabbing';
});
document.addEventListener('mousemove', e => {
  if (!isDrag) return;
  const dx = e.pageX - startX;
  dragDistance = Math.abs(dx);
  currentX = clampX(scrollLeft + dx);
  applyTransform(currentX);
  // Track velocity
  const now = Date.now();
  const dt = now - lastMoveTime;
  if (dt > 0) {
    velocity = ((e.pageX - lastMoveX) / dt) * 16 * VELOCITY_SCALE;
  }
  lastMoveX = e.pageX;
  lastMoveTime = now;
});
document.addEventListener('mouseup', () => {
  if (!isDrag) return;
  isDrag = false;
  track.style.cursor = '';
  startMomentum();
});

// === Touch Events ===
track.addEventListener('touchstart', e => {
  isDrag = true;
  dragDistance = 0;
  startX = e.touches[0].pageX;
  scrollLeft = currentX;
  lastMoveX = e.touches[0].pageX;
  lastMoveTime = Date.now();
  velocity = 0;
  if (momentumRAF) cancelAnimationFrame(momentumRAF);
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!isDrag) return;
  const px = e.touches[0].pageX;
  const dx = px - startX;
  dragDistance = Math.abs(dx);
  currentX = clampX(scrollLeft + dx);
  applyTransform(currentX);
  // Track velocity
  const now = Date.now();
  const dt = now - lastMoveTime;
  if (dt > 0) {
    velocity = ((px - lastMoveX) / dt) * 16 * VELOCITY_SCALE;
  }
  lastMoveX = px;
  lastMoveTime = now;
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!isDrag) return;
  isDrag = false;
  startMomentum();
});

// === Mouse Wheel (Horizontal Scroll) ===
track.parentElement.addEventListener('wheel', e => {
  e.preventDefault();
  if (momentumRAF) cancelAnimationFrame(momentumRAF);
  // Use deltaY for vertical wheel → horizontal scroll
  const delta = (e.deltaY || e.deltaX) * WHEEL_SPEED;
  currentX -= delta;
  snapToBounds();
  applyTransform(currentX);
  // Add small momentum from wheel
  velocity = -delta * 0.3;
  startMomentum();
}, { passive: false });

/* ========== LIGHTBOX ========== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
document.querySelectorAll('.gallery-img-wrapper img, .cert-image-wrapper img').forEach(img => {
  img.addEventListener('click', () => {
    // Only open lightbox on genuine click, not after a drag
    if (dragDistance > DRAG_THRESHOLD) return;
    lightboxImg.src = img.src;
    lightbox.classList.add('active');
  });
});
document.getElementById('lightboxClose').addEventListener('click', () => lightbox.classList.remove('active'));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('active'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('active'); });

/* ========== SMOOTH SCROLL ========== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ========== SCROLL PROGRESS BAR ========== */
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  const pct = (window.scrollY / docH) * 100;
  if (scrollProgress) scrollProgress.style.width = pct + '%';
});

/* ========== HERO PARTICLES ========== */
(function initParticles() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouseParticle = { x: 0, y: 0 };
  const PARTICLE_COUNT = 50;

  function resize() {
    const hero = canvas.parentElement;
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Track mouse in hero
  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.parentElement.getBoundingClientRect();
    mouseParticle.x = e.clientX - rect.left;
    mouseParticle.y = e.clientY - rect.top;
  });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.hue = Math.random() > 0.5 ? 340 : 320; // pink hues
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // Mouse repulsion
      const dx = this.x - mouseParticle.x;
      const dy = this.y - mouseParticle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.8;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      }
      if (this.x < 0 || this.x > W) this.speedX *= -1;
      if (this.y < 0 || this.y > H) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 45, 120, ${0.06 * (1 - dist / 140)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ========== SECTION HEADER REVEAL ========== */
const headerObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('header-visible');
      headerObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.section-header').forEach(h => headerObs.observe(h));

/* ========== 3D TILT EFFECT ON CARDS ========== */
document.querySelectorAll('.cert-card, .download-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ========== BUTTON SPOTLIGHT EFFECT ========== */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--mx', x + '%');
    btn.style.setProperty('--my', y + '%');
  });
});

/* ========== SOCIAL ICON STAGGER ANIMATION ========== */
const socialObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const icons = e.target.querySelectorAll('.social-icon');
      icons.forEach((icon, i) => {
        icon.style.opacity = '0';
        icon.style.transform = 'translateY(20px) scale(0.8)';
        setTimeout(() => {
          icon.style.transition = 'opacity .5s var(--ease), transform .5s var(--ease)';
          icon.style.opacity = '1';
          icon.style.transform = 'translateY(0) scale(1)';
        }, i * 100);
      });
      socialObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const socialIcons = document.querySelector('.social-icons');
if (socialIcons) socialObs.observe(socialIcons);
