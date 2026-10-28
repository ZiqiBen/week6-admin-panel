import { signOut } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminDeniedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <section className="surface w-full max-w-xl p-8 sm:p-10">
        <p className="text-sm font-medium text-[#ff9f0a]">Admin access required</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white">
          This account is not a superadmin.
        </h1>
        <p className="mt-4 leading-7 text-[#a1a1a6]">
          You signed in successfully{user?.email ? ` as ${user.email}` : ""}, but this
          account has not been granted access to the admin area. Ask the project owner
          to set this profile&apos;s <code>is_superadmin</code> value to <code>true</code>.
        </p>
        <form action={signOut} className="mt-8">
          <button className="primary-button w-full">Sign out and use another account</button>
        </form>
      </section>
    </main>
  );
}
