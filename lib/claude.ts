const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || 'YOUR_CLAUDE_API_KEY';
const MODEL = 'claude-sonnet-4-20250514';

interface Message {
  role: string;
  content: string;
}

export async function sendMessage(
  messages: Message[],
  systemPrompt?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: 4096,
    messages,
  };
  if (systemPrompt) {
    body.system = systemPrompt;
  }
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }
  const data = await response.json();
  return data.content[0].text;
}
