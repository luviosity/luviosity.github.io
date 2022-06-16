'use strict';

const modal = document.querySelector('.modal');
const overlay = document.querySelector('.overlay');
const btnCloseModal = document.querySelector('.btn--close-modal');
const btnsOpenModal = document.querySelectorAll('.btn--show-modal');
const btnScrollTo = document.querySelector('.btn--scroll-to');
const section1 = document.querySelector('#section--1');
const navLinks = document.querySelector('.nav__links');
const tabs = document.querySelectorAll('.operations__tab');
const tabsContainer = document.querySelector('.operations__tab-container');
const tabsContent = document.querySelectorAll('.operations__content');
const nav = document.querySelector('.nav');
const header = document.querySelector('.header');
const headerTitle = document.querySelector('.header__title');
const sections = document.querySelectorAll('.section');
// 'data-src' is a parameter of needed img classes
const imgs = document.querySelectorAll('img[data-src]');

///////////////////////////////////////
// Modal window
const openModal = function (e) {
  e.preventDefault();
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

const closeModal = function () {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
};

btnsOpenModal.forEach(btn => btn.addEventListener('click', openModal));

btnCloseModal.addEventListener('click', closeModal);
overlay.addEventListener('click', closeModal);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// Force a Page Scroll Position to the Top at Page Refresh
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

// BUTTON SCROLLING
btnScrollTo.addEventListener('click', function () {
  // Modern way. Only for new browsers
  section1.scrollIntoView({ behavior: 'smooth' });
});

// Page navigation
navLinks.addEventListener('click', function (e) {
  // exclude immediate and automatic scroll
  e.preventDefault();

  // only clicks by elements with nav__link class are needed
  if (
    e.target.classList.contains('nav__link') &&
    !e.target.classList.contains('nav__link--btn')
  ) {
    // getAttribute because we don't need the absolute link like https://127.0.0.1/#section--1
    const el = document.querySelector(e.target.getAttribute('href'));
    el.scrollIntoView({ behavior: 'smooth' });
  }
});

// Hover nav bar
const hoverNav = function (e) {
  const hov = e.target;
  if (!hov.classList.contains('nav__link')) return;
  const siblings = navLinks.querySelectorAll('.nav__link:not(.nav__link--btn)');
  siblings.forEach(s => {
    if (s !== hov) s.style.opacity = this;
  });
};

navLinks.addEventListener('mouseover', hoverNav.bind(0.5));
navLinks.addEventListener('mouseout', hoverNav.bind(1));

// Sticky navigation
const navHeight = nav.getBoundingClientRect().height;

// Intersaction Observer API
const obsFunc = function (entries) {
  const [entry] = entries;
  if (entry.isIntersecting) nav.classList.remove('sticky');
  else nav.classList.add('sticky');
};
const obsOpt = {
  root: null,
  threshold: 0,
  rootMargin: `-${navHeight}px`,
};

const navObs = new IntersectionObserver(obsFunc, obsOpt);
navObs.observe(header);

// Tabbed component
tabsContainer.addEventListener('click', function (e) {
  // There is also <span> element within the tab elements.
  // Since we have to define excatly a button click, we need to find the closest element to the <span> element which contains operations__tab (class which exists in all our tabs)
  const clicked = e.target.closest('.operations__tab');
  // Guard clause
  if (!clicked) return;

  // Remove active classes
  tabs.forEach(t => t.classList.remove('operations__tab--active'));
  tabsContent.forEach(c => c.classList.remove('operations__content--active'));

  // Activate tab
  clicked.classList.add('operations__tab--active');

  // Activate content area
  document
    .querySelector(`.operations__content--${clicked.dataset.tab}`)
    .classList.add('operations__content--active');
});

// Reveal sections
const secObs = new IntersectionObserver(
  function (entries, observer) {
    const [entry] = entries;
    if (!entry.isIntersecting) return;
    entry.target.classList.remove('section--hidden');
    // End of observing elements because we've already done what we wanted
    observer.unobserve(entry.target);
  },
  {
    root: null,
    threshold: 0.15, // 15%
  }
);
sections.forEach(s => {
  s.classList.add('section--hidden');
  secObs.observe(s);
});

// Lazy loading images
const imgObs = new IntersectionObserver(
  function (entries, observer) {
    const [entry] = entries;
    if (!entry.isIntersecting) return;
    entry.target.setAttribute('src', entry.target.dataset.src);
    entry.target.addEventListener('load', () =>
      entry.target.classList.remove('lazy-img')
    );
    observer.unobserve(entry.target);
  },
  {
    root: null,
    threshold: 0,
    rootMargin: '200px',
  }
);

imgs.forEach(i => imgObs.observe(i));

// Slider
const slides = document.querySelectorAll('.slide');
const slider = document.querySelector('.slider');
const btnLeft = document.querySelector('.slider__btn--left');
const btnRight = document.querySelector('.slider__btn--right');
const dots = document.querySelector('.dots');

let curSlide = 0;
const cntSlides = slides.length - 1;

const goToSlide = function (slide) {
  slides.forEach(
    (s, i) => (s.style.transform = `translateX(${100 * (i - slide)}%)`)
  );
};

const nextSlide = function () {
  if (curSlide === cntSlides) curSlide = 0;
  else curSlide++;

  goToSlide(curSlide);
  activateDot(curSlide);
};

const prevSlide = function () {
  if (curSlide === 0) curSlide = cntSlides;
  else curSlide--;

  goToSlide(curSlide);
  activateDot(curSlide);
};

// Add slider dots
const createDots = function () {
  slides.forEach((_, i) =>
    dots.insertAdjacentHTML(
      'beforeend',
      `<button class="dots__dot" data-slide="${i}"></button>`
    )
  );
};

const activateDot = function (slide) {
  document
    .querySelectorAll('.dots__dot')
    .forEach(d => d.classList.remove('dots__dot--active'));
  document
    .querySelector(`.dots__dot[data-slide="${slide}"]`)
    .classList.add('dots__dot--active');
};

// initial function to setup initial values
const init = function () {
  goToSlide(0);
  createDots();
  activateDot(0);
};

init();

// Events handlers
btnRight.addEventListener('click', nextSlide);
btnLeft.addEventListener('click', prevSlide);

dots.addEventListener('click', function (e) {
  if (!e.target.classList.contains('dots__dot')) return;
  curSlide = Number(e.target.dataset.slide);
  activateDot(curSlide);
  goToSlide(curSlide);
});

window.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') prevSlide();
  e.key === 'ArrowRight' && nextSlide();
});
