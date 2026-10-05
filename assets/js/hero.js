/* 投递工作台 W3 · 首屏编排（GSAP，本地 assets零外链 / 零 CDN）
 * 契约：design/动效叙事契约.md §5 tlHero
 *   0.00-0.35s 标题遮罩揭示 | 0.30-0.90s 表单卡落位
 *   0.60-1.70s 9 行字段依次点亮（stagger 90ms）| 1.10-1.90s 计数器 0 -> 9
 *   1.80-2.30s 光流收束 + CTA 上浮                    合计 2.30s（<= 2.3s 上限）
 * 降级：prefers-reduced-motion 直接跳终态；GSAP 缺失或加载失败时同样跳终态（无孤立的中间态）。
 * 说明：ScrollTrigger 本轮未加载（M0 不依赖滚动）；assets/js/ScrollTrigger.min.js 已就位待 M1-M4 使用。
 */
(function () {
  'use strict';

  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.gsap.timeline === 'function';

  function fields() {
    var out = [];
    var list = document.querySelectorAll('.field');
    for (var i = 0; i < list.length; i++) out.push(list[i]);
    return out;
  }

  /* 静态终态：所有字段点亮、计数器到 9、光流走完 */
  function staticFinal() {
    var fs = fields();
    for (var i = 0; i < fs.length; i++) fs[i].classList.add('is-on');
    var el = document.getElementById('statFilled');
    if (el) el.textContent = String(fs.length);
    var sb = document.getElementById('statSubmit');
    if (sb) sb.textContent = '0';
    var beam = document.querySelector('.flow-beam');
    if (beam) beam.style.strokeDashoffset = '0';
    document.documentElement.setAttribute('data-hero', 'static');
  }

  /* 对话框：原生 <dialog>，键盘可达 + ESC 关闭 */
  function wireDialogs() {
    var dlg = document.getElementById('howDlg');
    if (!dlg) return;
    var openers = [document.getElementById('howBtn'), document.getElementById('heroHowBtn')];
    for (var i = 0; i < openers.length; i++) {
      (function (b) {
        if (!b) return;
        b.addEventListener('click', function () {
          if (typeof dlg.showModal === 'function') dlg.showModal();
          else dlg.setAttribute('open', '');
        });
      })(openers[i]);
    }
  }

  function playHero() {
    var g = window.gsap;
    var fs = fields();
    var tl = g.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.line-in', { yPercent: 112, opacity: 0, duration: 0.5, stagger: 0.09 }, 0.0);
    tl.from('.apply-card', { y: 42, scale: 0.965, opacity: 0, duration: 0.6 }, 0.30);
    tl.from('.hero-sub', { y: 16, opacity: 0, duration: 0.45 }, 0.42);
    tl.fromTo('.flow-beam',
      { strokeDashoffset: 900 },
      { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut' }, 0.55);

    /* 字段点亮：类切换由 CSS 过渡承载（不逐帧改内联样式） */
    for (var i = 0; i < fs.length; i++) {
      (function (f, idx) {
        tl.add(function () { f.classList.add('is-on'); }, 0.60 + idx * 0.09);
      })(fs[i], i);
    }

    var counter = { v: 0 };
    var el = document.getElementById('statFilled');
    tl.to(counter, {
      v: fs.length, duration: 0.8, ease: 'power2.out',
      onUpdate: function () { if (el) el.textContent = String(Math.round(counter.v)); },
      onComplete: function () { if (el) el.textContent = String(fs.length); }
    }, 1.10);

    tl.from('.cta-row .btn', { y: 14, opacity: 0, duration: 0.42, stagger: 0.08 }, 1.80);
    tl.from('.promises li', { y: 12, opacity: 0, duration: 0.4, stagger: 0.07 }, 1.86);
    tl.from('.stage-note', { opacity: 0, duration: 0.4 }, 2.00);

    document.documentElement.setAttribute('data-hero', 'played');
    return tl;
  }

  /* 指针视差：±10px，仅精确指针设备；触控与减动效关闭 */
  function playParallax() {
    var g = window.gsap;
    var card = document.getElementById('applyCard');
    if (!card || !g || typeof g.quickTo !== 'function') return;
    if (!(window.matchMedia && window.matchMedia('(pointer: fine)').matches)) return;
    var qx = g.quickTo(card, 'x', { duration: 0.55, ease: 'power2.out' });
    var qy = g.quickTo(card, 'y', { duration: 0.55, ease: 'power2.out' });
    window.addEventListener('pointermove', function (e) {
      var w = window.innerWidth || 1440, h = window.innerHeight || 900;
      qx((e.clientX / w - 0.5) * 20);
      qy((e.clientY / h - 0.5) * 14);
    }, { passive: true });
  }

  function boot() {
    wireDialogs();
    if (!hasGsap || REDUCED) { staticFinal(); return; }
    document.documentElement.setAttribute('data-hero', 'ready');
    playHero();
    playParallax();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();