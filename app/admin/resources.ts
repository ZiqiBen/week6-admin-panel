export type FieldType = "text" | "email" | "url" | "textarea" | "number" | "checkbox" | "json";

export type ResourceField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type ResourcePermission = "read" | "update" | "crud";

export type AdminResource = {
  slug: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  permission: ResourcePermission;
  fields: ResourceField[];
  orderBy?: string;
};

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    slug: "prompt-chains",
    table: "prompt_chains",
    label: "Prompt chains",
    singular: "prompt chain",
    description: "Read the configured prompt workflows.",
    permission: "read",
    fields: [
      { name: "name", label: "Name" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "prompt-chain-steps",
    table: "prompt_chain_steps",
    label: "Prompt chain steps",
    singular: "prompt chain step",
    description: "Read the ordered steps that make up each prompt chain.",
    permission: "read",
    fields: [
      { name: "prompt_chain_id", label: "Prompt chain ID" },
      { name: "step_order", label: "Order", type: "number" },
      { name: "name", label: "Name" },
      { name: "prompt_template", label: "Prompt template", type: "textarea" },
      { name: "model_id", label: "Model ID" },
    ],
    orderBy: "step_order",
  },
  {
    slug: "prompt-chain-mix",
    table: "prompt_chain_mix",
    label: "Prompt chain mix",
    singular: "prompt chain mix",
    description: "Read and update the mix used to select prompt chains.",
    permission: "update",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "chain_ids", label: "Chain IDs", type: "json", help: "JSON array of prompt chain UUIDs." },
      { name: "weights", label: "Weights", type: "json", help: "JSON object or array of weights." },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "terms",
    table: "terms",
    label: "Terms",
    singular: "term",
    description: "Create, read, update, and delete glossary terms.",
    permission: "crud",
    fields: [
      { name: "term", label: "Term", required: true },
      { name: "definition", label: "Definition", type: "textarea", required: true },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "generation-requests",
    table: "generation_requests",
    label: "Generation requests",
    singular: "generation request",
    description: "Read AI generation requests and their processing status.",
    permission: "read",
    fields: [
      { name: "user_id", label: "User ID" },
      { name: "prompt", label: "Prompt", type: "textarea" },
      { name: "status", label: "Status" },
      { name: "requested_media_type", label: "Media type" },
      { name: "completed_at", label: "Completed at" },
    ],
  },
  {
    slug: "ai-generation-examples",
    table: "ai_generation_examples",
    label: "AI generation examples",
    singular: "AI generation example",
    description: "Maintain curated examples for generation and evaluation.",
    permission: "crud",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "prompt", label: "Prompt", type: "textarea", required: true },
      { name: "response", label: "Response", type: "textarea", required: true },
      { name: "media_url", label: "Media URL", type: "url" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "llm-models",
    table: "llm_models",
    label: "LLM models",
    singular: "LLM model",
    description: "Maintain the models available to generation workflows.",
    permission: "crud",
    fields: [
      { name: "provider_id", label: "Provider ID", required: true },
      { name: "name", label: "Display name", required: true },
      { name: "model_key", label: "Model key", required: true },
      { name: "context_window", label: "Context window", type: "number" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "llm-providers",
    table: "llm_providers",
    label: "LLM providers",
    singular: "LLM provider",
    description: "Maintain provider metadata without exposing credentials.",
    permission: "crud",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "base_url", label: "Base URL", type: "url" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "llm-responses",
    table: "llm_responses",
    label: "LLM responses",
    singular: "LLM response",
    description: "Read model responses and operational metadata.",
    permission: "read",
    fields: [
      { name: "request_id", label: "Request ID" },
      { name: "model_id", label: "Model ID" },
      { name: "response_text", label: "Response", type: "textarea" },
      { name: "prompt_tokens", label: "Prompt tokens", type: "number" },
      { name: "completion_tokens", label: "Completion tokens", type: "number" },
      { name: "latency_ms", label: "Latency (ms)", type: "number" },
    ],
  },
  {
    slug: "allowed-signup-domains",
    table: "allowed_signup_domains",
    label: "Allowed signup domains",
    singular: "allowed signup domain",
    description: "Control which e-mail domains may create accounts.",
    permission: "crud",
    fields: [
      { name: "domain", label: "Domain", required: true, placeholder: "example.edu" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
  {
    slug: "whitelisted-email-addresses",
    table: "whitelisted_email_addresses",
    label: "Whitelisted e-mail addresses",
    singular: "whitelisted e-mail address",
    description: "Manage individual e-mail addresses allowed to sign up.",
    permission: "crud",
    fields: [
      { name: "email", label: "E-mail address", type: "email", required: true },
      { name: "note", label: "Note", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },
];

export function getAdminResource(slug: string) {
  return ADMIN_RESOURCES.find((resource) => resource.slug === slug);
}
