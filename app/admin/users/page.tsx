import { requireSuperadmin, formatDate } from "../admin";

export default async function AdminUsersPage() {
  const { supabase } = await requireSuperadmin();
  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, avatar_url, is_superadmin, created_at").order("created_at", { ascending: false });
  const rows = profiles ?? [];

  return <section className="surface p-6 sm:p-8">
    <div className="mb-7"><p className="text-sm text-[#63a9ff]">People</p><h1 className="mt-2 text-3xl font-semibold text-white">Users & profiles</h1><p className="mt-3 text-sm leading-6 text-[#9aa7b8]">Read-only account and profile visibility for operations.</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-white/[0.08] text-[#6f7e91]"><tr><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Profile ID</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Joined</th></tr></thead><tbody>{rows.map((profile) => <tr key={profile.id} className="border-b border-white/[0.06]"><td className="py-4"><div className="font-medium text-[#eaf2ff]">{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed member"}</div><div className="mt-1 text-xs text-[#7f8da1]">{profile.avatar_url ? "Avatar uploaded" : "No avatar"}</div></td><td className="py-4 font-mono text-xs text-[#7f8da1]">{profile.id}</td><td className="py-4">{profile.is_superadmin ? <span className="rounded-full bg-[#63a9ff]/15 px-3 py-1 text-xs text-[#9bc9ff]">Superadmin</span> : <span className="text-[#9aa7b8]">Member</span>}</td><td className="py-4 text-[#9aa7b8]">{formatDate(profile.created_at)}</td></tr>)}</tbody></table>{!rows.length && <p className="py-8 text-sm text-[#7f8da1]">No profiles found.</p>}</div>
  </section>;
}
