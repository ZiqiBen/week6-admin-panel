"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function getSiteUrl(origin: string | null) {
  if (origin && !origin.includes("localhost")) {
    return origin;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return origin ?? "http://localhost:3000";
}

async function buildCommunityPost(category: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
  const systemPrompt = `You are a precise computer science tutor for a Columbia undergraduate. Category: "${category}". Question: "${prompt}". Write a self-contained answer of 90 to 140 words. First answer the exact question in plain English. Then give a small concrete example. End with one common mistake or limitation. Use complete sentences. Do not use markdown headings, filler, or repeat the question.`;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const failures: string[] = [];

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 512,
            },
          }),
        },
      );

      if (!response.ok) {
        const details = await response.text();
        failures.push(`${model}: HTTP ${response.status}`);
        console.error("Gemini API error", model, response.status, details);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === "string" && text.trim().length >= 120) {
        return text.trim();
      }

      failures.push(`${model}: incomplete response`);
      console.error("Gemini returned an incomplete response", model, JSON.stringify(data));
    } catch (error) {
      failures.push(`${model}: request failed`);
      console.error("Gemini request failed", model, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`All Gemini models failed: ${failures.join("; ")}`);
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin = getSiteUrl(headerStore.get("origin"));
  const requestedNext = formData.get("next");
  const next = typeof requestedNext === "string" && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/profile";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const firstName = clean(formData.get("first_name"));
  const lastName = clean(formData.get("last_name"));
  const file = formData.get("avatar") as File | null;
  let avatarUrl = clean(formData.get("current_avatar_url"));

  if (file && file.size > 0) {
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }
  }

  await supabase.from("profiles").upsert({
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/study-plan");
  redirect("/?profile=saved");
}

export async function createAiGeneration(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const category = clean(formData.get("category")) ?? "Arrays";
  const prompt = clean(formData.get("prompt")) ?? "Give me one useful LeetCode interview study tip.";
  let generatedText: string;
  try {
    generatedText = await buildCommunityPost(category, prompt);
  } catch (error) {
    console.error("Community post generation failed", error);
    redirect("/ai-coach?error=generation");
  }

  await supabase.from("ai_generations").insert({
    user_id: user.id,
    category,
    prompt,
    generated_text: generatedText,
  });

  revalidatePath("/");
  revalidatePath("/ai-coach");
  redirect("/ai-coach?generated=1");
}

export async function voteOnGeneration(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const generationId = clean(formData.get("generation_id"));
  const voteText = clean(formData.get("vote"));
  const vote = voteText === "-1" ? -1 : 1;

  if (!generationId) {
    redirect("/ai-coach");
  }

  await supabase.from("generation_votes").upsert(
    {
      generation_id: generationId,
      user_id: user.id,
      vote,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "generation_id,user_id" },
  );

  revalidatePath("/ai-coach");
  redirect("/ai-coach?voted=1");
}

export async function togglePatternSolved(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const patternId = Number(formData.get("pattern_id"));
  if (!Number.isSafeInteger(patternId) || patternId <= 0) {
    return;
  }

  const { data: pattern } = await supabase
    .from("patterns")
    .select("id, example_problem")
    .eq("id", patternId)
    .single<{ id: number; example_problem: string }>();

  if (!pattern) {
    return;
  }

  const { data: existing } = await supabase
    .from("solved_problems")
    .select("id")
    .eq("user_id", user.id)
    .eq("pattern_id", patternId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    await supabase
      .from("solved_problems")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
  } else {
    await supabase.from("solved_problems").insert({
      user_id: user.id,
      pattern_id: patternId,
      problem_name: pattern.example_problem,
    });
  }

  revalidatePath("/");
}
