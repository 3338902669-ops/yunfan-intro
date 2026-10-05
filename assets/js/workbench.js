/* 投递工作台 W3 · 工作台外壳（页面区块导航 / 侧栏 / 状态栏 / 网格开关）
 * 职责：只做外壳交互，不碰 hero.js 的入场时间线与 sections.js 的揭示/点选
 * 约束：零外链、零依赖；prefers-reduced-motion 下用即时跳转（不用平滑滚动）
 */
(function () {
  'use strict';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $(id) { return document.getElementById(id); }
  function q(sel, root) { return (root || document).querySelectorAll(sel); }

  var NAMES = { top: '总览', m1: 'M1 · 三条承诺', m2: 'M2 · 能力看板', m3: 'M3 · 价格与红线', m4: 'M4 · 收尾' };
  var ORDER = ['top', 'm1', 'm2', 'm3', 'm4'];

  function chromeOffset() {
    var css = getComputedStyle(document.documentElement);
    var v = function (n, d) { var x = parseFloat(css.getPropertyValue(n)); return isNaN(x) ? d : x; };
    return v('--wb-menu', 30) + v('--wb-bar', 52) + v('--wb-tabs', 38) + 8;
  }

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - chromeOffset());
    try { window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' }); }
    catch (e) { window.scrollTo(0, y); }
  }

  function nav() {
    var btns = [].slice.call(q('[data-nav]'));
    if (!btns.length) return;
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { goTo(b.getAttribute('data-nav')); setActive(b.getAttribute('data-nav')); });
      })(btns[i]);
    }

    function setActive(id) {
      for (var k = 0; k < btns.length; k++) {
        var on = btns[k].getAttribute('data-nav') === id;
        btns[k].classList.toggle('is-active', on);
        btns[k].classList.toggle('is-on', on);
        if (on) btns[k].setAttribute('aria-current', 'true'); else btns[k].removeAttribute('aria-current');
      }
      var crumb = $('crumbSec'), st = $('stSec');
      if (crumb) crumb.textContent = NAMES[id] || id;
      if (st) st.textContent = NAMES[id] || id;
      /* 窄屏下页签条可横向滚动：把当前页签滚到可见区（仅横向，不影响页面纵向位置） */
      for (var q2 = 0; q2 < btns.length; q2++) {
        if (btns[q2].getAttribute('data-nav') !== id) continue;
        var strip = btns[q2].closest ? btns[q2].closest('.wb-tabs') : null;
        if (!strip || strip.scrollWidth <= strip.clientWidth + 1) break;
        var target = btns[q2].offsetLeft - (strip.clientWidth - btns[q2].offsetWidth) / 2;
        target = Math.max(0, Math.min(target, strip.scrollWidth - strip.clientWidth));
        try { strip.scrollTo({ left: target, behavior: REDUCED ? 'auto' : 'smooth' }); }
        catch (e) { strip.scrollLeft = target; }
        break;
      }
    }

    /* 滚动定位当前区块（抓取各锚点的 offsetTop，视口变化时重算） */
    var marks = [];
    function measure() {
      marks = [];
      for (var i = 0; i < ORDER.length; i++) {
        var el = document.getElementById(ORDER[i]);
        if (el) marks.push({ id: ORDER[i], top: el.getBoundingClientRect().top + window.pageYOffset });
      }
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        /* 底部特判：末尾一幕的页面顶点比最大滚动距还大，
        不加这条就永远点不亮 M4（实测：390 滚到底仍显示 M3） */
        var atBottom = (window.pageYOffset + window.innerHeight) >= (document.documentElement.scrollHeight - 2);
        if (atBottom) { setActive(ORDER[ORDER.length - 1]); return; }
        var y = window.pageYOffset + chromeOffset() + 24, cur = ORDER[0];
        for (var i = 0; i < marks.length; i++) if (marks[i].top <= y) cur = marks[i].id;
        setActive(cur);
      });
    }
    measure(); onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); onScroll(); }, { passive: true });
  }

  function gridToggle() {
    var b = $('gridBtn');
    if (!b) return;
    b.addEventListener('click', function () {
      var off = document.body.classList.toggle('no-grid');
      b.setAttribute('aria-pressed', off ? 'false' : 'true');
    });
  }

  function panelToggle() {
    var b = $('panelBtn'), side = $('wbSide');
    if (!b || !side) return;
    b.addEventListener('click', function () {
      var hidden = side.hasAttribute('hidden');
      if (hidden) { side.removeAttribute('hidden'); side.classList.add('is-open'); b.setAttribute('aria-pressed', 'true'); }
      else { side.setAttribute('hidden', ''); side.classList.remove('is-open'); b.setAttribute('aria-pressed', 'false'); }
    });
  }

  function howDialog() {
    var b = $('menuHowBtn'), dlg = $('howDlg');
    if (!b || !dlg) return;
    b.addEventListener('click', function () {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
  }

  function status() {
    var stW = $('stW'), stClock = $('stClock'), stFields = $('stFields'), stCells = $('stCells'), sideVp = $('sideViewport');
    function size() {
      var s = window.innerWidth + '×' + window.innerHeight;
      if (stW) stW.textContent = s;
      if (sideVp) sideVp.textContent = s;
    }
    function clock() {
      if (!stClock) return;
      var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
      stClock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    size(); clock();
    window.addEventListener('resize', size, { passive: true });
    setInterval(clock, 1000);

    /* 表单字段点亮数：观察 class 变化（hero.js 用的是 .is-on 类切换） */
    var fields = q('.field');
    function countFields() {
      if (!stFields) return;
      var on = 0;
      for (var i = 0; i < fields.length; i++) if (fields[i].classList.contains('is-on')) on++;
      stFields.textContent = on + '/' + fields.length;
    }
    if (fields.length && stFields) {
      countFields();
      if (typeof MutationObserver === 'function') {
        var mo = new MutationObserver(countFields);
        for (var j = 0; j < fields.length; j++) mo.observe(fields[j], { attributes: true, attributeFilter: ['class'] });
      }
    }

    /* Bento 面板选择：状态栏跟随 */
    var cells = q('.cell');
    for (var k = 0; k < cells.length; k++) {
      (function (c) {
        c.addEventListener('click', function () {
          if (!stCells) return;
          var h = c.querySelector('h3');
          stCells.textContent = h ? String(h.textContent).split('·')[0].trim() : '已选择';
        });
      })(cells[k]);
    }
  }

  /* 621–1080：侧栏被 CSS 默认隐藏，但按钮仍在；把初始状态同步为「已收起」，
     否则第一次点击是死点击（实测 768 下点一次什么都不发生） */
  function syncPanel() {
    var side = $('wbSide'), b = $('panelBtn');
    if (!side) return;
    if (window.innerWidth <= 1080) {
      side.setAttribute('hidden', ''); side.classList.remove('is-open');
      if (b) b.setAttribute('aria-pressed', 'false');
    }
  }
  var _lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    var w = window.innerWidth, crossed = (w <= 1080) !== (_lastW <= 1080);
    _lastW = w;
    if (crossed) syncPanel();
  }, { passive: true });

  function boot() { nav(); gridToggle(); panelToggle(); howDialog(); status(); syncPanel(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
