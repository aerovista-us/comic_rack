// Rack: loads comics from root manifest and per-comic manifests

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(c);
  return n;
}

const grid = document.getElementById("rackGrid");
if (!grid) throw new Error("rackGrid not found");

const ROOT_MANIFEST = "manifest.json";

async function loadRootManifest() {
  const res = await fetch(ROOT_MANIFEST, { cache: "no-store" });
  if (!res.ok) throw new Error(`Root manifest failed: ${res.status}`);
  return res.json();
}

async function loadComicManifest(path) {
  const res = await fetch(`${path}/manifest.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Comic manifest failed: ${res.status}`);
  return res.json();
}

function renderCard(comic, path, isUnavailable = false) {
  const coverUrl = isUnavailable ? "" : `${path}/${comic.cover || "cover.png"}`;
  const card = el("article", {
    class: isUnavailable ? "card card-unavailable" : "card",
    role: "button",
    tabindex: "0",
    "aria-label": isUnavailable ? `Unavailable: ${comic?.title || "Comic"}` : `Open ${comic.title}`,
  });

  const img = el("img", {
    class: "cover",
    src: coverUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600'/%3E",
    alt: `${comic?.title || "Comic"} cover`,
    loading: "lazy",
  });
  if (isUnavailable) img.onerror = () => {};

  const meta = el("div", { class: "card-meta" }, [
    el("div", { class: "card-title", html: comic?.title || "Unavailable" }),
    el("div", { class: "card-sub", html: comic?.subtitle || (isUnavailable ? "Failed to load" : "") }),
  ]);

  card.appendChild(img);
  card.appendChild(meta);

  if (!isUnavailable) {
    const open = () => {
      const url = new URL("reader.html", window.location.href);
      url.searchParams.set("comic", comic.id);
      window.location.href = url.toString();
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  }

  return card;
}

function showRackError(message, retry) {
  grid.innerHTML = "";
  const wrap = el("div", { class: "reader-error" });
  wrap.appendChild(el("p", { html: message }));
  const btn = el("button", { class: "btn", type: "button", html: "Retry" });
  btn.addEventListener("click", () => { retry(); });
  wrap.appendChild(btn);
  grid.appendChild(wrap);
}

async function initRack() {
  let root;
  try {
    root = await loadRootManifest();
  } catch (e) {
    showRackError("Failed to load rack.", initRack);
    return;
  }

  const comics = root.comics || [];
  if (comics.length === 0) {
    grid.innerHTML = "";
    grid.appendChild(el("p", { class: "reader-loading", html: "No comics in manifest." }));
    return;
  }

  grid.innerHTML = "";

  for (const entry of comics) {
    const { id, path } = entry;
    let comic;
    try {
      comic = await loadComicManifest(path);
      if (!comic.id) comic.id = id;
      if (!comic.cover) comic.cover = "cover.png";
    } catch (_) {
      comic = { id, title: "Unavailable", subtitle: "Failed to load", cover: "" };
    }
    const card = renderCard(comic, path, !comic.pages);
    grid.appendChild(card);
  }
}

initRack();
