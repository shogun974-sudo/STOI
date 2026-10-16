/* STOI · interactions légères, sans dépendance */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation : fond au défilement, menu mobile, lien actif ---------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  function onScrollNav() { nav.classList.toggle('is-solid', window.scrollY > 40); }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  toggle.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('.nav__menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  var links = {};
  nav.querySelectorAll('.nav__menu a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });

  /* ---------- Photos : chaque emplacement charge images/<nom>.jpg s'il existe ---------- */
  if (!window.STOI_NO_PHOTOS) {
    document.querySelectorAll('[data-photo]').forEach(function (el) {
      // adresse absolue : une url() relative dans une variable CSS serait lue depuis css/
      var src = new URL(el.getAttribute('data-photo'), document.baseURI).href;
      var img = new Image();
      img.onload = function () {
        if (el.classList.contains('portrait')) el.style.setProperty('--ph', 'url("' + src + '")');
        else el.style.backgroundImage = 'url("' + src + '")';
        el.classList.add('has-photo');
      };
      img.src = src;
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var reveals = document.querySelectorAll('.reveal, .univers__media');
  if ('IntersectionObserver' in window && !reduce) {
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('is-pending'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      // seuls les éléments sous la ligne de flottaison attendent : la première vue reste complète
      if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('is-pending'); io.observe(el); }
    });
  }

  /* ---------- Section active dans le menu ---------- */
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = links[e.target.id];
        if (a && e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
          a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Parallaxe des grandes images ---------- */
  if (!reduce) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-depth]'));
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var d = parseFloat(el.getAttribute('data-depth')) || 0.2;
        var offset = (r.top + r.height / 2 - vh / 2) * -d;
        var max = r.height * 0.16;
        offset = Math.max(-max, Math.min(max, offset));
        el.style.setProperty('--py', offset.toFixed(1));
      });
      ticking = false;
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    update();
  }

  /* ---------- Boutons « Copier » ---------- */
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done() {
        btn.textContent = 'Copié';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = 'Copier'; btn.classList.remove('is-done'); }, 1800);
      }
      function fallback() {
        var value = btn.parentNode.querySelector('.channel__value');
        var range = document.createRange();
        range.selectNodeContents(value);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        btn.textContent = 'Sélectionné';
        setTimeout(function () { btn.textContent = 'Copier'; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });
  });
})();
