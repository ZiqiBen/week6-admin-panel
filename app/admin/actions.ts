"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "./admin";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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
