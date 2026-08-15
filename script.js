document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------
     Cursor light — desktop, motion-enabled only
  --------------------------------------------------------- */
  const cursorLight = document.getElementById('cursorLightPng');
  if (cursorLight && !isTouchDevice && !prefersReducedMotion) {
    document.addEventListener('mousemove', (e) => {
      cursorLight.style.left = e.clientX + 'px';
      cursorLight.style.top = e.clientY + 'px';
    });
  } else if (cursorLight) {
    cursorLight.style.display = 'none';
  }

  /* ---------------------------------------------------------
     Scroll-reveal animations
  --------------------------------------------------------- */
  const sections = document.querySelectorAll('.jsanimate');
  const headings = document.querySelectorAll('.heading-animate');
  const buttons = document.querySelectorAll('.btn');
  const cards = document.querySelectorAll('.card');

  if (prefersReducedMotion) {
    [...sections, ...headings, ...buttons, ...cards].forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.15 });

    [...sections, ...headings, ...buttons, ...cards].forEach(el => revealObserver.observe(el));
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navPanel = document.getElementById('primaryNav');

  if (navToggle && navPanel) {
    navToggle.addEventListener('click', () => {
      const isOpen = navPanel.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navPanel.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navPanel.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     Active nav link on scroll
  --------------------------------------------------------- */
  const navLinks = document.querySelectorAll('.nav__links a');
  const trackedSections = [...navLinks]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (trackedSections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === id);
          });
        }
      });
    }, { root: null, rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    trackedSections.forEach(section => navObserver.observe(section));
  }

  /* ---------------------------------------------------------
     CV download
  --------------------------------------------------------- */
  const cvButton = document.getElementById('cv-download');
  if (cvButton) {
    cvButton.addEventListener('click', function () {
      const cvPath = 'assets/download/my-cv.png';
      window.open(cvPath, '_blank');

      const anchor = document.createElement('a');
      anchor.href = cvPath;
      anchor.download = 'sajid_rahi_cv.png';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });
  }

});
