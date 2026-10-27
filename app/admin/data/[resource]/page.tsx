import { notFound } from "next/navigation";
import { createAdminResource, deleteAdminResource, updateAdminResource } from "../../actions";
import { formatDate, requireSuperadmin } from "../../admin";
import { getAdminResource, type ResourceField } from "../../resources";

type Row = Record<string, unknown> & { id: string; created_at?: string };

function inputValue(value: unknown, field: ResourceField) {
  if (value == null) return "";
  if (field.type === "json") return JSON.stringify(value, null, 2);
  return String(value);
}

function Field({ field, value, creating = false }: { field: ResourceField; value?: unknown; creating?: boolean }) {
  const base = "field w-full";
  if (field.type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 text-sm text-[#c5d2e4]">
        <input name={field.name} type="checkbox" defaultChecked={creating ? true : Boolean(value)} className="size-4 accent-[#63a9ff]" />
        {field.label}
      </label>
    );
  }

  const label = <span>{field.label}{field.required ? " *" : ""}</span>;
  const props = {
    name: field.name,
    required: field.required,
    defaultValue: inputValue(value, field),
    placeholder: field.placeholder,
  };
  return (
    <label className="grid gap-2 text-sm text-[#aebbd0]">
      {label}
      {field.type === "textarea" || field.type === "json" ? (
        <textarea {...props} className={`${base} min-h-28 font-${field.type === "json" ? "mono" : "sans"}`} />
      ) : (
        <input {...props} type={field.type ?? "text"} className={base} />
      )}
      {field.help && <span className="text-xs text-[#6f7e91]">{field.help}</span>}
    </label>
  );
}

function ReadValue({ field, value }: { field: ResourceField; value: unknown }) {
  if (field.type === "checkbox") return <span>{value ? "Yes" : "No"}</span>;
  if (field.type === "json") return <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">{inputValue(value, field)}</pre>;
  if (field.type === "url" && value) return <a href={String(value)} target="_blank" rel="noreferrer" className="text-[#8dc3ff] underline">{String(value)}</a>;
  return <span className="whitespace-pre-wrap break-words">{inputValue(value, field) || "—"}</span>;
}

export default async function AdminDataPage({ params, searchParams }: PageProps<"/admin/data/[resource]">) {
  const { resource: slug } = await params;
  const notices = await searchParams;
  const resource = getAdminResource(slug);
  if (!resource) notFound();

  const { supabase } = await requireSuperadmin();
  const query = supabase.from(resource.table).select("*").order(resource.orderBy ?? "created_at", { ascending: resource.orderBy === "step_order" });
  const { data, error } = await query;
  const rows = (data ?? []) as Row[];
  const canEdit = resource.permission !== "read";
  const canCreate = resource.permission === "crud";

  return (
    <section className={canCreate ? "grid gap-6 xl:grid-cols-[0.72fr_1.28fr]" : "grid gap-6"}>
      {canCreate && (
        <aside className="surface h-fit p-6 sm:p-7 xl:sticky xl:top-6">
          <p className="text-sm text-[#63a9ff]">Create</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Add {resource.singular}</h1>
          <p className="mt-3 text-sm leading-6 text-[#9aa7b8]">{resource.description}</p>
          <form action={createAdminResource} className="mt-6 grid gap-4">
            <input type="hidden" name="resource" value={resource.slug} />
            {resource.fields.map((field) => <Field key={field.name} field={field} creating />)}
            <button className="primary-button">Create {resource.singular}</button>
          </form>
        </aside>
      )}

      <div className="surface min-w-0 p-6 sm:p-7">
        <p className="text-sm text-[#63a9ff]">{canEdit ? "Manage" : "Read only"}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{resource.label}</h1>
        <p className="mt-3 text-sm leading-6 text-[#9aa7b8]">{resource.description}</p>
        {notices.saved && <p className="mt-5 rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100">Changes saved.</p>}
        {notices.deleted && <p className="mt-5 rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100">Record deleted.</p>}
        {notices.error && <p className="mt-5 rounded-2xl bg-rose-300/10 p-3 text-sm text-rose-100">The change could not be saved. Check required fields, IDs, and JSON formatting.</p>}
        {error && <p className="mt-5 rounded-2xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">This table is unavailable. Run <code>supabase/week7-admin-resources.sql</code> in Supabase SQL Editor, then refresh.</p>}

        <div className="mt-7 grid gap-5">
          {rows.map((row) => (
            <article key={row.id} className="surface-soft p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#7f8da1]">{row.id}</span>
                {row.created_at && <span className="text-xs text-[#7f8da1]">{formatDate(row.created_at)}</span>}
              </div>
              {canEdit ? (
                <>
                  <form action={updateAdminResource} className="grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="resource" value={resource.slug} />
                    <input type="hidden" name="id" value={row.id} />
                    {resource.fields.map((field) => <Field key={field.name} field={field} value={row[field.name]} />)}
                    <div className="md:col-span-2"><button className="primary-button">Save changes</button></div>
                  </form>
                  {resource.permission === "crud" && (
                    <form action={deleteAdminResource} className="mt-4 border-t border-white/[0.07] pt-4">
                      <input type="hidden" name="resource" value={resource.slug} />
                      <input type="hidden" name="id" value={row.id} />
                      <button className="text-sm font-medium text-[#ff8a82] hover:text-white">Delete {resource.singular}</button>
                    </form>
                  )}
                </>
              ) : (
                <dl className="grid gap-4 md:grid-cols-2">
                  {resource.fields.map((field) => (
                    <div key={field.name} className={field.type === "textarea" || field.type === "json" ? "md:col-span-2" : ""}>
                      <dt className="text-xs uppercase tracking-[0.12em] text-[#6f7e91]">{field.label}</dt>
                      <dd className="mt-1 text-sm leading-6 text-[#c5d2e4]"><ReadValue field={field} value={row[field.name]} /></dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          ))}
          {!error && !rows.length && <p className="py-8 text-sm text-[#7f8da1]">No {resource.label.toLowerCase()} found.</p>}
        </div>
      </div>
    </section>
  );
}
