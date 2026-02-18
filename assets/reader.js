// Reader: loads a comic by ?comic=ID from comics/<id>/manifest.json
// Uses St.PageFlip from page-flip.browser.js (loaded in reader.html)

function getComicId() {
  const u = new URL(window.location.href);
  return u.searchParams.get("comic");
}

async function loadComicManifest(id) {
  const res = await fetch(`comics/${encodeURIComponent(id)}/manifest.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(res.status === 404 ? "Comic not found" : `Failed to load: ${res.status}`);
  return res.json();
}

function safeAreaBottom() {
  return 0;
}

const comicName = document.getElementById("comicName");
const comicMeta = document.getElementById("comicMeta");
const btnBack = document.getElementById("btnBack");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const hint = document.getElementById("hint");
const readerStage = document.getElementById("readerStage");
const flipWrap = document.getElementById("flipWrap");
const flipEl = document.getElementById("flipbook");
const readerHeadline = document.getElementById("readerHeadline");

btnBack.addEventListener("click", () => { window.location.href = "index.html"; });

function setLoading(loading) {
  if (comicName) comicName.textContent = loading ? "Loading…" : "";
  if (comicMeta) comicMeta.textContent = loading ? "" : "";
  if (flipWrap) flipWrap.style.visibility = loading ? "hidden" : "";
}

function showError(message) {
  setLoading(false);
  if (!readerStage) return;
  const existing = readerStage.querySelector(".reader-error, .reader-loading");
  if (existing) existing.remove();
  const err = document.createElement("div");
  err.className = "reader-error";
  const p = document.createElement("p");
  p.textContent = message;
  err.appendChild(p);
  const link = document.createElement("a");
  link.href = "index.html";
  link.className = "btn";
  link.textContent = "← Back to Rack";
  err.appendChild(link);
  readerStage.insertBefore(err, readerStage.firstChild);
  if (flipWrap) flipWrap.style.display = "none";
  if (readerHeadline) readerHeadline.textContent = "";
}

function normalizePages(comic) {
  const pages = comic.pages || [];
  const dir = comic.pageDir ? comic.pageDir.replace(/\/$/, "") + "/" : "";
  const base = `comics/${encodeURIComponent(comic.id)}/${dir}`;
  return pages.map(p => {
    if (typeof p === "string") return { src: base + p, headline: null };
    return { src: base + (p.src || p), headline: p.headline || null };
  });
}

function computeSize(aspect) {
  const ratio = typeof aspect === "number" ? aspect : 1.5;
  const padding = 24;
  const maxW = Math.min(window.innerWidth - padding, 520);
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const header = document.querySelector(".reader-topbar");
  const headerH = header ? header.getBoundingClientRect().height : 64;
  const verticalPadding = 18;
  const maxH = vh - headerH - verticalPadding - safeAreaBottom();

  let w = Math.floor(maxW);
  let h = Math.floor(w * ratio);
  if (h > maxH) {
    h = Math.floor(maxH);
    w = Math.floor(h / ratio);
  }
  w = Math.max(w, 280);
  h = Math.floor(w * ratio);
  return { w, h };
}

let pageFlip = null;
let currentComic = null;
let pageList = [];

function buildFlipbook(comic) {
  currentComic = comic;
  pageList = normalizePages(comic);
  const aspect = comic.aspect ?? 1.5;
  const { w, h } = computeSize(aspect);

  if (flipWrap) {
    flipWrap.style.display = "";
    flipWrap.style.width = `${w}px`;
    flipWrap.style.height = `${h}px`;
  }

  if (pageFlip) {
    try { pageFlip.destroy(); } catch (_) {}
    pageFlip = null;
    if (flipEl) flipEl.innerHTML = "";
  }

  const pageUrls = pageList.map(p => p.src);
  pageFlip = new St.PageFlip(flipEl, {
    width: w,
    height: h,
    size: "fixed",
    usePortrait: true,
    showCover: true,
    mobileScrollSupport: false,
    maxShadowOpacity: 0.35,
    flippingTime: 450,
    swipeDistance: 20,
    clickEventForward: true,
    disableFlipByClick: false,
  });

  pageFlip.loadFromImages(pageUrls);

  function updateNav() {
    const pageCount = pageFlip.getPageCount?.() ?? pageList.length;
    const idx = pageFlip.getCurrentPageIndex?.() ?? 0;
    if (btnPrev) btnPrev.disabled = idx <= 0;
    if (btnNext) btnNext.disabled = idx >= pageCount - 1;
    if (comicMeta) comicMeta.textContent = `Page ${idx + 1} / ${pageCount}`;
    if (readerHeadline && pageList[idx] && pageList[idx].headline) {
      readerHeadline.textContent = pageList[idx].headline;
      readerHeadline.style.display = "";
    } else if (readerHeadline) {
      readerHeadline.textContent = "";
      readerHeadline.style.display = pageList.some(p => p.headline) ? "" : "none";
    }
  }

  if (btnPrev) btnPrev.onclick = () => pageFlip.flipPrev();
  if (btnNext) btnNext.onclick = () => pageFlip.flipNext();

  pageFlip.on("flip", () => {
    updateNav();
    if (navigator.vibrate) navigator.vibrate(8);
  });

  const hideHint = () => { if (hint) hint.style.display = "none"; window.removeEventListener("pointerdown", hideHint); };
  window.addEventListener("pointerdown", hideHint, { once: true });

  updateNav();
  setLoading(false);
}

async function init() {
  const id = getComicId();
  if (!id) {
    showError("Comic not found. Missing comic ID.");
    return;
  }

  setLoading(true);
  let comic;
  try {
    comic = await loadComicManifest(id);
  } catch (e) {
    showError(e.message || "Failed to load comic.");
    return;
  }

  if (!comic.pages || comic.pages.length === 0) {
    showError("Comic has no pages.");
    return;
  }

  if (comicName) comicName.textContent = comic.title || "Comic";
  document.body.dataset.theme = comic.theme || "default";

  try {
    buildFlipbook(comic);
  } catch (e) {
    showError("Failed to build reader.");
    return;
  }
}

init();

let t = null;
let lastW = 0;
window.addEventListener("resize", () => {
  const wNow = window.innerWidth;
  if (Math.abs(wNow - lastW) < 10) return;
  lastW = wNow;
  clearTimeout(t);
  t = setTimeout(() => {
    if (currentComic) buildFlipbook(currentComic);
  }, 150);
});
