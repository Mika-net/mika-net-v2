/* FE-30 — the only JavaScript on content pages. Loaded blocking from <head> so the theme is set
   before first paint. ES5, no modules. Reads localStorage.theme ('dark'|'light'), falls back to
   prefers-color-scheme, exposes window.__setTheme / window.__toggleTheme, and wires any
   [data-theme-toggle] button by event delegation (so the CSP stays script-src 'self'). */
(function () {
  var K = 'theme', d = document, root = d.documentElement;
  function read() { try { return localStorage.getItem(K); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(K, v); } catch (e) {} }
  function system() {
    try { return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
    catch (e) { return 'dark'; }
  }
  function sync() {
    var light = root.getAttribute('data-theme') === 'light';
    var b = d.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < b.length; i++) {
      b[i].setAttribute('aria-pressed', light ? 'true' : 'false');
      b[i].setAttribute('title', light ? 'Switch to dark theme' : 'Switch to light theme');
    }
  }
  function apply(v) {
    root.setAttribute('data-theme', v);
    sync();
    try { d.dispatchEvent(new CustomEvent('themechange', { detail: { theme: v } })); } catch (e) {}
  }
  var s = read();
  apply(s === 'light' || s === 'dark' ? s : system());
  window.__setTheme = function (v) { if (v !== 'light' && v !== 'dark') v = system(); write(v); apply(v); };
  window.__toggleTheme = function () {
    window.__setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  };
  d.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
    if (t) window.__toggleTheme();
  });
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', sync); else sync();
})();
