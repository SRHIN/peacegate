/* ==========================================================================
   PeaceGate Mediation and Training Consult — Landing page scripts
   Vanilla JavaScript, no dependencies.
   ========================================================================== */

(function () {
  "use strict";

  const CONTACT_EMAIL = "oluseyiadebisi@yahoo.com";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- Header background on scroll ---------- */
  function stickyHeader() {
    const header = $("#siteHeader");
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  function mobileMenu() {
    const toggle = $("#navToggle");
    const nav = $("#siteNav");

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (open) $("a", nav).focus();
    };

    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Keep Tab focus inside the open menu
    nav.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
      const items = $$("a", nav);
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); toggle.focus(); }
      if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); toggle.focus(); }
    });

    window.matchMedia("(min-width: 960px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Smooth scrolling for in-page links ---------- */
  function smoothScroll() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        const target = id.length > 1 && $(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        history.replaceState(null, "", id);
      });
    });
  }

  /* ---------- Highlight the nav link for the section in view ---------- */
  function activeNav() {
    const links = $$(".nav__list a");
    const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => {
          const on = l.getAttribute("href") === "#" + entry.target.id;
          l.classList.toggle("is-active", on);
          on ? l.setAttribute("aria-current", "true") : l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  function reveal() {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Contact form: validate, then open the visitor's email app ---------- */
  function contactForm() {
    const form = $("#contactForm");
    const status = $("#formStatus");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const rules = {
      name: (v) => (v.trim().length >= 2 ? "" : "Enter your full name."),
      phone: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : "Enter a phone number we can call you on, e.g. 0803 000 0000."),
      email: (v) => (!v.trim() || emailRe.test(v.trim()) ? "" : "Enter an email like name@example.com, or leave it blank."),
      message: (v) => (v.trim().length >= 10 ? "" : "Tell us briefly how we can help (at least 10 characters)."),
    };

    const check = (input) => {
      const msg = rules[input.name](input.value);
      input.closest(".field").classList.toggle("has-error", Boolean(msg));
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      $("#" + input.name + "Error").textContent = msg;
      return !msg;
    };

    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener("blur", () => { if (input.value) check(input); });
      input.addEventListener("input", () => { if (input.closest(".field").classList.contains("has-error")) check(input); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = Object.keys(rules).map((n) => form.elements[n]);
      const firstBad = inputs.find((input) => !check(input));
      // Re-run so every field shows its message, not just the first
      inputs.forEach(check);
      if (firstBad) { status.textContent = ""; firstBad.focus(); return; }

      const f = form.elements;
      const subject = `Enquiry: ${f.service.value} — ${f.name.value.trim()}`;
      const body = [
        `Name: ${f.name.value.trim()}`,
        `Phone: ${f.phone.value.trim()}`,
        f.email.value.trim() ? `Email: ${f.email.value.trim()}` : null,
        `Service: ${f.service.value}`,
        "",
        f.message.value.trim(),
      ].filter((line) => line !== null).join("\n");

      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = `Your email app should now open with the message ready to send. If it doesn’t, email ${CONTACT_EMAIL} or call 0803 849 7112.`;
    });
  }

  /* ---------- Share button: native share sheet, or copy the link ---------- */
  function shareButton() {
    const btn = $("#shareBtn");
    const status = $("#shareStatus");
    const data = {
      title: "PeaceGate Mediation and Training Consult",
      text: "PeaceGate Mediation and Training Consult, Makurdi — mediation, counselling, training, HR and security consultancy. Call 0803 849 7112.",
      url: window.location.href.split("#")[0],
    };

    btn.addEventListener("click", async () => {
      if (navigator.share) {
        try { await navigator.share(data); } catch (_) { /* person closed the share sheet */ }
        return;
      }
      try {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        status.textContent = "Link copied. Paste it into WhatsApp, SMS or email to share.";
      } catch (_) {
        status.textContent = `Copy this link to share: ${data.url}`;
      }
    });
  }

  /* ---------- Back to top ---------- */
  function backToTop() {
    const btn = $("#toTop");
    const update = () => btn.classList.toggle("is-visible", window.scrollY > window.innerHeight);
    update();
    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      $(".skip-link").focus({ preventScroll: true });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    stickyHeader();
    mobileMenu();
    smoothScroll();
    activeNav();
    reveal();
    contactForm();
    shareButton();
    backToTop();
    $("#year").textContent = new Date().getFullYear();
  });
})();
