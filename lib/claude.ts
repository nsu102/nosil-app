const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';
// const MODEL = 'claude-sonnet-4-20250514';
const MODEL = 'claude-sonnet-4-6';
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);

interface Message {
  role: string;
  content: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  let lastStatus = 0;
  let lastMessage = '알 수 없는 오류';

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text = Array.isArray(data?.content)
        ? data.content
          .map((item: { type?: string; text?: string }) => (item?.type === 'text' ? item.text || '' : ''))
          .filter(Boolean)
          .join('')
        : '';
      if (!text) {
        throw new Error('Claude 응답에 텍스트가 없어요.');
      }
      return text;
    }

    lastStatus = response.status;
    const rawText = await response.text();
    lastMessage = rawText.slice(0, 300) || `Claude API error: ${response.status}`;

    if (!RETRYABLE_STATUS.has(response.status) || attempt === 2) {
      break;
    }

    await delay(800 * (attempt + 1));
  }

  if (lastStatus === 529) {
    throw new Error('Claude 서버가 현재 과부하 상태예요. 잠시 후 다시 시도해주세요.');
  }

  throw new Error(`Claude API ${lastStatus}: ${lastMessage}`);
}
