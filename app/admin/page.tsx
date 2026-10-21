import Link from "next/link";
import { requireSuperadmin, formatDate } from "./admin";

export default async function AdminDashboard() {
  const { supabase } = await requireSuperadmin();
  const [users, media, ratings, recentMedia] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("ai_generations").select("id", { count: "exact", head: true }),
    supabase.from("generation_votes").select("id", { count: "exact", head: true }),
    supabase.from("ai_generations").select("id, category, generated_text, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const cards = [
    { label: "Profiles", value: users.count ?? 0, detail: "Registered accounts", href: "/admin/users" },
    { label: "AI media", value: media.count ?? 0, detail: "Generated posts", href: "/admin/media" },
    { label: "Ratings", value: ratings.count ?? 0, detail: "Upvotes and downvotes", href: "/admin/ratings" },
  ];

  return (
    <section>
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-[#63a9ff]">Operations overview</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Make the community legible.</h1>
        <p className="mt-4 text-base leading-7 text-[#9aa7b8]">A private view of the people, generated answers, and feedback shaping Pattern.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="surface p-6 transition hover:-translate-y-0.5 hover:border-[#3f628c]">
            <p className="text-sm text-[#9aa7b8]">{card.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm text-[#6f7e91]">{card.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="surface p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#9aa7b8]">Recent activity</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Latest generated media</h2>
            </div>
            <Link href="/admin/media" className="nav-link">Manage all</Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-white/[0.08] text-[#6f7e91]"><tr><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium">Preview</th><th className="pb-3 font-medium">Created</th></tr></thead>
              <tbody>
                {(recentMedia.data ?? []).map((item) => <tr key={item.id} className="border-b border-white/[0.06]"><td className="py-4 text-[#dce7f5]">{item.category}</td><td className="max-w-lg truncate py-4 text-[#9aa7b8]">{item.generated_text}</td><td className="py-4 text-[#7f8da1]">{formatDate(item.created_at)}</td></tr>)}
              </tbody>
            </table>
            {!recentMedia.data?.length && <p className="py-8 text-sm text-[#7f8da1]">No generated media yet.</p>}
          </div>
        </section>

        <section className="surface p-6">
          <p className="text-sm text-[#9aa7b8]">Admin checklist</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Keep the boundary clear.</h2>
          <ul className="mt-6 grid gap-4 text-sm leading-6 text-[#b8c5d6]">
            <li>✓ Google authentication required</li>
            <li>✓ Superadmin flag checked server-side</li>
            <li>✓ Supabase RLS protects mutations</li>
            <li>✓ Public app remains read-only for media</li>
          </ul>
        </section>
      </div>
    </section>
  );
}
