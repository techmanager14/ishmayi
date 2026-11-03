import type { ReactNode } from "react";
import type { ArtMotif, ArtTone } from "@/data/shelves";
import { shopifySrcSet } from "@/lib/images";

// Original line artwork for categories, collections and banners. Stands in wherever
// there is no photograph yet; set `image` on the item to replace it.

const TONES: Record<ArtTone, { bg: string; line: string; fill: string; soft: string }> = {
  plum: { bg: "#5e0f2c", line: "#efdcb4", fill: "#fbf0dc", soft: "#7c2346" },
  ink: { bg: "#231d1b", line: "#cfc4b2", fill: "#f1ece4", soft: "#3a3230" },
  sand: { bg: "#efe6d8", line: "#7d5f2a", fill: "#fffdf9", soft: "#e2d5c0" },
  rose: { bg: "#efd8d2", line: "#8b4a55", fill: "#d59c9d", soft: "#e5c5be" },
  amethyst: { bg: "#3a2550", line: "#dcc9f0", fill: "#a587cc", soft: "#4d3468" },
  sage: { bg: "#dfe3d3", line: "#4c5a3f", fill: "#f6f6ec", soft: "#cdd4bd" },
  pearl: { bg: "#f6f0e7", line: "#8a7a5f", fill: "#fffdf9", soft: "#e9e0d1" },
};

type T = (typeof TONES)[ArtTone];

/** Points along an ellipse, angles in degrees (0 = right, 90 = down). */
const arc = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1 || 1)) * Math.PI) / 180;
    return [Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a))] as const;
  });

const Bead = ({ x, y, r, t, fill }: { x: number; y: number; r: number; t: T; fill?: string }) => (
  <>
    <circle cx={x} cy={y} r={r} fill={fill ?? t.fill} stroke={t.line} strokeWidth="1" />
    <circle cx={x - r * 0.32} cy={y - r * 0.32} r={r * 0.24} fill="#fff" opacity="0.75" />
  </>
);

