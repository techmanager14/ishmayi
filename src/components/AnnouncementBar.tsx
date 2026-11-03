import Link from "next/link";

/** Thin strip above the header, switched on from the admin panel (Content → Announcement). */
export function AnnouncementBar({ text, href }: { text: string; href?: string }) {
  const inner = <span className="font-semibold">{text}</span>;
  return (
    <div className="bg-charcoal px-4 py-2 text-center text-[0.8rem] text-white md:text-[0.85rem]">
      {href ? (
        <Link href={href} className="hover:underline">
          {inner} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
