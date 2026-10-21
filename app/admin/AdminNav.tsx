import Link from "next/link";
import { signOut } from "../actions";

export function AdminNav() {
  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
      <div>
        <Link href="/admin" className="text-xl font-semibold tracking-tight text-white">Pattern / Admin</Link>
        <p className="mt-1 text-sm text-[#7f8da1]">AI media operations</p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="nav-link">Overview</Link>
        <Link href="/admin/users" className="nav-link">Users</Link>
        <Link href="/admin/media" className="nav-link">Media</Link>
        <Link href="/admin/ratings" className="nav-link">Ratings</Link>
        <Link href="/" className="nav-link">Public app</Link>
        <form action={signOut}><button className="nav-link">Sign out</button></form>
      </nav>
    </header>
  );
}
