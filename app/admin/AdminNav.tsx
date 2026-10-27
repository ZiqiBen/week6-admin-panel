import Link from "next/link";
import { signOut } from "../actions";
import { ADMIN_RESOURCES } from "./resources";

export function AdminNav() {
  return (
    <header className="mb-10 grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
      <div>
        <Link href="/admin" className="text-xl font-semibold tracking-tight text-white">Pattern / Admin</Link>
        <p className="mt-1 text-sm text-[#7f8da1]">Content, AI, access, and model operations</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="nav-link">Overview</Link>
        <Link href="/admin/users" className="nav-link">Users</Link>
        <Link href="/admin/media" className="nav-link">Media</Link>
        <Link href="/admin/images" className="nav-link">Images</Link>
        <Link href="/admin/ratings" className="nav-link">Ratings</Link>
        <Link href="/" className="nav-link">Public app</Link>
        <form action={signOut}><button className="nav-link">Sign out</button></form>
      </nav>
      </div>
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-2" aria-label="Admin data resources">
        {ADMIN_RESOURCES.map((resource) => <Link key={resource.slug} href={`/admin/data/${resource.slug}`} className="nav-link shrink-0">{resource.label}</Link>)}
      </nav>
    </header>
  );
}
