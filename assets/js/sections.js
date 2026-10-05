/* 投递工作台 W3 · M1-M4 交互与揭示（零外链 / 零依赖；GSAP 有则用，无则退化为静态终态）
 * 职责：
 *   1) 滚动揭示：.rv 元素进入视口 → .is-in（IntersectionObserver，一次性）
 *   2) 光流轨道：每幕 .sec-rail i 按滚动进度 scaleY 展开；若 GSAP+ScrollTrigger 可用则 scrub 跟随，否则进入视口即展开到位
 *   3) M2 Bento 点选：选中格放大/高亮、其余降饱和；下方面板显示该格实测状态与复现判据
 *   4) M3 价格数字：数字滚动到定值（只用 transform/文本，不触发 layout）
 *   5) M4 光流收束：光束长度 + 节点缩放，进入视口时播放一次
 *   6) wire dialog：隐私政策（草稿）
 * 降级：prefers-reduced-motion → 全部终态、不播放；GSAP 缺失 → 轨道与收束按 CSS 终态。
 */
(function () {
  'use strict';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.gsap.timeline === 'function';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST && window.gsap.registerPlugin) { try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) {} }

  /* ---------- 1) 揭示 ---------- */
  function reveal() {
    var els = document.querySelectorAll('.rv');
    if (REDUCED || !('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      for (var k = 0; k < ents.length; k++) {
        if (ents[k].isIntersecting) { ents[k].target.classList.add('is-in'); io.unobserve(ents[k].target); }
      }
    }, { rootMargin: '0px 0px -14% 0px', threshold: 0.12 });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  /* ---------- 2) 光流轨道 + 幕头点亮（CSS 驱动，不依赖 ScrollTrigger） ----------
   * 轨道填充用类切换 + CSS transition 完成：进入视口即 fill()，随后一次性 off。
   * 不用 scrub 跟随的理由：本页其它区块（M1-M4 揭示、M2 点选、M3 数字）都是事件驱动的，
   * 只有轨道一条 scrub 会破坏一致性；且实测初始 scaleY=0 与 CSS 默认值同值、无法自证。
   */
  function rails() {
    var specs = [['rail1', 'dot1'], ['rail2', 'dot2'], ['rail3', 'dot3'], ['rail4', null]];
    for (var i = 0; i < specs.length; i++) {
      (function (railId, dotId) {
        var rail = document.getElementById(railId);
        var dot = dotId ? document.getElementById(dotId) : null;
        if (!rail) return;
        var sec = rail.closest ? rail.closest('.sec') : null;
        if (!sec) return;
        function fill() {
          if (dot) dot.classList.add('is-lit');
          if (REDUCED) { rail.classList.add('is-in'); return; }
          /* 用两帧间隔让初始 scaleY(0) 先被浏览器采纳，再切到 scaleY(1) 以产生过渡 */
          rail.classList.add('is-in');
        }
        if (REDUCED || !('IntersectionObserver' in window)) { fill(); return; }
        var io = new IntersectionObserver(function (ents) {
          for (var k = 0; k < ents.length; k++) if (ents[k].isIntersecting) { fill(); io.disconnect(); }
        }, { threshold: 0.06 });
        io.observe(sec);
      })(specs[i][0], specs[i][1]);
    }
  }

  /* ---------- 3) M2 Bento 点选 ---------- */
  var BOARD = {
    rules:  { t: '字段映射', s: '已跑通', d: '证据：自研 Skill「form-field-mapper」已在 DuMate 作品页公开调用；本机判定核心 26/26 单元测试通过。边界：标签为空且邻近文本也缺失时，只能标 confirm 交人确认——不硬填。' },
    iframe: { t: '材料清单', s: '已跑通', d: '证据：作品《电气夏令营申请材料准备手册》四模块产物，每条要求附来源并区分官方通知与二手整理。边界：查不到官方要求时只给通用清单，并明确标注「非官方要求」。' },
    shadow: { t: '截止倒计时', s: '已跑通', d: '证据：作品里产出「推测截止日 + 剩余天数 + 紧迫度」表，并显式声明是 2026 年数据平移推算、非官方日期。边界：官方日期未发布时只能推算，必须标注——这是本技能写死的规则。' },
    resume: { t: '经历结构化', s: '已跑通', d: '证据：产物中的个人经历档案如实写「暂无具体经历条目（未提供）」并列 9 条信息缺口——没有编造任何经历。边界：原文没写的字段一律留空，数字照抄不换算。' },
    studio: { t: 'Workflow 编排', s: '规划中', d: '未实现。规划：把六步旅程画成 DuMate Workflow 画布。这项没有证据，所以本页不给它任何「已上线」表述。' }
  };
  function bento() {
    var board = document.getElementById('bento');
    var cells = document.querySelectorAll('.cell');
    var note = document.getElementById('boardNote');
    if (!cells.length) return;
    function select(btn) {
      var key = btn.getAttribute('data-key');
      var row = BOARD[key] || { t: key, s: '—', d: '—' };
      for (var i = 0; i < cells.length; i++) {
        var on = cells[i] === btn;
        cells[i].classList.toggle('is-active', on);
        cells[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      if (board) board.classList.add('has-active');
      if (note) note.innerHTML = '<b>' + row.t + ' · ' + row.s + '</b><br>' + row.d;
    }
    for (var i = 0; i < cells.length; i++) {
      (function (b) {
        b.addEventListener('click', function () { select(b); });
        b.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); select(b); }
        });
      })(cells[i]);
    }
    /* 键盘左右移动：Bento 是方向敏感的，给左右键做焦点切换 */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var list = [].slice.call(cells);
      var i = list.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var n = e.key === 'ArrowRight' ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
      list[n].focus();
    });
  }

  /* ---------- 4) M3 价格数字滚动 ---------- */
  function prices() {
    var els = document.querySelectorAll('.t-price[data-count]');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var pre = el.getAttribute('data-prefix'); if (pre === null) pre = '¥';
        var small = el.querySelector('small');
        function final() { el.textContent = pre + target; if (small) el.appendChild(small); }
        if (REDUCED || !hasGsap) { final(); return; }
        if (!('IntersectionObserver' in window)) { final(); return; }
        var io = new IntersectionObserver(function (ents) {
          for (var k = 0; k < ents.length; k++) {
            if (!ents[k].isIntersecting) continue;
            io.disconnect();
            var o = { v: 0 };
            window.gsap.to(o, {
              v: target, duration: 0.9, ease: 'power2.out',
              onUpdate: function () { el.textContent = pre + Math.round(o.v); if (small) el.appendChild(small); },
              onComplete: final
            });
          }
        }, { threshold: 0.4 });
        io.observe(el);
      })(els[i]);
    }
  }

  /* ---------- 5) M4 光流收束 ---------- */
  function converge() {
    var line = document.getElementById('bcLine');
    var node = document.getElementById('bcNode');
    var sec = document.getElementById('m4');
    if (!line || !sec) return;
    if (REDUCED || !hasGsap) return;
    line.style.transformOrigin = 'top center';
    window.gsap.set(line, { scaleY: 0.06, opacity: 0.25 });
    if (node) window.gsap.set(node, { scale: 0.4 });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (ents) {
      for (var k = 0; k < ents.length; k++) {
        if (!ents[k].isIntersecting) continue;
        io.disconnect();
        var tl = window.gsap.timeline();
        tl.to(line, { scaleY: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0)
          .to(node, { scale: 1, duration: 0.45, ease: 'back.out(1.7)' }, 0.34);
      }
    }, { threshold: 0.3 });
    io.observe(sec);
  }

  /* ---------- 6) 隐私政策 dialog ---------- */
  function dialogs() {
    var dlg = document.getElementById('ppDlg');
    var btn = document.getElementById('ppBtn');
    if (!dlg || !btn) return;
    btn.addEventListener('click', function () {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    });
  }

  function boot() {
    reveal(); rails(); bento(); prices(); converge(); dialogs();
    document.documentElement.setAttribute('data-sections', 'ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
