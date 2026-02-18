// Simple rack config.
// Add more comics by copying the "demo" block and pointing to your cover + page folder.
const COMICS = [
  {
    id: "demo",
    title: "Demo Comic",
    subtitle: "5 pages • PNG • Mobile flip",
    cover: "comics/demo/cover.png",
    pageDir: "comics/demo/pages",
    pages: ["01.png", "02.png", "03.png", "04.png", "05.png"]
  }
];

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

COMICS.forEach(c => {
  const card = el("article", { class: "card", role: "button", tabindex: "0", "aria-label": `Open ${c.title}` });

  const img = el("img", { class: "cover", src: c.cover, alt: `${c.title} cover`, loading: "lazy" });
  const meta = el("div", { class: "card-meta" }, [
    el("div", { class: "card-title", html: c.title }),
    el("div", { class: "card-sub", html: c.subtitle || "" })
  ]);

  card.appendChild(img);
  card.appendChild(meta);

  const open = () => {
    const url = new URL("reader.html", window.location.href);
    url.searchParams.set("comic", c.id);
    window.location.href = url.toString();
  };

  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") open();
  });

  grid.appendChild(card);
});

window.__COMICS__ = COMICS;
