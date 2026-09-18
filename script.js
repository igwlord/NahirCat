const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  nav.classList.remove('open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  nav.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.querySelectorAll('a[href="#contacto"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  const contact = document.getElementById('contacto');
  const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;
  const availableHeight = window.innerHeight - headerHeight;
  const sectionHeight = contact.getBoundingClientRect().height;
  const topGap = Math.max(14, (availableHeight - sectionHeight) / 2);
  const top = window.scrollY + contact.getBoundingClientRect().top - headerHeight - topGap;
  if (window.location.hash !== '#contacto') history.pushState(null, '', '#contacto');
  window.scrollTo({
    top,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  });
}));
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});

const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(contactForm);
  const subject = encodeURIComponent('Consulta para Nahir Cat Sitter');
  const body = encodeURIComponent([
    `Nombre: ${fields.get('nombre')}`,
    `Correo electrónico: ${fields.get('email')}`,
    '',
    'Mensaje:',
    fields.get('mensaje')
  ].join('\n'));
  window.location.href = `mailto:Nahirtranfo@outlook.com?subject=${subject}&body=${body}`;
});

const aboutToggle = document.querySelector('.about-toggle');
const aboutSection = document.querySelector('.about');
aboutToggle.addEventListener('click', () => {
  const expanded = aboutToggle.getAttribute('aria-expanded') !== 'true';
  aboutToggle.setAttribute('aria-expanded', String(expanded));
  aboutToggle.setAttribute('aria-label', expanded ? 'Leer menos sobre Nahir' : 'Leer más sobre Nahir');
  aboutSection.classList.toggle('expanded', expanded);
  if (expanded) {
    requestAnimationFrame(() => document.getElementById('story-gallery').dispatchEvent(new Event('scroll')));
  } else if (window.innerWidth <= 900) {
    requestAnimationFrame(() => aboutToggle.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }
});

const floatingWhatsApp = document.querySelector('.whatsapp-float');
const visibleContactSections = new Set();
const contactObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visibleContactSections.add(entry.target);
    else visibleContactSections.delete(entry.target);
  });
  floatingWhatsApp.classList.toggle('is-hidden', visibleContactSections.size > 0);
}, { threshold: 0 });
document.querySelectorAll('.contact, .final-cta').forEach(section => contactObserver.observe(section));

function setupTabs(selector, panelSelector) {
  const tabs = [...document.querySelectorAll(`${selector} [role="tab"]`)];
  const panels = [...document.querySelectorAll(panelSelector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let transitionToken = 0;
  let animations = [];

  function activate(index) {
    tabs.forEach((item, itemIndex) => {
      const selected = itemIndex === index;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      panels[itemIndex].classList.toggle('active', selected);
    });
    panels[index].querySelectorAll('.carousel-track').forEach(track => {
      track.dispatchEvent(new Event('scroll'));
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', async () => {
      const token = ++transitionToken;
      animations.forEach(animation => animation.cancel());
      animations = [];
      const current = panels.find(panel => panel.classList.contains('active'));
      if (current === panels[index]) return;

      if (current && !reducedMotion.matches) {
        const exit = current.animate([
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-6px)' }
        ], { duration: 130, easing: 'ease-in' });
        animations.push(exit);
        try { await exit.finished; } catch { /* A newer tab selection canceled this transition. */ }
      }
      if (token !== transitionToken) return;

      activate(index);
      if (!reducedMotion.matches) {
        animations = [panels[index].animate([
          { opacity: 0, transform: 'translateY(7px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 220, easing: 'ease-out' })];
      }
    });
    tab.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
  });
  tabs.forEach((tab, index) => { tab.tabIndex = index === 0 ? 0 : -1; });
}

setupTabs('.service-tabs', '.service-card');
setupTabs('.price-tabs', '.price-column');

document.querySelectorAll('.faq, .conditions-grid').forEach(group => {
  const details = [...group.querySelectorAll('details')];
  details.forEach(current => current.addEventListener('toggle', () => {
    if (!current.open) return;
    details.forEach(other => {
      if (other !== current) other.open = false;
    });
  }));
});

function getSlideIndex(track) {
  const children = [...track.children];
  if (!children.length || !track.clientWidth) return 0;
  if (track.scrollWidth <= track.clientWidth + 2) return 0;
  if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 3) return children.length - 1;
  const trackLeft = track.getBoundingClientRect().left;
  let bestIndex = 0;
  let bestDistance = Infinity;
  children.forEach((child, index) => {
    const distance = Math.abs(child.getBoundingClientRect().left - trackLeft);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

document.querySelectorAll('.carousel-track').forEach(track => {
  const count = document.querySelector(`[data-carousel-count="${track.id}"]`);
  const prev = document.querySelector(`[data-carousel-prev="${track.id}"]`);
  const next = document.querySelector(`[data-carousel-next="${track.id}"]`);
  const updateCount = () => {
    const index = getSlideIndex(track);
    if (count) count.textContent = `${index + 1} / ${track.children.length}`;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === track.children.length - 1 || track.scrollWidth <= track.clientWidth + 2;
  };
  track.addEventListener('scroll', updateCount, { passive: true });
  window.addEventListener('resize', updateCount);
  ['prev', 'next'].forEach(direction => {
    const button = document.querySelector(`[data-carousel-${direction}="${track.id}"]`);
    if (!button) return;
    button.addEventListener('click', () => {
      const step = direction === 'next' ? 1 : -1;
      const targetIndex = Math.max(0, Math.min(track.children.length - 1, getSlideIndex(track) + step));
      const target = track.children[targetIndex];
      const left = track.scrollLeft + target.getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({ left, behavior: 'smooth' });
    });
  });
  updateCount();
});

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const backgroundElements = [...document.querySelectorAll('.site-header, main, footer, .whatsapp-float')];
let previouslyFocused = null;
let previousOverflow = '';

function closeLightbox() {
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.removeAttribute('src');
  backgroundElements.forEach(element => { element.inert = false; });
  document.body.style.overflow = previousOverflow;
  previouslyFocused?.focus();
}

document.querySelectorAll('.experience-photo').forEach(button => {
  button.addEventListener('click', () => {
    previouslyFocused = button;
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxAlt;
    lightbox.setAttribute('aria-hidden', 'false');
    backgroundElements.forEach(element => { element.inert = true; });
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('.lightbox-close').focus();
  });
});

lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Tab' && lightbox.getAttribute('aria-hidden') === 'false') {
    event.preventDefault();
    lightbox.querySelector('.lightbox-close').focus();
    return;
  }
  if (event.key !== 'Escape') return;
  if (lightbox.getAttribute('aria-hidden') === 'false') closeLightbox();
  else closeMenu();
});
