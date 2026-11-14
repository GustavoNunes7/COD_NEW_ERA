/* ==========================================================================
   COD New Era — comportamento do site (vanilla JS, sem dependências)
   Módulos: loader · header/menu · scroll (progresso, parallax, reveal, destaque)
            cursor · magnético · tilt · hero 3D (lazy) · contato · perfis
   ========================================================================== */
(function () {
  "use strict";
  window.__cod = true;

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Loader ---------------------------------------------------- */
  var loader = $("#loader");
  var seen = doc.classList.contains("seen") || reduced;

  function finishLoading() {
    if (doc.classList.contains("is-loaded")) return;
    doc.classList.add("is-loaded");
    if (loader) {
      loader.classList.add("out");
      setTimeout(function () { loader.style.display = "none"; }, 1000);
    }
    try { sessionStorage.setItem("cod-seen", "1"); } catch (e) {}
  }

  (function runLoader() {
    if (!loader || seen) { finishLoading(); return; }
    var bar = $("#loaderBar"), num = $("#loaderNum");
    var t0 = performance.now(), MIN = 1100, ready = false;
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var pageReady = new Promise(function (r) {
      if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true });
    });
    Promise.all([fontsReady, pageReady]).then(function () { ready = true; });
    setTimeout(function () { ready = true; }, 3000); // failsafe

    (function tick(now) {
      var p = clamp((now - t0) / MIN, 0, 1);
      var shown = ready ? p : Math.min(p, 0.9);
      var eased = 1 - Math.pow(1 - shown, 3);
      if (bar) bar.style.transform = "scaleX(" + eased + ")";
      if (num) num.textContent = ("00" + Math.round(eased * 100)).slice(-3);
      if (ready && p >= 1) { setTimeout(finishLoading, 150); return; }
      requestAnimationFrame(tick);
    })(t0);
  })();

  /* ---------- Header + menu mobile ------------------------------------- */
  var header = $("#header"), burger = $("#burger"), menu = $("#menu");
  var lastY = window.scrollY;

  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("is-locked", open);
    if (header) header.classList.remove("is-hidden");
    if (open) { var first = $("a", menu); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }
  }
  if (burger) {
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) setMenu(false); });
    // não deixa o foco escapar para o conteúdo por trás do menu
    if (menu) menu.setAttribute("aria-hidden", "true");
  }

  /* ---------- Links ativos --------------------------------------------- */
  var navLinks = $$(".nav a[data-nav]");
  var sections = $$("[data-section]");
  if (navLinks.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle("is-active", l.dataset.nav === en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Reveal ---------------------------------------------------- */
  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Destaque palavra a palavra (statement) -------------------- */
  var statement = $("#statement");
  var words = [];
  if (statement) {
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) split(n);
      });
    })(statement);
    words = $$(".w", statement);
  }

  /* ---------- Scroll loop (progresso, parallax, destaque, header, 3D) ---- */
  var progress = $("#progress");
  var parallaxEls = $$("[data-parallax]");
  var hero = $("#home");
  var hero3d = null;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight;
    var max = Math.max(1, doc.scrollHeight - vh);
    if (progress) progress.style.transform = "scaleX(" + clamp(y / max, 0, 1) + ")";

    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var menuOpen = menu && menu.classList.contains("is-open");
      var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (!menuOpen) {
        if (goingDown && y > vh * 0.6) header.classList.add("is-hidden");
        else if (goingUp || y < 80) header.classList.remove("is-hidden");
      }
      if (goingDown || goingUp) lastY = y;
    }

    if (!reduced) {
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var c = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax || "0.1");
        el.style.transform = "translate3d(0," + c.toFixed(1) + "px,0)";
      });
    }

    if (words.length) {
      var rect = statement.getBoundingClientRect();
      var start = vh * 0.85, end = vh * 0.3;
      var p = clamp((start - rect.top) / (start - end + rect.height * 0.6), 0, 1);
      var upto = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < upto);
    }

    if (hero3d && hero) {
      hero3d.setScroll(clamp(y / (hero.offsetHeight || 1), 0, 1));
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Cursor personalizado ------------------------------------- */
  var cursor = $("#cursor");
  if (cursor && finePointer && !reduced) {
    doc.classList.add("has-cursor");
    var cx = 0, cy = 0, tx = 0, ty = 0, started = false;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) { cx = tx; cy = ty; started = true; cursor.classList.add("on"); }
    }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("on"); });
    document.addEventListener("pointerenter", function () { if (started) cursor.classList.add("on"); });
    window.addEventListener("pointerdown", function () { cursor.classList.add("down"); });
    window.addEventListener("pointerup", function () { cursor.classList.remove("down"); });
    document.addEventListener("pointerover", function (e) {
      cursor.classList.toggle("hover", !!(e.target.closest && e.target.closest("a, button, input, textarea, [data-tilt]")));
    });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Botões magnéticos ---------------------------------------- */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });

    /* ---------- Tilt nos cards do time -------------------------------- */
    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateY(" + (px * 8).toFixed(2) + "deg) rotateX(" + (-py * 8).toFixed(2) + "deg) translateZ(0)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Hero 3D (carregamento tardio, com fallback leve) ---------- */
  function webglOK() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }
  var canvas = $("#heroCanvas");
  var saveData = navigator.connection && navigator.connection.saveData;
  if (canvas && hero && !reduced && !saveData && webglOK()) {
    var lite = window.innerWidth < 760 || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    var loadHero = function () {
      var s = document.createElement("script");
      s.src = "./js/hero3d.js";
      s.onload = function () {
        try {
          hero3d = window.CODHero && window.CODHero.init(canvas, { lite: lite, reduced: reduced });
          if (hero3d) hero.classList.add("has-3d"), doc.classList.add("has-3d");
        } catch (e) { hero3d = null; }
      };
      document.head.appendChild(s);
    };
    var go = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(loadHero, { timeout: 1500 }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
  }

  /* ---------- Contato: copiar e-mail ----------------------------------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.dataset.copy;
      var done = function () {
        btn.classList.add("is-done");
        setTimeout(function () { btn.classList.remove("is-done"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
      function fallback() {
        var t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", "");
        t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(t);
      }
    });
  });

  /* ---------- Contato: formulário (abre o app de e-mail, com estados) ---- */
  var form = $("#contactForm");
  if (form) {
    var btn = $("#formBtn"), status = $("#formStatus");
    var TO = "codtech@email.com";
    var rules = {
      nome: function (v) { return v.trim().length >= 2 ? "" : "Informe seu nome."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."; },
      mensagem: function (v) { return v.trim().length >= 10 ? "" : "Escreva pelo menos 10 caracteres."; }
    };
    function check(input) {
      var msg = rules[input.name](input.value);
      var f = input.closest(".field");
      f.classList.toggle("is-invalid", !!msg);
      $(".field__err", f).textContent = msg;
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }
    $$("input, textarea", form).forEach(function (i) {
      i.addEventListener("blur", function () { if (i.value) check(i); });
      i.addEventListener("input", function () { if (i.closest(".field").classList.contains("is-invalid")) check(i); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form__status"; status.textContent = "";
      var inputs = $$("input, textarea", form);
      var ok = inputs.map(check).every(Boolean);
      if (!ok) {
        status.classList.add("is-err"); status.textContent = "Revise os campos destacados.";
        var bad = inputs.filter(function (i) { return i.getAttribute("aria-invalid") === "true"; })[0];
        if (bad) bad.focus();
        return;
      }
      btn.classList.add("is-busy");
      var d = {}; inputs.forEach(function (i) { d[i.name] = i.value.trim(); });
      var subject = "Contato pelo site — " + d.nome;
      var body = d.mensagem + "\n\n— " + d.nome + " (" + d.email + ")";
      var href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      setTimeout(function () {
        btn.classList.remove("is-busy"); btn.classList.add("is-ok");
        status.classList.add("is-ok");
        status.textContent = "Abrimos seu app de e-mail com a mensagem pronta. Se nada abriu, copie o endereço " + TO + ".";
        window.location.href = href;
        setTimeout(function () { btn.classList.remove("is-ok"); }, 3500);
      }, 700);
    });
  }
})();
