// Computer Networks notes — small helpers. Pages stay readable if this file fails to load.
(function () {
  var root = document.documentElement;
  var page = (location.pathname.split('/').pop() || 'index.html');

  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  // ----- light / dark -----
  var themeBtn = document.getElementById('theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = dark ? 'light' : 'dark';
      root.dataset.theme = next;
      store('cn-theme', next);
    });
  }

  // ----- current page in the top bar -----
  document.querySelectorAll('.pages a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });

  // ----- ids for headings that have none -----
  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  }
  var seen = {};
  document.querySelectorAll('main h3').forEach(function (h) {
    if (!h.id) {
      var sec = h.closest('section[id]');
      var id = (sec ? sec.id + '-' : '') + slug(h.textContent);
      while (seen[id] || document.getElementById(id)) id += '-x';
      h.id = id;
    }
    seen[h.id] = true;
  });

  // ----- "mark as revised" per lecture -----
  var tocLinks = {};
  document.querySelectorAll('section.lec[id]').forEach(function (sec) {
    var tags = sec.querySelector('.tags');
    if (!tags) return;
    var key = 'cn-done:' + page + '#' + sec.id;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'done-btn';
    function paint() {
      var on = store(key) === '1';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? '✓ Revised' : 'Mark as revised';
      if (tocLinks[sec.id]) tocLinks[sec.id].classList.toggle('done', on);
    }
    btn.addEventListener('click', function () {
      store(key, store(key) === '1' ? null : '1');
      paint();
    });
    tags.appendChild(btn);
    sec._paint = paint;
  });

  // ----- sidebar table of contents -----
  var toc = document.getElementById('toc');
  var heads = [];
  if (toc) {
    var label = document.createElement('p');
    label.textContent = 'On this page';
    toc.appendChild(label);
    document.querySelectorAll('main section[id] > h2, main section[id] h2, main h3').forEach(function (h) {
      var isH2 = h.tagName === 'H2';
      var target = isH2 ? h.closest('section[id]') : h;
      if (!target || !target.id) return;
      if (heads.some(function (x) { return x.el === target; })) return;
      var a = document.createElement('a');
      a.href = '#' + target.id;
      a.className = isH2 ? 'h2' : 'h3';
      var label2 = h.cloneNode(true);
      label2.querySelectorAll('a').forEach(function (x) { x.remove(); });
      a.textContent = label2.textContent.trim();
      toc.appendChild(a);
      heads.push({ el: target, a: a });
      if (isH2) tocLinks[target.id] = a;
    });
    var ticking = false;
    function spy() {
      ticking = false;
      var cur = null;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].el.getBoundingClientRect().top <= 110) cur = heads[i]; else break;
      }
      heads.forEach(function (x) { x.a.classList.toggle('on', x === cur); });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }, { passive: true });
    spy();
  }
  document.querySelectorAll('section.lec[id]').forEach(function (sec) { if (sec._paint) sec._paint(); });

  // ----- home page: tick the lectures already revised -----
  document.querySelectorAll('[data-lec]').forEach(function (a) {
    if (store('cn-done:' + a.getAttribute('data-lec')) === '1') {
      var li = a.closest('li');
      if (li) li.classList.add('done');
    }
  });

  // ----- IP address bit strips: <div class="bits" data-ip="192.168.1.10" data-n="24" data-s="2"> -----
  document.querySelectorAll('.bits[data-ip]').forEach(function (box) {
    var octs = box.getAttribute('data-ip').split('.').map(Number);
    var n = +box.getAttribute('data-n');
    var s = +(box.getAttribute('data-s') || 0);
    if (octs.length !== 4 || octs.some(isNaN)) return;
    box.textContent = '';
    octs.forEach(function (o, k) {
      var oct = document.createElement('div');
      oct.className = 'oct';
      var row = document.createElement('div');
      var b = ('00000000' + o.toString(2)).slice(-8);
      for (var j = 0; j < 8; j++) {
        var pos = k * 8 + j;
        var cell = document.createElement('i');
        cell.className = pos < n ? 'n' : (pos < n + s ? 's' : 'h');
        cell.textContent = b[j];
        row.appendChild(cell);
      }
      var lab = document.createElement('small');
      lab.textContent = o;
      oct.appendChild(row);
      oct.appendChild(lab);
      box.appendChild(oct);
    });
  });

  // ----- video links -----
  var vids = window.CN_VIDEOS || {};
  document.querySelectorAll('.watch[data-topics]').forEach(function (box) {
    var first = box.firstChild;
    var used = {};
    box.getAttribute('data-topics').split(/\s+/).forEach(function (t) {
      (vids[t] || []).forEach(function (v) {
        if (used[v.url]) return;
        used[v.url] = true;
        var a = document.createElement('a');
        a.href = v.url; a.target = '_blank'; a.rel = 'noopener';
        a.appendChild(document.createTextNode(v.title + ' '));
        var s = document.createElement('small');
        s.textContent = '— ' + v.channel;
        a.appendChild(s);
        box.insertBefore(a, first);
      });
    });
  });
  document.querySelectorAll('.watch a').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
})();
