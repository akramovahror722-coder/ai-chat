export type ChatRole = 'user' | 'assistant' | 'system'

export interface ApiMessage {
  role: ChatRole
  content: string
}

export const AI_MODELS = [
  { id: 'openai', label: 'OpenAI GPT', hint: 'balanced' },
  { id: 'openai-fast', label: 'OpenAI Fast', hint: 'quick' },
  { id: 'mistral', label: 'Mistral', hint: 'creative' },
  { id: 'llama', label: 'Llama', hint: 'open' },
] as const

const ENDPOINT = 'https://text.pollinations.ai/openai'
const PLAIN_ENDPOINT = 'https://text.pollinations.ai'
const REFERRER = 'akramovahror722-coder.github.io'

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[]
}

async function postCompletion(messages: ApiMessage[], model: string, signal?: AbortSignal) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, referrer: REFERRER, private: true }),
    signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as OpenAiResponse
  const content = data.choices?.[0]?.message?.content
  return typeof content === 'string' ? content.trim() : ''
}

async function getPlain(messages: ApiMessage[], model: string, signal?: AbortSignal) {
  const prompt = messages
    .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n\n')
  const url = `${PLAIN_ENDPOINT}/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}&referrer=${encodeURIComponent(REFERRER)}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.text()).trim()
}

export async function askAi(
  messages: ApiMessage[],
  model: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const content = await postCompletion(messages, model, signal)
    if (content) return content
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
  }
  const fallback = await getPlain(messages, model, signal)
  if (!fallback) throw new Error('Empty response')
  return fallback
}
