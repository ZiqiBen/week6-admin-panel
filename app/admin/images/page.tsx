/* eslint-disable @next/next/no-img-element */
import { deleteAdminImage, updateAdminImage, uploadAdminImage } from "../actions";
import { formatDate, requireSuperadmin } from "../admin";

export default async function AdminImagesPage({ searchParams }: PageProps<"/admin/images">) {
  const notices = await searchParams;
  const { supabase } = await requireSuperadmin();
  const { data, error } = await supabase.from("images").select("*").order("created_at", { ascending: false });
  const images = data ?? [];

  return (
    <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <aside className="surface h-fit p-6 sm:p-7 xl:sticky xl:top-6">
        <p className="text-sm text-[#63a9ff]">Upload</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Add an image</h1>
        <p className="mt-3 text-sm leading-6 text-[#9aa7b8]">Upload JPG, PNG, WebP, GIF, or another browser-supported image up to 10 MB.</p>
        <form action={uploadAdminImage} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-[#aebbd0]">Image file *<input name="file" type="file" accept="image/*" className="field file:mr-4 file:rounded-full file:border-0 file:bg-[#26374d] file:px-3 file:py-1 file:text-[#dce7f5]" required /></label>
          <label className="grid gap-2 text-sm text-[#aebbd0]">Title<input name="title" className="field" placeholder="Defaults to the file name" /></label>
          <label className="grid gap-2 text-sm text-[#aebbd0]">Alt text<textarea name="alt_text" className="field min-h-24" placeholder="Describe the image for accessibility" /></label>
          <button className="primary-button">Upload image</button>
        </form>
      </aside>

      <div className="surface p-6 sm:p-7">
        <p className="text-sm text-[#63a9ff]">Image library</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Images</h1>
        <p className="mt-3 text-sm leading-6 text-[#9aa7b8]">Create, view, update, and delete uploaded images.</p>
        {notices.saved && <p className="mt-5 rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100">Changes saved.</p>}
        {notices.deleted && <p className="mt-5 rounded-2xl bg-emerald-300/10 p-3 text-sm text-emerald-100">Image deleted.</p>}
        {notices.error && <p className="mt-5 rounded-2xl bg-rose-300/10 p-3 text-sm text-rose-100">The image operation failed. Check the file and required fields.</p>}
        {error && <p className="mt-5 rounded-2xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">Image storage is unavailable. Run <code>supabase/week7-admin-resources.sql</code> in Supabase SQL Editor.</p>}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {images.map((image) => (
            <article key={image.id} className="surface-soft overflow-hidden">
              <a href={image.public_url} target="_blank" rel="noreferrer" className="block aspect-video bg-black/20">
                <img src={image.public_url} alt={image.alt_text || image.title || "Uploaded image"} className="size-full object-cover" />
              </a>
              <div className="p-5">
                <p className="text-xs text-[#7f8da1]">{formatDate(image.created_at)} · {Math.max(1, Math.round((image.size_bytes ?? 0) / 1024))} KB</p>
                <form action={updateAdminImage} className="mt-4 grid gap-3">
                  <input type="hidden" name="id" value={image.id} />
                  <input name="title" defaultValue={image.title ?? ""} className="field" required aria-label="Title" />
                  <textarea name="alt_text" defaultValue={image.alt_text ?? ""} className="field min-h-24" aria-label="Alt text" />
                  <button className="secondary-button">Save metadata</button>
                </form>
                <form action={deleteAdminImage} className="mt-3">
                  <input type="hidden" name="id" value={image.id} />
                  <input type="hidden" name="storage_path" value={image.storage_path} />
                  <button className="text-sm font-medium text-[#ff8a82] hover:text-white">Delete image</button>
                </form>
              </div>
            </article>
          ))}
          {!error && !images.length && <p className="py-8 text-sm text-[#7f8da1]">No uploaded images found.</p>}
        </div>
      </div>
    </section>
  );
}
