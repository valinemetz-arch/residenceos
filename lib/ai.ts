import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient(): Anthropic {
  const apiKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_TOKEN ||
    process.env.ANTHROPIC_API;

  if (!apiKey) {
    throw new Error(
      "Anthropic API key not configured. Set ANTHROPIC_API_KEY in your environment."
    );
  }

  return new Anthropic({ apiKey });
}

// Claude often wraps JSON responses in a ```json ... ``` fence even when
// told not to - strip that before parsing instead of a bare JSON.parse.
export function parseJsonResponse<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1] : text;
  return JSON.parse(jsonText.trim()) as T;
}
