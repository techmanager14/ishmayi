"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteMediaAction, listMediaAction, uploadMediaAction } from "@/app/admin/actions";
import { thumbUrl } from "@/lib/images";
import { btn, input } from "./ui";

export type MediaKind = "image" | "video" | "all";
type File_ = { id: string; name: string; url: string; kind: "image" | "video" | "other"; size: number; createdAt: string };

const MAX_SIDE = 2000;

/** Shrinks big photos in the browser so uploads are quick and pages stay light. */
async function prepare(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.2 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadFile(file: File): Promise<{ ok: boolean; url?: string; message: string }> {
  const ready = await prepare(file);
  const form = new FormData();
  form.set("file", ready);
  return uploadMediaAction(form);
}

const isVideoUrl = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

/** Library grid with upload; calls onPick with the chosen URL. Used in a modal and on the Media page. */
export function MediaLibrary({ kind = "all", onPick, manage = false }: { kind?: MediaKind; onPick?: (url: string) => void; manage?: boolean }) {
  const [files, setFiles] = useState<File_[]>([]);
  const [filter, setFilter] = useState<MediaKind>(kind);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const offset = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(
    async (reset: boolean) => {
      setLoading(true);
      setError("");
      if (reset) offset.current = 0;
      const res = await listMediaAction(offset.current, filter, query);
      if (!res.ok) setError(res.message ?? "Couldn't load the library.");
      setFiles((f) => (reset ? res.files : [...f, ...res.files]));
      setMore(res.more);
      offset.current += 60;
      setLoading(false);
    },
    [filter, query],
  );

  useEffect(() => {
    const t = setTimeout(() => void load(true), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const uploaded: string[] = [];
    for (const [i, f] of [...list].entries()) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      const res = await uploadFile(f);
      if (!res.ok) {
        setError(res.message);
        break;
      }
      uploaded.push(res.url!);
    }
    setBusy("");
    if (uploaded.length) {
      await load(true);
      if (onPick && uploaded.length === 1) onPick(uploaded[0]);
    }
  }

  async function remove(f: File_) {
    if (!window.confirm(`Delete “${f.name}” from the media library? Anything still using it will lose the picture.`)) return;
    setBusy("Deleting…");
    const res = await deleteMediaAction(f.id);
    setBusy("");
    if (!res.ok) setError(res.message);
    else setFiles((x) => x.filter((y) => y.id !== f.id));
  }

  const accept = filter === "image" ? "image/jpeg,image/png,image/webp" : filter === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,video/mp4,video/webm";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" aria-label="Search files" className={`${input} max-w-xs py-2`} />
        {kind === "all" && (
          <div className="flex gap-1 rounded-xl bg-ivory-deep p-1">
            {(["all", "image", "video"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${filter === k ? "bg-[#e3425c] text-white" : "text-ink-muted hover:text-charcoal"}`}
              >
                {k === "all" ? "All" : `${k}s`}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => fileInput.current?.click()} disabled={!!busy} className={`${btn.primary} ml-auto`}>
          ⬆ Upload
        </button>
        <input ref={fileInput} type="file" accept={accept} multiple className="hidden" onChange={(e) => void onFiles(e.target.files).then(() => (e.target.value = ""))} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Photos are resized automatically. Videos up to 11 MB upload here — bigger ones: upload in GoHighLevel → Media Storage and they appear in this list, or use a YouTube link.
      </p>
      {busy && <p className="mt-3 rounded-lg bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300">{busy}</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300">{error}</p>}

      <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {files.map((f) => (
          <li key={f.id} className="group relative overflow-hidden rounded-xl border border-parchment bg-ivory-deep">
            <button
              type="button"
              disabled={!onPick}
              onClick={() => onPick?.(f.url)}
              className="block aspect-square w-full disabled:cursor-default"
              title={f.name}
              aria-label={onPick ? `Use ${f.name}` : f.name}
            >
              {f.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl(f.url, 240)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : f.kind === "video" ? (
                <video src={f.url} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-ink-muted">File</span>
              )}
              {f.kind === "video" && <span className="absolute top-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">VIDEO</span>}
            </button>
            <p className="truncate px-2 py-1 text-[0.65rem] text-ink-muted">{f.name}</p>
            {manage && (
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button type="button" onClick={() => void navigator.clipboard.writeText(f.url)} className="rounded bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                  Copy link
                </button>
                <button type="button" onClick={() => void remove(f)} className="rounded bg-rose-600/90 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
        {loading && Array.from({ length: 12 }, (_, i) => <li key={`s${i}`} className="admin-skeleton aspect-square" aria-hidden="true" />)}
      </ul>
      {!loading && files.length === 0 && <p className="mt-6 text-center text-sm text-ink-muted">Nothing here yet — upload your first file.</p>}
      {more && !loading && (
        <div className="mt-4 text-center">
          <button type="button" onClick={() => void load(false)} className={btn.outline}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

/** A form field for one image or video: preview, pick from the library / upload, or paste a link. */
export function MediaField({
  label,
  value,
  onChange,
  kind = "image",
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "video";
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-charcoal">{label}</p>
      <div className="flex items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-parchment bg-ivory-deep">
          {value ? (
            isVideoUrl(value) || kind === "video" ? (
              <video src={value} muted preload="metadata" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbUrl(value, 160)} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full items-center justify-center text-[0.65rem] text-ink-muted">None</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className={btn.outline}>
              {value ? "Change" : "Choose / upload"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className={btn.ghost}>
                Remove
              </button>
            )}
          </div>
          <input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="…or paste a link (https://…)" aria-label={`${label} link`} className={`${input} py-2 text-xs`} />
          {hint && <p className="text-xs text-ink-muted">{hint}</p>}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-6" role="dialog" aria-modal="true" aria-label="Media library">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-parchment bg-panel p-5 md:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Media library</h2>
              <button type="button" onClick={() => setOpen(false)} className={btn.ghost}>
                Close ✕
              </button>
            </div>
            <MediaLibrary
              kind={kind}
              onPick={(url) => {
                onChange(url);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** "Upload photos" + "From library" buttons that add image URLs to a list (product photos). */
export function PhotoAdder({ onAdd }: { onAdd: (urls: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    const urls: string[] = [];
    for (const [i, f] of [...list].entries()) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      const res = await uploadFile(f);
      if (!res.ok) {
        setError(res.message);
        break;
      }
      urls.push(res.url!);
    }
    setBusy("");
    if (urls.length) onAdd(urls);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!!busy} onClick={() => fileInput.current?.click()} className={btn.outline}>
          ⬆ Upload photos
        </button>
        <button type="button" onClick={() => setOpen(true)} className={btn.outline}>
          🖼 From library
        </button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => void onFiles(e.target.files).then(() => (e.target.value = ""))} />
      </div>
      {busy && (
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-sky-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300" aria-hidden="true" /> {busy}
        </p>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{error}</p>}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label="Media library">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-parchment bg-panel p-5 md:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Choose a photo</h2>
              <button type="button" onClick={() => setOpen(false)} className={btn.ghost}>
                Close ✕
              </button>
            </div>
            <MediaLibrary
              kind="image"
              onPick={(url) => {
                onAdd([url]);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