const Gem = ({ x, y, s, t, fill }: { x: number; y: number; s: number; t: T; fill?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={t.line} strokeWidth={1.4 / s} strokeLinejoin="round">
    <path d="M-30-34H30L52-8 0 50-52-8Z" fill={fill ?? t.soft} />
    <path d="M-52-8H52M-30-34-16-8 0 50 16-8 30-34M-16-8 0-34 16-8" fill="none" />
  </g>
);

const Beads = ({ points, r, t, fill }: { points: readonly (readonly [number, number])[]; r: number; t: T; fill?: string }) => (
  <>
    {points.map(([x, y], i) => (
      <Bead key={i} x={x} y={y} r={r} t={t} fill={fill} />
    ))}
  </>
);

const MOTIFS: Record<ArtMotif, (t: T) => ReactNode> = {
  bolt: (t) => (
    <g stroke={t.line} strokeWidth="2" strokeLinejoin="round">
      <circle cx="200" cy="250" r="150" fill={t.soft} />
      <path d="M228 96 118 276h70l-20 128 116-188h-74Z" fill={t.line} />
      {[[66, 120], [336, 118], [58, 378], [344, 372]].map(([x, y]) => (
        <path key={x + y} d={`M${x} ${y - 16}v32M${x - 16} ${y}h32`} fill="none" />
      ))}
    </g>
  ),
  ring: (t) => (
    <>
      <circle cx="200" cy="292" r="92" fill="none" stroke={t.line} strokeWidth="15" />
      <circle cx="200" cy="292" r="77" fill="none" stroke={t.soft} strokeWidth="5" />
      <Gem x={200} y={158} s={1} t={t} fill={t.fill} />
    </>
  ),
  pendant: (t) => (
    <>
      <path d="M96 60C112 170 170 226 200 236 230 226 288 170 304 60" fill="none" stroke={t.line} strokeWidth="2.5" />
      <circle cx="200" cy="248" r="11" fill="none" stroke={t.line} strokeWidth="3" />
      <Gem x={200} y={322} s={1.05} t={t} fill={t.fill} />
    </>
  ),
  earrings: (t) => (
    <>
      {[124, 276].map((x) => (
        <g key={x}>
          <path d={`M${x} 118a15 15 0 1 1 15-15`} fill="none" stroke={t.line} strokeWidth="3" />
          <path d={`M${x} 118v34`} stroke={t.line} strokeWidth="2.5" />
          <Bead x={x} y={166} r={15} t={t} />
          <path d={`M${x} 181v26`} stroke={t.line} strokeWidth="2.5" />
          <Gem x={x} y={252} s={0.82} t={t} fill={t.fill} />
        </g>
      ))}
    </>
  ),
  necklace: (t) => (
    <>
      <path d="M86 92C94 230 150 322 200 322S306 230 314 92" fill="none" stroke={t.line} strokeWidth="1.2" />
      <Beads points={arc(200, 150, 118, 168, 20, 160, 15)} r={8} t={t} />
      <path d="M200 318v18" stroke={t.line} strokeWidth="1.4" />
      <Gem x={200} y={372} s={0.72} t={t} fill={t.fill} />
    </>
  ),
  bracelet: (t) => (
    <>
      <circle cx="200" cy="250" r="104" fill="none" stroke={t.soft} strokeWidth="26" />
      <Beads points={arc(200, 250, 104, 104, 0, 330, 12)} r={19} t={t} fill={t.fill} />
    </>
  ),
  pearlBracelet: (t) => (
    <>
      <Beads points={arc(200, 250, 106, 106, 0, 342, 20)} r={15} t={t} />
      <rect x="188" y="130" width="24" height="16" fill={t.line} />
    </>
  ),
  pearls: (t) => (
    <>
      <Beads points={arc(200, 130, 130, 90, 10, 170, 15)} r={9} t={t} />
      <Beads points={arc(200, 130, 138, 170, 18, 162, 19)} r={11} t={t} />
      <Beads points={arc(200, 130, 146, 250, 25, 155, 23)} r={13} t={t} />
    </>
  ),
  stones: (t) => (
    <>
      <Gem x={200} y={190} s={1.5} t={t} fill={t.fill} />
      <Gem x={108} y={312} s={0.9} t={t} />
      <Gem x={292} y={312} s={0.9} t={t} />
      <Gem x={200} y={375} s={0.6} t={t} />
    </>
  ),
  silver: (t) => (
    <g fill="none" stroke={t.line}>
      <circle cx="150" cy="210" r="76" strokeWidth="11" />
      <circle cx="250" cy="210" r="76" strokeWidth="3" />
      <circle cx="200" cy="300" r="76" strokeWidth="6" />
    </g>
  ),
  rose: (t) => (
    <g stroke={t.line} strokeWidth="1.3">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="200" cy="170" rx="58" ry="88" fill={t.soft} transform={`rotate(${a} 200 250)`} />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <ellipse key={a} cx="200" cy="202" rx="38" ry="56" fill={t.fill} transform={`rotate(${a} 200 250)`} />
      ))}
      <circle cx="200" cy="250" r="22" fill={t.bg} />
      <path d="M186 250a14 14 0 1 1 14 14M196 250a5 5 0 1 1 5 5" fill="none" />
    </g>
  ),
  amethyst: (t) => (
    <>
      <Gem x={200} y={225} s={2.3} t={t} fill={t.fill} />
      <Gem x={92} y={382} s={0.6} t={t} />
      <Gem x={310} y={385} s={0.5} t={t} />
    </>
  ),
  roseQuartz: (t) => (
    <>
      <circle cx="200" cy="245" r="112" fill={t.fill} stroke={t.line} strokeWidth="1.4" />
      <path d="M200 133 138 212l62 145 62-145ZM88 245h224M138 212h124" fill="none" stroke={t.line} strokeWidth="1.2" />
      <circle cx="158" cy="196" r="20" fill="#fff" opacity="0.5" />
    </>
  ),
  shawl: (t) => (
    <g fill="none" stroke={t.line} strokeWidth="1.2">
      {[0, 22, 44, 66, 88, 110, 132].map((d) => (
        <path key={d} d={`M60 ${95 + d}C140 ${60 + d} 180 ${190 + d} 340 ${120 + d}`} />
      ))}
      <path d="M60 227C140 192 180 322 340 252V330C200 400 150 290 60 320Z" fill={t.soft} />
      {Array.from({ length: 19 }, (_, i) => (
        <path key={i} d={`M${72 + i * 14} ${328 + Math.round(38 * Math.sin((i / 18) * 3.1))}v26`} />
      ))}
    </g>
  ),
  saree: (t) => (
    <g stroke={t.line} strokeWidth="1.3">
      <path d="M110 70 290 70 330 430 70 430Z" fill={t.soft} />
      <path d="M110 70 330 310M170 70 330 245M86 330 200 430M74 390 112 430" fill="none" />
      <path d="M70 430 330 430 326 396 74 396Z" fill={t.fill} />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={92 + i * 20} cy={413} r="5" fill={t.line} />
      ))}
    </g>
  ),
  painting: (t) => (
    <g stroke={t.line} strokeWidth="1.4">
      <rect x="82" y="78" width="236" height="344" fill={t.soft} />
      <rect x="102" y="98" width="196" height="304" fill={t.bg} />
      <circle cx="240" cy="176" r="36" fill={t.line} />
      <path d="M102 322c44-74 78-74 118-14 22-34 48-44 78-22v116H102Z" fill={t.fill} opacity="0.85" />
      <path d="M102 362c60-40 110-22 196-8" fill="none" />
    </g>
  ),
  indian: (t) => (
    <g stroke={t.line} strokeWidth="1.3">
      <path d="M200 80v44" fill="none" />
      <circle cx="200" cy="72" r="11" fill={t.fill} />
      <path d="M116 262C116 182 160 124 200 124s84 58 84 138Z" fill={t.soft} />
      <path d="M140 262C140 200 170 150 200 150s60 50 60 112M170 262c0-60 14-90 30-112 16 22 30 52 30 112" fill="none" />
      <Beads points={arc(200, 262, 84, 12, 180, 0, 9)} r={8} t={t} />
      {arc(200, 278, 80, 8, 170, 10, 9).map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y}v${i % 2 ? 42 : 66}`} fill="none" />
          <Bead x={x} y={y + (i % 2 ? 50 : 74)} r={8} t={t} />
        </g>
      ))}
    </g>
  ),
  western: (t) => (
    <g fill="none" stroke={t.line}>
      <circle cx="150" cy="250" r="86" strokeWidth="5" />
      <path d="M270 96v308" strokeWidth="5" />
      <circle cx="270" cy="88" r="9" fill={t.line} />
      <rect x="252" y="404" width="36" height="12" fill={t.line} />
    </g>
  ),
  daily: (t) => (
    <>
      <path d="M90 100C100 260 160 300 200 300S300 260 310 100" fill="none" stroke={t.line} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      <path d="M200 300v22" stroke={t.line} strokeWidth="1.4" />
      <Bead x={200} y={338} r={17} t={t} />
    </>
  ),
  clothing: (t) => (
    <g stroke={t.line} strokeWidth="1.4">
      <path d="M200 112a20 20 0 1 0-20-20M200 112v18" fill="none" />
      <path d="M200 130 66 198h268Z" fill="none" />
      <path d="M92 198h216l34 234H58Z" fill={t.soft} />
      <path d="M140 198 110 432M200 198v234M260 198l30 234" fill="none" />
    </g>
  ),
  sparkle: (t) => (
    <g fill={t.line}>
      <path d="M200 110c10 90 28 120 92 140-64 20-82 50-92 140-10-90-28-120-92-140 64-20 82-50 92-140Z" />
      <path d="M312 96c4 34 12 44 36 52-24 8-32 18-36 52-4-34-12-44-36-52 24-8 32-18 36-52Z" opacity="0.7" />
      <path d="M88 322c3 24 8 31 26 37-18 6-23 13-26 37-3-24-8-31-26-37 18-6 23-13 26-37Z" opacity="0.7" />
    </g>
  ),
  diya: (t) => (
    <g stroke={t.line} strokeWidth="1.4">
      <path d="M200 110c30 44 40 70 40 92a40 40 0 0 1-80 0c0-22 10-48 40-92Z" fill={t.line} />
      <path d="M200 164c13 20 18 30 18 40a18 18 0 0 1-36 0c0-10 5-20 18-40Z" fill={t.bg} />
      <path d="M86 276h228c-8 68-52 104-114 104S94 344 86 276Z" fill={t.soft} />
      <path d="M86 276c40 26 188 26 228 0M138 380h124" fill="none" />
      {[-62, -36, 36, 62].map((a) => (
        <path key={a} d={`M200 200 ${Math.round(200 + 140 * Math.sin((a * Math.PI) / 180))} ${Math.round(200 - 140 * Math.cos((a * Math.PI) / 180))}`} fill="none" strokeDasharray="2 8" strokeLinecap="round" />
      ))}
    </g>
  ),
  tag: (t) => (
    <g stroke={t.line} strokeWidth="1.5">
      <path d="M130 118 270 118 318 170V390H82V170Z" fill={t.soft} transform="rotate(10 200 250)" />
      <circle cx="210" cy="164" r="13" fill={t.bg} />
      <path d="M210 151C206 98 250 82 278 104" fill="none" />
      <path d="M146 318 266 214" fill="none" />
      <circle cx="152" cy="238" r="20" fill="none" />
      <circle cx="254" cy="302" r="20" fill="none" />
    </g>
  ),
  ticket: (t) => (
    <g stroke={t.line} strokeWidth="1.5" transform="rotate(-8 200 250)">
      <path d="M62 168h276v52a30 30 0 0 0 0 60v52H62v-52a30 30 0 0 0 0-60Z" fill={t.soft} />
      <path d="M262 168v164" fill="none" strokeDasharray="5 8" />
      <path d="M96 222h126M96 250h126M96 278h76" fill="none" />
    </g>
  ),
  boxes: (t) => (
    <g stroke={t.line} strokeWidth="1.4">
      {[
        [86, 262],
        [204, 262],
        [145, 142],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="112" height="112" fill={t.soft} />
          <path d={`M${x + 56} ${y}v112M${x} ${y + 56}h112`} fill="none" />
          <path d={`M${x + 56} ${y}c-34-24-34 6 0 0 34 6 34-24 0 0Z`} fill={t.fill} />
        </g>
      ))}
    </g>
  ),
  sets: (t) => (
    <>
      <path d="M116 84C124 196 164 268 200 268S276 196 284 84" fill="none" stroke={t.line} strokeWidth="1.2" />
      <Beads points={arc(200, 124, 86, 138, 25, 155, 11)} r={7} t={t} />
      <Gem x={200} y={296} s={0.5} t={t} fill={t.fill} />
      {[108, 292].map((x) => (
        <g key={x}>
          <path d={`M${x} 346v18`} stroke={t.line} strokeWidth="1.3" />
          <Bead x={x} y={338} r={8} t={t} />
          <Gem x={x} y={388} s={0.42} t={t} fill={t.fill} />
        </g>
      ))}
    </>
  ),
};

export function Art({ motif, tone, className = "", fit = "cover" }: { motif: ArtMotif; tone: ArtTone; className?: string; fit?: "cover" | "contain" }) {
  const t = TONES[tone];
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"} className={className} style={{ backgroundColor: t.bg }} aria-hidden="true">
      {MOTIFS[motif](t)}
    </svg>
  );
}

/** Photo when there is one, artwork otherwise. Fills its positioned parent. */
export function ArtOrPhoto({ image, motif, tone, sizes, className = "", fit }: { image?: string; motif: ArtMotif; tone: ArtTone; sizes: string; className?: string; fit?: "cover" | "contain" }) {
  if (!image) return <Art motif={motif} tone={tone} fit={fit} className={`h-full w-full ${className}`} />;
  return <Photo src={image} alt="" sizes={sizes} className={className} />;
}

export function Photo({ src, alt, sizes, className = "", eager = false }: { src: string; alt: string; sizes: string; className?: string; eager?: boolean }) {
  const img = shopifySrcSet(src, [240, 320, 480, 640, 828, 1080, 1280]);
  return (
    // Plain <img>: sources are the store's own image hosts, already optimised by srcset.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img.src} srcSet={img.srcSet} sizes={sizes} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} className={`h-full w-full object-cover ${className}`} />
  );
}
