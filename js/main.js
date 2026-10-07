/* ============================================
   OXXI ACADEMIA — FITNESS FUNCIONAL — LANDING PAGE JS
   Lenis (scroll suave) + GSAP/ScrollTrigger (reveal) + vanilla-tilt (cards)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- LENIS: scroll suave ----------
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // conecta Lenis ao ScrollTrigger
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // ---------- GSAP: reveal on scroll ----------
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // fallback: garante visibilidade se algo falhar
    gsap.set('.reveal, .reveal-line', { opacity: 0, y: 28 });

    document.querySelectorAll('.reveal').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: (i % 4) * 0.06,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // título do hero: linhas entram em cascata, sem depender de scroll
    gsap.to('.reveal-line', {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.12,
      delay: 0.2,
    });

    // parallax leve no fundo do hero
    gsap.to('.hero__bg', {
      yPercent: 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // contador numérico das estatísticas
    document.querySelectorAll('.stat__num').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const counter = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(counter, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Math.floor(counter.val).toLocaleString('pt-BR');
            },
          });
        },
      });
    });

    // nav muda de fundo depois de rolar
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top -80',
      onUpdate: (self) => {
        document.getElementById('nav').classList.toggle('nav--scrolled', self.scroll() > 80);
      },
    });
  } else {
    // sem GSAP: garante que o conteúdo apareça mesmo assim
    document.querySelectorAll('.reveal, .reveal-line').forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }

  // ---------- vanilla-tilt: cards com leve 3D no mouse ----------
  if (window.VanillaTilt) {
    VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
      max: 8,
      speed: 400,
      glare: true,
      'max-glare': 0.15,
      scale: 1.02,
    });
  }

  // ---------- carrosséis mobile: fotos automáticas + setas manuais ----------
  const isMobileViewport = () => window.matchMedia('(max-width: 900px)').matches;

  const carouselCurrentIndex = (container) => {
    const items = [...container.children];
    if (!items.length) return 0;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    items.forEach((item, i) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const dist = Math.abs(itemCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  };

  const carouselGoTo = (container, index) => {
    const items = container.children;
    if (!items.length) return;
    const wrapped = (index + items.length) % items.length;
    const item = items[wrapped];
    // scrollTo no próprio container mexe só no eixo horizontal dele — nunca no scroll da página
    const maxLeft = container.scrollWidth - container.clientWidth;
    const targetLeft = item.offsetLeft + item.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, Math.min(maxLeft, targetLeft)), behavior: 'smooth' });
  };

  // carrossel de fotos + depoimentos: avança sozinho a cada 2s, só no mobile
  const communityGrid = document.getElementById('media-carousel');
  if (communityGrid) {
    // só toque real do usuário pausa o autoplay — scroll programático (do próprio autoplay) não conta
    let lastManualTouch = 0;
    communityGrid.addEventListener('touchstart', () => { lastManualTouch = Date.now(); }, { passive: true });
    communityGrid.addEventListener('pointerdown', () => { lastManualTouch = Date.now(); }, { passive: true });
    // enquanto um depoimento está tocando, o autoplay não atrapalha
    let anyVideoPlaying = false;
    communityGrid.querySelectorAll('video').forEach((v) => {
      v.addEventListener('play', () => { anyVideoPlaying = true; });
      v.addEventListener('pause', () => { anyVideoPlaying = false; });
      v.addEventListener('ended', () => { anyVideoPlaying = false; });
    });
    setInterval(() => {
      if (!isMobileViewport()) return;
      if (anyVideoPlaying) return;
      if (Date.now() - lastManualTouch < 3000) return;
      carouselGoTo(communityGrid, carouselCurrentIndex(communityGrid) + 1);
    }, 2000);
  }

  // setas manuais: depoimentos
  document.querySelectorAll('[data-carousel-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const container = document.getElementById(btn.dataset.carouselPrev);
      if (container) carouselGoTo(container, carouselCurrentIndex(container) - 1);
    });
  });
  document.querySelectorAll('[data-carousel-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const container = document.getElementById(btn.dataset.carouselNext);
      if (container) carouselGoTo(container, carouselCurrentIndex(container) + 1);
    });
  });

  // ---------- botão flutuante de WhatsApp: bolha ----------
  // aparece 10s depois que a página carrega, não depende de rolar até o final
  const waBubble = document.getElementById('wa-float-bubble');
  const waBubbleClose = document.getElementById('wa-float-bubble-close');
  if (waBubble) {
    const showTimer = setTimeout(() => {
      waBubble.classList.add('wa-float__bubble--visible');
    }, 10000);

    waBubbleClose?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      clearTimeout(showTimer);
      waBubble.classList.remove('wa-float__bubble--visible');
    });
  }

  // ---------- pop-up de cupom: aparece ao passar a primeira dobra (desktop e mobile) ----------
  const couponPopup = document.getElementById('coupon-popup');
  const couponPopupClose = document.getElementById('coupon-popup-close');
  if (couponPopup) {
    const STORAGE_KEY = 'ff_coupon_shown';

    const showPopup = () => {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      couponPopup.classList.add('coupon-popup--visible');
      sessionStorage.setItem(STORAGE_KEY, '1');
    };

    const hidePopup = () => {
      couponPopup.classList.remove('coupon-popup--visible');
    };

    if (!sessionStorage.getItem(STORAGE_KEY)) {
      const onScroll = () => {
        if (window.scrollY > window.innerHeight * 0.9) {
          showPopup();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    couponPopupClose?.addEventListener('click', hidePopup);
    couponPopup.addEventListener('click', (e) => {
      if (e.target === couponPopup) hidePopup();
    });
  }

});
