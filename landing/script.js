/* ===== JAVASCRIPT ===== */
document.addEventListener('DOMContentLoaded', () => {

  // ===== NAVBAR SCROLL =====
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ===== HAMBURGER MENU =====
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.querySelectorAll('span').forEach((s, i) => {
      if (isOpen) {
        if (i === 0) s.style.transform = 'rotate(45deg) translate(5px, 5px)';
        if (i === 1) s.style.opacity = '0';
        if (i === 2) s.style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        s.style.transform = '';
        s.style.opacity = '';
      }
    });
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => {
        s.style.transform = '';
        s.style.opacity = '';
      });
    });
  });

  // ===== PARTICLES =====
  const particleContainer = document.getElementById('particles');
  const NUM_PARTICLES = 20;
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.setProperty('--dur', (Math.random() * 8 + 5) + 's');
    p.style.setProperty('--delay', (Math.random() * 8) + 's');
    const size = Math.random() * 4 + 2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    const colors = ['#4CAF70', '#3A9BD5', '#8B5CF6', '#F59E0B'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    particleContainer.appendChild(p);
  }

  // ===== HERO STAT COUNTER =====
  function animateCounter(el, target, duration = 2000) {
    const start = performance.now();
    const step = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('id-ID');
    };
    requestAnimationFrame(step);
  }

  // ===== INTERSECTION OBSERVER =====
  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  };

  // AOS-like animation observer
  const aosObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.aosDelay || '0';
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, parseInt(delay));
        aosObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));

  // Hero stat counters
  const heroStatObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.stat-num[data-target]').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target));
        });
        heroStatObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroStatObserver.observe(heroStats);

  // Count-up for impact section
  const countUpObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.count-up[data-target]').forEach(el => {
          animateCounter(el, parseInt(el.dataset.target), 2200);
        });
        countUpObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const impactGrid = document.querySelector('.impact-grid');
  if (impactGrid) countUpObserver.observe(impactGrid);

  // Waste bars animation
  const wasteBarsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.wb-fill').forEach((bar, i) => {
          setTimeout(() => {
            bar.style.width = bar.dataset.width;
          }, i * 150);
        });
        wasteBarsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const wasteBreakdown = document.querySelector('.waste-breakdown');
  if (wasteBreakdown) wasteBarsObserver.observe(wasteBreakdown);

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = 80;
        const targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });

  // ===== ACTIVE NAV LINK =====
  const sections = document.querySelectorAll('section[id]');
  const navLinkItems = document.querySelectorAll('.nav-links a');

  const activeLinkObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkItems.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => activeLinkObserver.observe(section));

  // ===== REWARD BUTTON INTERACTION =====
  const rewardBtn = document.getElementById('btn-tukar-reward');
  if (rewardBtn) {
    rewardBtn.addEventListener('click', () => {
      rewardBtn.textContent = '✓ Ditukar!';
      rewardBtn.style.background = 'linear-gradient(135deg, #4CAF70, #2E8B40)';
      rewardBtn.style.color = 'white';
      setTimeout(() => {
        rewardBtn.textContent = 'Tukar';
        rewardBtn.style.background = '';
        rewardBtn.style.color = '';
      }, 2000);
    });
  }

  // ===== PARALLAX HERO ORBs =====
  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('mousemove', (e) => {
    const mx = (e.clientX / window.innerWidth - 0.5) * 2;
    const my = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 10;
      orb.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
    });
  }, { passive: true });

  // ===== CARD HOVER TILT =====
  document.querySelectorAll('.feature-card, .tech-card, .impact-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotX = ((y - cy) / cy) * -4;
      const rotY = ((x - cx) / cx) * 4;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  console.log('%cSirkula Landing Page', 'color: #4CAF70; font-size: 16px; font-weight: bold;');
  console.log('%cPlatform Digital Bank Sampah — Circular Ecosystem', 'color: #9DC99E; font-size: 12px;');
});
