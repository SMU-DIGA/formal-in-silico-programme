// Theme toggle (remembered per browser) and table-of-contents highlighting.
(function () {
  var root = document.documentElement;
  var key = "fis-theme";
  try {
    var saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".theme");
    if (btn) {
      btn.addEventListener("click", function () {
        var dark = root.getAttribute("data-theme")
          ? root.getAttribute("data-theme") === "dark"
          : window.matchMedia("(prefers-color-scheme: dark)").matches;
        var next = dark ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(key, next); } catch (e) {}
      });
    }

    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("on"); });
        var a = byId[e.target.id];
        if (a) a.classList.add("on");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(byId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  });
})();
