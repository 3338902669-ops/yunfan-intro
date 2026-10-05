/* 投递工作台 W3 · 首屏颗粒场（零外链 / 零依赖 / 无第三方素材）
 * 定位：共享锚点「秩序光流」的空间底噪—不是装饰星空，是「信息在汇聚」的场。
 * 依据 PARTICLE-BUILD-METHOD.md：桌面/手机两档预算、dpr 上限、reduced-motion 只渲染一帧、
 * 页面不可见时暂停、webglcontextlost 兜底、只动 transform/opacity（本场在 canvas 内自绘，不触发布局）。
 */
(function () {
  'use strict';

  var canvas = document.getElementById('field');
  if (!canvas) return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BUDGET = { desktop: 820, mobile: 320 };
  function pickBudget() {
    var w = window.innerWidth || 1440;
    var cores = navigator.hardwareConcurrency || 4;
    if (w < 760 || cores <= 4) return BUDGET.mobile;
    return BUDGET.desktop;
  }

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, ctx = null, parts = [], raf = 0, running = false, built = false;
  var PALETTE = ['#0D7A62', '#1D4ED8', '#5B7FA6', '#4F9A80'];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function seed() {
    var n = pickBudget();
    parts = new Array(n);
    for (var i = 0; i < n; i++) {
      var lane = (i % 14) / 14;                       // 纵向 14 条泳道，形成秩序感
      parts[i] = {
        x: rnd(0, W), y: rnd(0, H),
        r: rnd(0.5, 1.9),
        vx: rnd(-0.055, 0.055),
        vy: rnd(0.035, 0.17),                         // 缓慢上浮：与「字段被点亮」同向
        ph: rnd(0, Math.PI * 2),
        sp: rnd(0.014, 0.036),
        c: PALETTE[(i + Math.floor(lane * 14)) % PALETTE.length],
        a: rnd(0.07, 0.24)
      };
    }
    built = true;
  }

  function paintFrame(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var tw = 0.62 + 0.38 * Math.sin(p.ph + t * p.sp);   // 呼吸，周期约 6-15s 档
      ctx.globalAlpha = Math.max(0, Math.min(0.85, p.a * tw));
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.283185307179586);
      ctx.fill();

      if (!REDUCED) {
        p.x += p.vx + Math.sin((p.y + t * 22) * 0.0032) * 0.06;   // 横向漂移，形成缓流
        p.y -= p.vy;
        if (p.y < -8) { p.y = H + 6; p.x = rnd(0, W); }
        if (p.x < -8) p.x = W + 6;
        if (p.x > W + 8) p.x = -6;
      }
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    W = Math.max(1, Math.floor(window.innerWidth));
    H = Math.max(1, Math.floor(window.innerHeight));
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx = canvas.getContext('2d');
    if (ctx && ctx.setTransform) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!built) seed(); else { for (var i = 0; i < parts.length; i++) { if (parts[i].x > W) parts[i].x = rnd(0, W); if (parts[i].y > H) parts[i].y = rnd(0, H); } }
  }

  function loop(now) {
    if (!running) return;
    paintFrame((now || 0) / 1000);
    raf = window.requestAnimationFrame(loop);
  }
  function start() { if (running || REDUCED) return; running = true; raf = window.requestAnimationFrame(loop); }
  function stop() { running = false; if (raf) window.cancelAnimationFrame(raf); raf = 0; }

  try {
    resize();
  } catch (e) {
    document.body.classList.add('no-webgl');
    return;
  }
  if (!ctx) { document.body.classList.add('no-webgl'); return; }

  paintFrame(0);                       // 先出一帧，避免空白
  if (REDUCED) { return; }             // 减动效：只留这一帧静态图
  start();

  var rt = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(rt);
    rt = window.setTimeout(function () { resize(); paintFrame(0); if (!REDUCED) start(); }, 160);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); }, false);
})();