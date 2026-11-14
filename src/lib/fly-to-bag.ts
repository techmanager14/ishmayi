/**
 * "Added to bag" animation: a small copy of the product photo flies in an arc from where the
 * shopper tapped to the bag icon in the header, then the icon gives a little bounce.
 * Skipped for people who ask their device for reduced motion.
 */
export function flyToBag(image: string | null, from: Element | null) {
  if (typeof window === "undefined" || !from) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = [...document.querySelectorAll<HTMLElement>("[data-bag-target]")].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
  if (!target) return;

  const s = from.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const size = Math.min(110, Math.max(56, Math.min(s.width, s.height) * 0.45));
  const x0 = s.left + s.width / 2 - size / 2;
  const y0 = s.top + s.height / 2 - size / 2;
  const dx = t.left + t.width / 2 - (x0 + size / 2);
  const dy = t.top + t.height / 2 - (y0 + size / 2);

  const fly = document.createElement(image ? "img" : "span");
  if (image) (fly as HTMLImageElement).src = image;
  fly.setAttribute("aria-hidden", "true");
  Object.assign(fly.style, {
    position: "fixed",
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    objectFit: "cover",
    background: "#5e0f2c",
    border: "3px solid #fff",
    boxShadow: "0 10px 30px -8px rgb(94 15 44 / 0.55)",
    zIndex: "90",
    pointerEvents: "none",
  });
  document.body.appendChild(fly);

  // Arc: lift up a little first, then sweep into the bag while shrinking.
  const anim = fly.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 60}px) scale(0.85)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.6 },
    ],
    { duration: 750, easing: "cubic-bezier(0.5, 0, 0.3, 1)", fill: "forwards" },
  );
  anim.onfinish = () => {
    fly.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(0.92)" }, { transform: "scale(1)" }], { duration: 450, easing: "ease-out" });
  };
  anim.oncancel = () => fly.remove();
}
