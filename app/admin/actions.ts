"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "./admin";
import { getAdminResource, type ResourceField } from "./resources";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseField(formData: FormData, field: ResourceField) {
  if (field.type === "checkbox") return formData.has(field.name);
  const value = text(formData, field.name);
  if (!value) return null;
  if (field.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`Invalid number for ${field.name}`);
    return number;
  }
  if (field.type === "json") return JSON.parse(value);
  if (field.name === "email" || field.name === "domain") return value.toLowerCase();
  return value;
}

function resourcePath(slug: string, state?: string) {
  return `/admin/data/${slug}${state ? `?${state}=1` : ""}`;
}

function getWritableResource(formData: FormData, operation: "create" | "update" | "delete") {
  const slug = text(formData, "resource");
  const resource = getAdminResource(slug);
  const allowed = resource && (operation === "update" ? resource.permission !== "read" : resource.permission === "crud");
  if (!resource || !allowed) throw new Error("This resource does not allow that operation.");
  return resource;
}

export async function createAdminResource(formData: FormData) {
  const resource = getWritableResource(formData, "create");
  const { supabase } = await requireSuperadmin();
  let values: Record<string, unknown>;
  try {
    values = Object.fromEntries(resource.fields.map((field) => [field.name, parseField(formData, field)]));
  } catch {
    redirect(`${resourcePath(resource.slug)}?error=invalid`);
  }
  if (resource.fields.some((field) => field.required && !values![field.name])) redirect(`${resourcePath(resource.slug)}?error=required`);

  const { error } = await supabase.from(resource.table).insert(values!);
  if (error) redirect(`${resourcePath(resource.slug)}?error=create`);
  revalidatePath("/admin");
  revalidatePath(resourcePath(resource.slug));
  redirect(resourcePath(resource.slug, "saved"));
}

export async function updateAdminResource(formData: FormData) {
  const resource = getWritableResource(formData, "update");
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  if (!id) redirect(`${resourcePath(resource.slug)}?error=update`);

  let values: Record<string, unknown>;
  try {
    values = Object.fromEntries(resource.fields.map((field) => [field.name, parseField(formData, field)]));
  } catch {
    redirect(`${resourcePath(resource.slug)}?error=invalid`);
  }
  if (resource.fields.some((field) => field.required && !values![field.name])) redirect(`${resourcePath(resource.slug)}?error=required`);

  const { error } = await supabase.from(resource.table).update(values!).eq("id", id);
  if (error) redirect(`${resourcePath(resource.slug)}?error=update`);
  revalidatePath("/admin");
  revalidatePath(resourcePath(resource.slug));
  redirect(resourcePath(resource.slug, "saved"));
}

export async function deleteAdminResource(formData: FormData) {
  const resource = getWritableResource(formData, "delete");
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  if (!id) redirect(`${resourcePath(resource.slug)}?error=delete`);

  const { error } = await supabase.from(resource.table).delete().eq("id", id);
  if (error) redirect(`${resourcePath(resource.slug)}?error=delete`);
  revalidatePath("/admin");
  revalidatePath(resourcePath(resource.slug));
  redirect(resourcePath(resource.slug, "deleted"));
}

export async function uploadAdminImage(formData: FormData) {
  const { supabase, user } = await requireSuperadmin();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    redirect("/admin/images?error=file");
  }

  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("images").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) redirect("/admin/images?error=upload");

  const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(storagePath);
  const { error } = await supabase.from("images").insert({
    title: text(formData, "title") || file.name,
    alt_text: text(formData, "alt_text"),
    storage_path: storagePath,
    public_url: publicUrl.publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    created_by: user.id,
  });
  if (error) {
    await supabase.storage.from("images").remove([storagePath]);
    redirect("/admin/images?error=create");
  }
  revalidatePath("/admin/images");
  redirect("/admin/images?saved=1");
}

export async function updateAdminImage(formData: FormData) {
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  const title = text(formData, "title");
  if (!id || !title) redirect("/admin/images?error=required");
  const { error } = await supabase.from("images").update({ title, alt_text: text(formData, "alt_text") }).eq("id", id);
  if (error) redirect("/admin/images?error=update");
  revalidatePath("/admin/images");
  redirect("/admin/images?saved=1");
}

export async function deleteAdminImage(formData: FormData) {
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  const storagePath = text(formData, "storage_path");
  if (!id || !storagePath) redirect("/admin/images?error=delete");

  const { error } = await supabase.from("images").delete().eq("id", id);
  if (error) redirect("/admin/images?error=delete");
  await supabase.storage.from("images").remove([storagePath]);
  revalidatePath("/admin/images");
  redirect("/admin/images?deleted=1");
}

export async function createAdminGeneration(formData: FormData) {
  const { supabase, user } = await requireSuperadmin();
  const category = text(formData, "category") || "Arrays";
  const prompt = text(formData, "prompt");
  const generatedText = text(formData, "generated_text");

  if (!prompt || !generatedText) redirect("/admin/media?error=required");

  const { error } = await supabase.from("ai_generations").insert({
    user_id: user.id,
    category,
    prompt,
    generated_text: generatedText,
  });

  if (error) redirect("/admin/media?error=create");
  revalidatePath("/admin");
  revalidatePath("/admin/media");
  redirect("/admin/media?saved=1");
}

export async function updateAdminGeneration(formData: FormData) {
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  const category = text(formData, "category") || "Arrays";
  const prompt = text(formData, "prompt");
  const generatedText = text(formData, "generated_text");

  if (!id || !prompt || !generatedText) redirect("/admin/media?error=required");

  const { error } = await supabase
    .from("ai_generations")
    .update({ category, prompt, generated_text: generatedText })
    .eq("id", id);

  if (error) redirect("/admin/media?error=update");
  revalidatePath("/admin");
  revalidatePath("/admin/media");
  redirect("/admin/media?saved=1");
}

export async function deleteAdminGeneration(formData: FormData) {
  const { supabase } = await requireSuperadmin();
  const id = text(formData, "id");
  if (!id) redirect("/admin/media?error=delete");

  const { error } = await supabase.from("ai_generations").delete().eq("id", id);
  if (error) redirect("/admin/media?error=delete");

  revalidatePath("/admin");
  revalidatePath("/admin/media");
  revalidatePath("/ai-coach");
  redirect("/admin/media?deleted=1");
}
