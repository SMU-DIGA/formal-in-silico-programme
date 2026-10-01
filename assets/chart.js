// Small line charts for the domain pages. Each <figure class="chart"> holds its data
// in a <script type="application/json"> and a <div class="plot">; this draws an SVG,
// a crosshair tooltip (pointer and arrow keys) and a table view of the same numbers.
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pow10(e) { return "10" + String(e).split("").map(function (c) { return SUP[c]; }).join(""); }
  function fmt(v, f) {
    if (v == null) return "—";
    if (f === "sci") {
      if (v === 0) return "0";
      var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
      return m.toFixed(2) + "×" + pow10(e);
    }
    var d = /^f(\d)$/.exec(f || "f2");
    return v.toFixed(d ? +d[1] : 2);
  }

  function draw(fig, spec) {
    var plot = fig.querySelector(".plot");
    var W = Math.max(plot.clientWidth, 280), narrow = W < 520;
    var H = narrow ? 250 : 300, m = { l: narrow ? 50 : 62, r: narrow ? 14 : 24, t: 14, b: 40 };
    var X = spec.x, Y = spec.y;
    var sx = function (v) { return m.l + (v - X.min) / (X.max - X.min) * (W - m.l - m.r); };
    var ly = function (v) { return Y.log ? Math.log10(v) : v; };
    var sy = function (v) { return H - m.b - (ly(v) - ly(Y.min)) / (ly(Y.max) - ly(Y.min)) * (H - m.t - m.b); };

    plot.textContent = "";
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": spec.alt || "" }, plot);
    var clip = "c" + Math.random().toString(36).slice(2);
    el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, el("clipPath", { id: clip }, el("defs", {}, svg)));

    var ax = el("g", { "class": "ax" }, svg);
    Y.ticks.forEach(function (t) {
      var y = sy(t);
      el("line", { "class": "gl", x1: m.l, x2: W - m.r, y1: y, y2: y }, ax);
      var lab = el("text", { x: m.l - 8, y: y + 4, "text-anchor": "end" }, ax);
      lab.textContent = Y.log ? pow10(Math.round(Math.log10(t))) : fmt(t, Y.tfmt || "f0");
    });
    X.ticks.forEach(function (t) {
      var lab = el("text", { x: sx(t), y: H - m.b + 18, "text-anchor": "middle" }, ax);
      lab.textContent = fmt(t, X.tfmt || X.fmt);
    });
    el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, ax);
    var xl = el("text", { "class": "lb", x: W - m.r, y: H - 4, "text-anchor": "end" }, ax);
    xl.textContent = X.label;

    var g = el("g", { "clip-path": "url(#" + clip + ")" }, svg);
    (spec.hlines || []).forEach(function (h) {
      var y = sy(h.y);
      el("line", { "class": "ref", x1: m.l, x2: W - m.r, y1: y, y2: y }, g);
      if (narrow && h.wide) return;
      var t = el("text", { "class": "lb", x: narrow ? m.l + 6 : W - m.r - 4, y: y - 6, "text-anchor": narrow ? "start" : "end" }, svg);
      t.textContent = h.label;
    });
    (spec.vlines || []).forEach(function (v) {
      var x = sx(v.x);
      el("line", { "class": "ref", x1: x, x2: x, y1: m.t, y2: H - m.b }, g);
      var t = el("text", { "class": "lb", x: x + (v.side === "left" ? -6 : 6), y: m.t + 10 + (narrow ? 0 : v.dy || 0), "text-anchor": v.side === "left" ? "end" : "start" }, svg);
      t.textContent = v.label;
    });
    spec.series.forEach(function (s, i) {
      var d = s.pts.map(function (p, j) { return (j ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join("");
      el("path", { "class": "ln s" + s.c, d: d }, g);
    });
    (spec.notes || []).forEach(function (k) {
      if (narrow && k.wide) return;
      var t = el("text", { "class": "lb", x: sx(k.x), y: sy(k.y), "text-anchor": k.a || "start" }, svg);
      t.textContent = k.text;
    });
    (spec.marks || []).forEach(function (k) {
      el("circle", { "class": "dot f" + k.c, cx: sx(k.x), cy: sy(k.y), r: 5 }, svg);
      var t = el("text", { "class": "lb", x: sx(k.x) + (k.dx || 0), y: sy(k.y) + (k.dy || 20), "text-anchor": k.a || "middle" }, svg);
      t.textContent = narrow && k.short ? k.short : k.label;
    });

    // crosshair + tooltip
    var xs = [];
    spec.series.forEach(function (s) { s.pts.forEach(function (p) { if (xs.indexOf(p[0]) < 0) xs.push(p[0]); }); });
    xs.sort(function (a, b) { return a - b; });
    var hair = el("line", { "class": "xh", y1: m.t, y2: H - m.b, visibility: "hidden" }, svg);
    var dots = spec.series.map(function (s) { return el("circle", { "class": "dot f" + s.c, r: 4.5, visibility: "hidden" }, svg); });
    var tip = document.createElement("div");
    tip.className = "tip";
    plot.appendChild(tip);
    var cur = -1;
    function show(i) {
      cur = Math.max(0, Math.min(xs.length - 1, i));
      var x = xs[cur], px = sx(x);
      hair.setAttribute("x1", px); hair.setAttribute("x2", px); hair.setAttribute("visibility", "visible");
      tip.textContent = "";
      var hd = document.createElement("div"); hd.className = "x";
      hd.textContent = (spec.xname || "x") + " = " + fmt(x, X.fmt);
      tip.appendChild(hd);
      spec.series.forEach(function (s, k) {
        var p = null;
        s.pts.forEach(function (q) { if (q[0] === x) p = q; });
        if (p) { dots[k].setAttribute("cx", px); dots[k].setAttribute("cy", sy(p[1])); dots[k].setAttribute("visibility", "visible"); }
        else dots[k].setAttribute("visibility", "hidden");
        var r = document.createElement("div"); r.className = "r";
        var sw = document.createElement("i"); sw.style.background = "var(--c" + s.c + ")";
        var v = document.createElement("b"); v.textContent = p ? fmt(p[1], Y.fmt) : "—";
        var n = document.createElement("span"); n.textContent = s.name;
        r.appendChild(sw); r.appendChild(v); r.appendChild(n);
        tip.appendChild(r);
      });
      tip.classList.add("on");
      var tw = tip.offsetWidth, left = px + 14;
      if (left + tw > W) left = px - tw - 14;
      tip.style.left = Math.max(0, left) + "px";
      tip.style.top = m.t + "px";
    }
    function hide() {
      hair.setAttribute("visibility", "hidden");
      dots.forEach(function (d) { d.setAttribute("visibility", "hidden"); });
      tip.classList.remove("on");
    }
    function nearest(px) {
      var best = 0, bd = Infinity;
      xs.forEach(function (x, i) { var d = Math.abs(sx(x) - px); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    svg.addEventListener("pointermove", function (e) {
      var r = svg.getBoundingClientRect();
      show(nearest((e.clientX - r.left) * W / r.width));
    });
    svg.addEventListener("pointerleave", hide);
    svg.setAttribute("tabindex", "0");
    svg.addEventListener("focus", function () { show(cur < 0 ? 0 : cur); });
    svg.addEventListener("blur", hide);
    svg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { show(cur + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { show(cur - 1); e.preventDefault(); }
      else if (e.key === "Escape") hide();
    });
  }

  function table(fig, spec) {
    var host = fig.querySelector(".tablehost");
    if (!host) return;
    var xs = [];
    spec.series.forEach(function (s) { s.pts.forEach(function (p) { if (xs.indexOf(p[0]) < 0) xs.push(p[0]); }); });
    xs.sort(function (a, b) { return a - b; });
    var t = document.createElement("table"), hr = document.createElement("tr");
    [spec.xname || "x"].concat(spec.series.map(function (s) { return s.name; })).forEach(function (h) {
      var th = document.createElement("th"); th.textContent = h; hr.appendChild(th);
    });
    var thead = document.createElement("thead"); thead.appendChild(hr); t.appendChild(thead);
    var tb = document.createElement("tbody");
    xs.forEach(function (x) {
      var tr = document.createElement("tr"), td = document.createElement("td");
      td.textContent = fmt(x, spec.x.fmt); tr.appendChild(td);
      spec.series.forEach(function (s) {
        var p = null; s.pts.forEach(function (q) { if (q[0] === x) p = q; });
        var c = document.createElement("td"); c.textContent = p ? fmt(p[1], spec.y.fmt) : "—"; tr.appendChild(c);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    var wrap = document.createElement("div"); wrap.className = "tbl"; wrap.appendChild(t);
    host.appendChild(wrap);
  }

  function legend(fig, spec) {
    var key = fig.querySelector(".key");
    if (!key || spec.series.length < 2 && !(spec.hlines || []).length) return;
    spec.series.forEach(function (s) {
      var sp = document.createElement("span"), i = document.createElement("i");
      i.style.background = "var(--c" + s.c + ")";
      sp.appendChild(i); sp.appendChild(document.createTextNode(s.name));
      key.appendChild(sp);
    });
    (spec.keyref || []).forEach(function (name) {
      var sp = document.createElement("span"), i = document.createElement("i");
      i.className = "dash";
      sp.appendChild(i); sp.appendChild(document.createTextNode(name));
      key.appendChild(sp);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("figure.chart"), function (fig) {
      var src = fig.querySelector("script[type='application/json']");
      if (!src) return;
      var spec = JSON.parse(src.textContent);
      legend(fig, spec);
      table(fig, spec);
      draw(fig, spec);
      var w = fig.querySelector(".plot").clientWidth;
      if ("ResizeObserver" in window) {
        new ResizeObserver(function () {
          var nw = fig.querySelector(".plot").clientWidth;
          if (Math.abs(nw - w) > 2) { w = nw; draw(fig, spec); }
        }).observe(fig.querySelector(".plot"));
      }
    });
  });
})();
