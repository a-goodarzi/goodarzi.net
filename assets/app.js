/* =========================================================
   Goodarzi.net — shared behaviour
   i18n · dark mode · secure email · live RSS feeds · scrollspy
   ========================================================= */
(function () {
  "use strict";

  var currentLang  = "en";
  var SUPPORTED    = ["en", "fa", "de"];
  var enCache      = {};
  var FEED_VISIBLE = 3;

  var RSS2JSON  = "https://api.rss2json.com/v1/api.json?rss_url=";

  /* ---------------- config ---------------- */
  function nameWithBreak(name) {
    var i = name.lastIndexOf(" ");
    return i === -1 ? name : name.slice(0, i) + "<br />" + name.slice(i + 1);
  }

  function applyConfig() {
    var cfg = window.SITE;
    if (!cfg) return;

    /* Inject names & ghost letters into i18n so translateDOM picks them up */
    var I = window.I18N = window.I18N || {};
    ["amir", "hamid"].forEach(function (who) {
      var p = cfg[who];
      if (!p) return;
      ["fa", "de"].forEach(function (lang) { I[lang] = I[lang] || {}; });
      I.fa[who + ".name"]       = p.nameFa;
      I.fa[who + ".panel.name"] = nameWithBreak(p.nameFa);
      I.fa[who + ".ghost"]      = p.ghostFa;
      I.fa[who + ".nick"]       = p.nickFa;
    });

    /* Set EN text and stamp data-i18n so translateDOM can swap to FA/DE */
    document.querySelectorAll("[data-cfg-name]").forEach(function (el) {
      var who = el.getAttribute("data-cfg-name"), p = cfg[who];
      if (!p) return;
      el.textContent = p.nameEn;
      el.setAttribute("data-i18n", who + ".name");
    });
    document.querySelectorAll("[data-cfg-panel-name]").forEach(function (el) {
      var who = el.getAttribute("data-cfg-panel-name"), p = cfg[who];
      if (!p) return;
      el.innerHTML = nameWithBreak(p.nameEn);
      el.setAttribute("data-i18n", who + ".panel.name");
    });
    document.querySelectorAll("[data-cfg-ghost]").forEach(function (el) {
      var who = el.getAttribute("data-cfg-ghost"), p = cfg[who];
      if (!p) return;
      el.textContent = p.ghostEn;
      el.setAttribute("data-i18n", who + ".ghost");
    });
    document.querySelectorAll("[data-cfg-nick]").forEach(function (el) {
      var who = el.getAttribute("data-cfg-nick"), p = cfg[who];
      if (!p) return;
      el.textContent = p.nickEn;
      el.setAttribute("data-i18n", who + ".nick");
    });

    /* LinkedIn hrefs */
    document.querySelectorAll("[data-cfg-linkedin]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-linkedin")];
      if (p) el.href = p.linkedin;
    });

    /* Email data attributes */
    document.querySelectorAll("[data-cfg-email]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-email")];
      if (p) {
        el.setAttribute("data-user",   p.emailUser);
        el.setAttribute("data-domain", p.emailDomain);
      }
    });

    /* Blog / RSS base URLs */
    document.querySelectorAll("[data-cfg-blog]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-blog")];
      if (!p) return;
      el.setAttribute("data-rss-base", p.blogBase);
      el.href = p.blogBase + "/en/rss.xml";
    });
    document.querySelectorAll("[data-cfg-viewall]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-viewall")];
      if (p) el.href = p.blogBase + "/";
    });

    /* Keep FEED_BASES in sync */
    Object.keys(cfg).forEach(function (who) {
      if (cfg[who].blogBase) FEED_BASES[who] = cfg[who].blogBase;
    });

    /* Web3Forms access keys */
    document.querySelectorAll("[data-cfg-web3forms]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-web3forms")];
      if (p && p.web3CVFormsKey) el.value = p.web3CVFormsKey;
    });

    /* Merged form: stamp both subject data attrs so the toggle can read them */
    document.querySelectorAll("[data-cfg-form-subjects]").forEach(function (el) {
      var p = cfg[el.getAttribute("data-cfg-form-subjects")];
      if (!p) return;
      el.setAttribute("data-subject-message", "Contact — " + p.nameEn);
      el.setAttribute("data-subject-cv",      "CV Request — " + p.nameEn);
    });
  }

  var FEED_BASES = {
    amir:  "https://amir.goodarzi.net",
    hamid: "https://hamid.goodarzi.net"
  };

  var MONTH = {
    en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    de: ["Jan.","Feb.","März","Apr.","Mai","Juni","Juli","Aug.","Sep.","Okt.","Nov.","Dez."],
    fa: ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"]
  };

  /* ---------------- i18n ---------------- */
  function dict() { return window.I18N || {}; }

  function translateDOM(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    var DICT = dict();
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === "fa" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!(key in enCache)) enCache[key] = el.innerHTML;
      el.innerHTML = (DICT[lang] && DICT[lang][key] != null)
        ? DICT[lang][key] : enCache[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":"), attr = bits[0].trim(), key = bits[1].trim();
        var ck = "@" + attr + ":" + key;
        if (!(ck in enCache)) enCache[ck] = el.getAttribute(attr) || "";
        el.setAttribute(attr,
          (DICT[lang] && DICT[lang][key] != null)
            ? DICT[lang][key] : enCache[ck]);
      });
    });

    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });

    document.querySelectorAll("[data-rss-base]").forEach(function (el) {
      el.href = el.getAttribute("data-rss-base") + "/" + lang + "/rss.xml";
    });

    /* re-apply dynamic label/placeholder for merged forms */
    document.querySelectorAll("[data-merged-form]").forEach(function (form) {
      updateFormType(form, form.getAttribute("data-form-current-type") || "message");
    });
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "en";
    currentLang = lang;
    translateDOM(lang);
    fetchAllFeeds(lang);
    try { localStorage.setItem("goodarzi-lang", lang); } catch (e) {}
    document.documentElement.setAttribute("data-lang", lang);
  }

  function initLang() {
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
    });
    var saved = null;
    try { saved = localStorage.getItem("goodarzi-lang"); } catch (e) {}
    var url = new URLSearchParams(location.search).get("lang");
    applyLang(url || saved || "en");
  }

  /* ---------------- dark mode ---------------- */
  function initTheme() {
    var root = document.documentElement;
    if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", "light");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("goodarzi-theme", next); } catch (e) {}
      });
    });
  }

  /* ------------- secure email ------------- */
  function emailAddr(el) {
    return el.getAttribute("data-user") + "@" + el.getAttribute("data-domain");
  }

  function initEmail() {
    document.querySelectorAll("[data-email-reveal]").forEach(function (el) {
      el.addEventListener("click", function () {
        var addr = emailAddr(el);
        var out  = el.parentNode.querySelector("[data-email-out]");
        if (el.hasAttribute("data-obf")) {
          out.textContent = el.getAttribute("data-user") + " [at] " +
            el.getAttribute("data-domain").replace(/\./g, " [dot] ");
        } else {
          out.innerHTML = '<a href="mailto:' + addr + '">' + addr + "</a>";
        }
        out.removeAttribute("hidden");
        el.setAttribute("hidden", "");
      });
    });
    document.querySelectorAll("[data-email-copy]").forEach(function (el) {
      el.addEventListener("click", function () {
        var addr = emailAddr(el);
        var done = function () {
          var label = el.querySelector("[data-copy-label]") || el;
          var prev  = label.textContent;
          label.textContent = el.getAttribute("data-copied") || "Copied ✓";
          el.classList.add("is-copied");
          setTimeout(function () { label.textContent = prev; el.classList.remove("is-copied"); }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(done, done);
        } else {
          var ta = document.createElement("textarea");
          ta.value = addr; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    });
    document.querySelectorAll("[data-email-mailto]").forEach(function (el) {
      el.addEventListener("click", function () {
        var addr = emailAddr(el);
        var subj = encodeURIComponent(el.getAttribute("data-subject") || "Hello");
        location.href = "mailto:" + addr + "?subject=" + subj;
      });
    });
  }

  /* ------------- RSS via rss2json.com ------------- */
  function formatDate(rawDate, lang) {
    var d = new Date(rawDate);
    if (isNaN(d.getTime())) return rawDate;
    var months = MONTH[lang] || MONTH.en;
    var day = d.getUTCDate(), mon = months[d.getUTCMonth()], year = d.getUTCFullYear();
    return lang === "de" ? day + ". " + mon + " " + year : day + " " + mon + " " + year;
  }

  function estimateRead(text) {
    var words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + " min";
  }

  function stripTags(html) {
    return (html || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'").trim();
  }

  function buildFeedHTML(posts, lang) {
    var html = posts.map(function (p, i) {
      var n = String(i + 1).padStart(2, "0");
      var dateLabel = p.rawDate ? formatDate(p.rawDate, lang) : p.date;
      return (
        '<a class="post' + (i >= FEED_VISIBLE ? " post-folded" : "") +
            '" href="' + p.url + '" target="_blank" rel="noopener">' +
          '<span class="post-n mono-kicker"><span class="num">' + n + "</span></span>" +
          '<span class="post-main">' +
            '<span class="post-title">' + p.title + "</span>" +
            '<span class="post-excerpt">' + p.excerpt + "</span>" +
          "</span>" +
          '<span class="post-meta"><time datetime="' + p.date + '">' + dateLabel + "</time>" +
            '<span class="post-read">' + p.read + "</span></span>" +
          '<span class="post-arrow" aria-hidden="true">→</span>' +
        "</a>"
      );
    }).join("");
    if (posts.length > FEED_VISIBLE) {
      html += '<button class="feed-toggle" type="button" data-feed-toggle>' +
        '<span data-i18n="feed.more">Show earlier posts</span>' +
        '<span class="ft-count">+' + (posts.length - FEED_VISIBLE) + "</span></button>";
    }
    return html;
  }

  function wireToggle(mount) {
    mount.querySelectorAll("[data-feed-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        mount.querySelectorAll(".post-folded").forEach(function (p) {
          p.classList.remove("post-folded");
        });
        b.remove();
      });
    });
  }

  function fetchAndRenderFeed(mount, lang) {
    var who  = mount.getAttribute("data-feed");
    var base = FEED_BASES[who];
    if (!base) return;

    var rssUrl = mount.getAttribute("data-rss-" + lang) || (base + "/" + lang + "/rss.xml");
    mount.innerHTML = '<span class="feed-msg feed-loading" aria-live="polite" aria-busy="true">Loading…</span>';

    fetch(RSS2JSON + encodeURIComponent(rssUrl))
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data.status !== "ok" || !data.items || !data.items.length) throw new Error("empty");
        var posts = data.items.map(function (item) {
          var plain   = stripTags(item.description || item.content || "");
          var excerpt = plain.length > 160 ? plain.slice(0, 157) + "…" : plain;
          var d       = new Date(item.pubDate);
          return {
            title:   item.title || "",
            url:     item.link || item.guid || "#",
            excerpt: excerpt,
            date:    !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "",
            rawDate: item.pubDate || "",
            read:    estimateRead(stripTags(item.content || item.description || ""))
          };
        });
        mount.innerHTML = buildFeedHTML(posts, lang);
        wireToggle(mount);
        translateDOM(currentLang);
      })
      .catch(function () {
        mount.innerHTML =
          '<span class="feed-msg feed-error">Could not load posts. ' +
          '<a href="' + base + '/' + lang + '/" target="_blank" rel="noopener">Visit blog →</a></span>';
      });
  }

  function fetchAllFeeds(lang) {
    document.querySelectorAll("[data-feed]").forEach(function (mount) {
      fetchAndRenderFeed(mount, lang);
    });
  }

  /* ------------- merged contact / CV form ------------- */
  function updateFormType(form, type) {
    var D = (window.I18N || {})[currentLang] || (window.I18N || {}).en || {};
    var isCV = type === "cv";
    form.setAttribute("data-form-current-type", type);

    form.querySelectorAll(".form-type-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-form-type") === type ? "true" : "false");
    });

    var subjectInput = form.querySelector("[name=subject]");
    if (subjectInput) {
      subjectInput.value = isCV
        ? (form.getAttribute("data-subject-cv")      || "CV Request")
        : (form.getAttribute("data-subject-message") || "Contact");
    }

    var msgLabel = form.querySelector(".form-msg-label");
    var msgArea  = form.querySelector("[name=message]");
    if (msgLabel) {
      msgLabel.textContent = isCV
        ? (D["form.message.label.cv"]      || "Brief note (optional)")
        : (D["form.message.label.contact"] || "Your message");
    }
    if (msgArea) {
      msgArea.placeholder = isCV
        ? (D["form.message.ph.cv"]      || "")
        : (D["form.message.ph.contact"] || "");
      if (isCV) msgArea.removeAttribute("required");
      else      msgArea.setAttribute("required", "");
    }
  }

  function initMergedForms() {
    document.querySelectorAll("[data-merged-form]").forEach(function (form) {
      updateFormType(form, "message");

      form.querySelectorAll(".form-type-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          updateFormType(form, btn.getAttribute("data-form-type"));
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn     = form.querySelector("[type=submit]");
        var label   = btn.querySelector(".form-btn-label") || btn;
        var success = form.querySelector(".form-success");
        var errBox  = form.querySelector(".form-error");
        var prev    = label.textContent;

        success.setAttribute("hidden", "");
        errBox.setAttribute("hidden", "");
        btn.disabled      = true;
        label.textContent = "…";

        var restore = function () { btn.disabled = false; label.textContent = prev; };

        fetch("https://api.web3forms.com/submit", {
          method:  "POST",
          headers: { "Accept": "application/json" },
          body:    new FormData(form)
        })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          restore();
          if (json.success) {
            form.reset();
            updateFormType(form, "message");
            success.removeAttribute("hidden");
          } else {
            errBox.removeAttribute("hidden");
          }
        })
        .catch(function () { restore(); errBox.removeAttribute("hidden"); });
      });
    });
  }

  /* ------------- CV request form (Web3Forms) ------------- */
  function initForms() {
    document.querySelectorAll("[data-cv-form], [data-contact-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn     = form.querySelector("[type=submit]");
        var label   = btn.querySelector(".form-btn-label") || btn;
        var success = form.querySelector(".form-success");
        var errBox  = form.querySelector(".form-error");
        var prev    = label.textContent;

        success.setAttribute("hidden", "");
        errBox.setAttribute("hidden", "");
        btn.disabled    = true;
        label.textContent = "…";

        var restore = function () { btn.disabled = false; label.textContent = prev; };

        fetch("https://api.web3forms.com/submit", {
          method:  "POST",
          headers: { "Accept": "application/json" },
          body:    new FormData(form)
        })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          restore();
          if (json.success) { form.reset(); success.removeAttribute("hidden"); }
          else              { errBox.removeAttribute("hidden"); }
        })
        .catch(function () { restore(); errBox.removeAttribute("hidden"); });
      });
    });
  }

  /* ------------- reveal on scroll ------------- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  /* ------------- scrollspy (nav active state) ------------- */
  function initSpy() {
    var links = document.querySelectorAll("[data-spy]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (l) {
          l.setAttribute("aria-current", l.getAttribute("data-spy") === id ? "true" : "false");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".profile").forEach(function (s) { io.observe(s); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyConfig();
    initTheme();
    initLang();   /* calls applyLang → fetchAllFeeds */
    initEmail();
    initForms();
    initMergedForms();
    initReveal();
    initSpy();
  });
})();
