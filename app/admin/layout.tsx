import { AdminNav } from "./AdminNav";
import { requireSuperadmin } from "./admin";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireSuperadmin();

  return (
    <main className="page-shell min-h-screen">
      <div className="page-wrap max-w-[1440px]">
        <AdminNav />
        {children}
      </div>
    </main>
  );
}
