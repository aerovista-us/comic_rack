// Reader: loads a comic by ?comic=ID
// Uses St.PageFlip from page-flip.browser.js (loaded in reader.html)

const COMICS = [
  {
    id: "demo",
    title: "Demo Comic",
    cover: "comics/demo/cover.png",
    pageDir: "comics/demo/pages",
    pages: ["01.png", "02.png", "03.png", "04.png", "05.png"]
  }
];

function getComicId() {
  const u = new URL(window.location.href);
  return u.searchParams.get("comic") || "demo";
}

function pickComic(id) {
  return COMICS.find(c => c.id === id) || COMICS[0];
}

const comic = pickComic(getComicId());

// UI
const comicName = document.getElementById("comicName");
const comicMeta = document.getElementById("comicMeta");
const btnBack = document.getElementById("btnBack");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const hint = document.getElementById("hint");

comicName.textContent = comic.title;
comicMeta.textContent = `${comic.pages.length} pages`;

btnBack.addEventListener("click", () => { window.location.href = "index.html"; });

function safeAreaBottom() {
  return 0;
}

function computeSize() {
  // Match your PNG aspect ratio (height / width)
  // Example: 1080x1620 => 1620/1080 = 1.5
  const aspect = 3 / 2; // <-- change if your pages differ

  const padding = 24;
  const maxW = Math.min(window.innerWidth - padding, 520);

  const vh = window.visualViewport?.height ?? window.innerHeight;

  const header = document.querySelector(".reader-topbar");
  const headerH = header ? header.getBoundingClientRect().height : 64;

  const verticalPadding = 18;
  const maxH = vh - headerH - verticalPadding - safeAreaBottom();

  let w = Math.floor(maxW);
  let h = Math.floor(w * aspect);

  if (h > maxH) {
    h = Math.floor(maxH);
    w = Math.floor(h / aspect);
  }

  w = Math.max(w, 280);
  h = Math.floor(w * aspect);

  return { w, h };
}

const wrap = document.querySelector(".flip-wrap");
const flipEl = document.getElementById("flipbook");

let pageFlip = null;

function buildFlipbook() {
  const { w, h } = computeSize();

  wrap.style.width = `${w}px`;
  wrap.style.height = `${h}px`;

  if (pageFlip) {
    try { pageFlip.destroy(); } catch (_) {}
    pageFlip = null;
    flipEl.innerHTML = "";
  }

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
    disableFlipByClick: false
  });

  const pageUrls = comic.pages.map(p => `${comic.pageDir}/${p}`);
  pageFlip.loadFromImages(pageUrls);

  function updateNav() {
    const pageCount = pageFlip.getPageCount?.() ?? comic.pages.length;
    const idx = pageFlip.getCurrentPageIndex?.() ?? 0;

    btnPrev.disabled = idx <= 0;
    btnNext.disabled = idx >= pageCount - 1;

    comicMeta.textContent = `Page ${idx + 1} / ${pageCount}`;
  }

  btnPrev.onclick = () => pageFlip.flipPrev();
  btnNext.onclick = () => pageFlip.flipNext();

  pageFlip.on("flip", () => {
    updateNav();
    if (navigator.vibrate) navigator.vibrate(8);
  });

  const hideHint = () => { hint.style.display = "none"; window.removeEventListener("pointerdown", hideHint); };
  window.addEventListener("pointerdown", hideHint, { once: true });

  updateNav();
}

buildFlipbook();

let t = null;
let lastW = 0;

window.addEventListener("resize", () => {
  const wNow = window.innerWidth;
  if (Math.abs(wNow - lastW) < 10) return;
  lastW = wNow;

  clearTimeout(t);
  t = setTimeout(buildFlipbook, 150);
});
