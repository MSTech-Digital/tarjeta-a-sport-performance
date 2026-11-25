/* Tarjeta digital Fuel Up Nutrition · JavaScript sin dependencias (excepto qrcode.min.js) */
(function () {
  "use strict";
  var C = window.FUELUP || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function cardUrl() {
    if (C.cardUrl) return C.cardUrl;
    var u = location.origin + location.pathname;
    return u.replace(/index\.html?$/, "");
  }
  function wa(text) {
    return "https://wa.me/" + C.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  /* Toast */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* Enlaces */
  $$("[data-wa]").forEach(function (a) {
    a.href = wa(a.getAttribute("data-wa"));
    a.target = "_blank"; a.rel = "noopener";
  });
  $$("[data-link]").forEach(function (a) {
    var k = a.getAttribute("data-link");
    var map = { call: "tel:" + C.phone, maps: C.maps, instagram: C.instagram, facebook: C.facebook, tiktok: C.tiktok, website: C.website, vcf: C.vcf };
    var v = map[k];
    var soonable = k === "website" || k === "facebook" || k === "tiktok";
    if (!v) {
      if (soonable) {
        a.classList.add("soon"); a.removeAttribute("href"); a.setAttribute("aria-disabled", "true");
        var sm = a.querySelector("small"); if (sm) sm.textContent = "Próximamente";
      } else a.hidden = true;
      return;
    }
    if (k === "website") { var sw = a.querySelector("small"); if (sw) { try { sw.textContent = new URL(v).hostname.replace(/^www\./, ""); } catch (e) {} } }
    a.href = v;
    if (k === "vcf") a.setAttribute("download", C.vcf);
    else if (k !== "call") { a.target = "_blank"; a.rel = "noopener"; }
  });
  $$("[data-text]").forEach(function (el) { var v = C[el.getAttribute("data-text")]; if (v) el.textContent = v; });

  /* Copiar */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var t = document.createElement("textarea");
    t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t); return ok;
  }
  function copyLink() {
    copy(cardUrl()).then(function (ok) { toast(ok ? "Enlace copiado" : "No se pudo copiar: " + cardUrl()); });
  }

  /* Compartir */
  $$("[data-action=share]").forEach(function (b) {
    b.addEventListener("click", function () {
      var data = { title: C.shareTitle, text: C.shareText, url: cardUrl() };
      if (navigator.share) {
        navigator.share(data).catch(function (e) { if (e && e.name !== "AbortError") copyLink(); });
      } else copyLink();
    });
  });
  $$("[data-action=copy]").forEach(function (b) { b.addEventListener("click", copyLink); });

  /* Pestañas (versión A) */
  $$("[role=tablist]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
      list.style.setProperty("--i", tabs.indexOf(t));
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (n) { e.preventDefault(); select(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* Acordeón (versión B): solo uno abierto a la vez */
  var acc = $$("details[data-acc]");
  acc.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) acc.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* Código QR */
  var logo = new Image(); logo.src = "img/logo.png";
  function drawQR(canvas, size, opts) {
    if (typeof qrcode !== "function" || !canvas) return;
    opts = opts || {};
    var qr = qrcode(0, "H"); qr.addData(cardUrl()); qr.make();
    var n = qr.getModuleCount(), quiet = 4, total = n + quiet * 2;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var px = opts.export ? size : Math.round(size * dpr);
    canvas.width = px; canvas.height = px;
    if (!opts.export) { canvas.style.width = size + "px"; canvas.style.height = size + "px"; }
    var ctx = canvas.getContext("2d"), m = px / total;
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = opts.ink || "#0A1A5C";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(Math.floor((c + quiet) * m), Math.floor((r + quiet) * m), Math.ceil(m), Math.ceil(m));
    }
    var paint = function () {
      var s = px * 0.22, x = (px - s) / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath(); ctx.arc(px / 2, px / 2, s / 2 + m * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(px / 2, px / 2, s / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logo, x, x, s, s); ctx.restore();
    };
    if (logo.complete && logo.naturalWidth) paint(); else logo.addEventListener("load", paint, { once: true });
  }
  function renderAllQR() {
    $$("canvas[data-qr]").forEach(function (cv) {
      var par = cv.parentElement, cs = getComputedStyle(par);
      var box = (par.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) || 220;
      var max = parseInt(cv.getAttribute("data-qr"), 10) || 240;
      drawQR(cv, Math.max(140, Math.min(max, box)), { ink: cv.getAttribute("data-ink") || undefined });
    });
    $$("[data-url]").forEach(function (el) { el.textContent = cardUrl().replace(/^https?:\/\//, "").replace(/\/$/, ""); });
  }
  renderAllQR();
  var rT; window.addEventListener("resize", function () { clearTimeout(rT); rT = setTimeout(renderAllQR, 150); });

  $$("[data-action=qr-download]").forEach(function (b) {
    b.addEventListener("click", function () {
      var cv = document.createElement("canvas");
      drawQR(cv, 1200, { export: true });
      var done = function () {
        try {
          cv.toBlob(function (blob) {
            if (!blob) { toast("No se pudo generar la imagen"); return; }
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob); a.download = "fuelup-nutrition-qr.png";
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
            toast("Código QR descargado");
          }, "image/png");
        } catch (e) { toast("Tu navegador no permitió la descarga"); }
      };
      if (logo.complete) setTimeout(done, 30); else logo.addEventListener("load", function () { setTimeout(done, 30); }, { once: true });
    });
  });

  /* Diálogo del QR */
  var dlg = $("#qr-dialog");
  $$("[data-action=qr-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!dlg) return;
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      if (toastEl) dlg.appendChild(toastEl);
      renderAllQR();
    });
  });
  if (dlg) {
    $$("[data-action=qr-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { if (toastEl) document.body.appendChild(toastEl); });
  }

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  document.documentElement.classList.add("ready");
})();
