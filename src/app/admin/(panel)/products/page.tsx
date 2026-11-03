import Link from "next/link";
import { Badge, Card, Empty, GhlError, PageTitle, Tabs, btn, input } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { listProducts } from "@/lib/admin/data";
import { thumbUrl } from "@/lib/catalog";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; deleted?: string }> }) {
  await requireAdmin();
  const { view = "sale", q, deleted } = await searchParams;
  let all;
  try {
    all = await listProducts();
  } catch (err) {
    return <GhlError error={err} />;
  }
  const query = (q ?? "").trim().toLowerCase();
  const filter = (v: string) =>
    all.filter((p) => (v === "sale" ? p.onSale : v === "soon" ? !p.onSale && p.categories.length > 0 : v === "hidden" ? !p.onSale && p.categories.length === 0 : true));
  const rows = filter(view).filter((p) => !query || p.name.toLowerCase().includes(query));
  const tab = (v: string, l: string) => ({ href: `/admin/products?view=${v}`, label: l, active: view === v, count: filter(v).length });

  return (
    <>
      <PageTitle
        title="Products"
        sub="Products, prices and photos live in your GoHighLevel store. Only products in an on-sale category appear on the website."
        actions={
          <Link href="/admin/products/new" className={btn.primary}>
            + Add product
          </Link>
        }
      />
      {deleted && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Product deleted.</p>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs items={[tab("sale", "On sale"), tab("soon", "Coming-soon categories"), tab("hidden", "Not on website"), tab("all", "All")]} />
        <form className="flex gap-2" action="/admin/products">
          <input type="hidden" name="view" value={view} />
          <input name="q" defaultValue={q} placeholder="Search products" className={`${input} w-56 py-2`} aria-label="Search products" />
          <button className={btn.outline}>Search</button>
        </form>
      </div>
      <Card>
        {rows.length === 0 ? (
          <Empty>
            {view === "sale" ? (
              <>
                Nothing on sale yet. <Link href="/admin/products/new" className="font-bold text-[#ff8197]">Add a product</Link> and tick Necklaces, Pyrite
                Anklets or Fashion Jewellery.
              </>
            ) : (
              "No products here."
            )}
          </Empty>
        ) : (
          <ul className="-mx-2 divide-y divide-parchment">
            {rows.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-ivory-deep">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ivory-deep">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl(p.image, 96)} alt="" loading="lazy" decoding="async" width={56} height={56} className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-charcoal">{p.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{p.categories.join(", ") || "No website category"}</span>
                  </span>
                  <Badge status={p.onSale ? "on-sale" : p.categories.length ? "soon" : "hidden"} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
