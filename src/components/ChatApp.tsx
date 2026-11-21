import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bot,
  Cpu,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  User,
} from 'lucide-react'
import { useLang } from '../lib/lang'
import { localize } from '../lib/locale'
import { useLocalStorage } from '../lib/storage'
import { AI_MODELS, askAi } from '../lib/ai'
import { RichText } from '../lib/markdown'
import type { Localized } from '../lib/types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
}

const copy = {
  newChat: { uz: 'Yangi suhbat', en: 'New chat', ru: 'Новый чат' },
  history: { uz: 'Suhbatlar', en: 'Chats', ru: 'Чаты' },
  emptyHistory: {
    uz: 'Hali suhbatlar yo‘q. Birinchi savolingizni yozing.',
    en: 'No chats yet. Ask your first question.',
    ru: 'Пока нет чатов. Задайте первый вопрос.',
  },
  emptyTitle: {
    uz: 'Nimadan boshlaymiz?',
    en: 'Where do we start?',
    ru: 'С чего начнём?',
  },
  emptyText: {
    uz: 'AI yordamchi savollaringizga javob beradi, matn yozadi va kod bilan yordam beradi.',
    en: 'The AI assistant answers questions, writes text and helps with code.',
    ru: 'AI-помощник отвечает на вопросы, пишет тексты и помогает с кодом.',
  },
  placeholder: {
    uz: 'Xabar yozing… (Enter — yuborish)',
    en: 'Write a message… (Enter to send)',
    ru: 'Напишите сообщение… (Enter — отправить)',
  },
  send: { uz: 'Yuborish', en: 'Send', ru: 'Отправить' },
  stop: { uz: 'To‘xtatish', en: 'Stop', ru: 'Остановить' },
  thinking: { uz: 'O‘ylayapti…', en: 'Thinking…', ru: 'Думает…' },
  retry: { uz: 'Qayta urinish', en: 'Try again', ru: 'Повторить' },
  errorTitle: { uz: 'Javob olinmadi', en: 'No response', ru: 'Нет ответа' },
  errorText: {
    uz: 'Bepul AI xizmati band bo‘lishi mumkin. Bir necha soniyadan so‘ng qayta urinib ko‘ring.',
    en: 'The free AI service may be busy. Try again in a few seconds.',
    ru: 'Бесплатный AI-сервис может быть занят. Повторите через несколько секунд.',
  },
  clearAll: { uz: 'Hammasini o‘chirish', en: 'Clear all', ru: 'Очистить всё' },
  confirmClear: {
    uz: 'Barcha suhbatlar o‘chirilsinmi?',
    en: 'Delete all chats?',
    ru: 'Удалить все чаты?',
  },
  free: { uz: 'Bepul · kalitsiz', en: 'Free · no key', ru: 'Бесплатно · без ключа' },
  model: { uz: 'Model', en: 'Model', ru: 'Модель' },
  delete: { uz: 'O‘chirish', en: 'Delete', ru: 'Удалить' },
} satisfies Record<string, Localized>

const suggestions: Localized[] = [
  {
    uz: 'React’da useState va useEffect farqini tushuntir',
    en: 'Explain the difference between useState and useEffect in React',
    ru: 'Объясни разницу между useState и useEffect в React',
  },
  {
    uz: 'Git uchun foydali buyruqlar ro‘yxatini ber',
    en: 'Give me a list of useful Git commands',
    ru: 'Дай список полезных команд Git',
  },
  {
    uz: 'Kichik biznes uchun Instagram post yozib ber',
    en: 'Write an Instagram post for a small business',
    ru: 'Напиши пост в Instagram для малого бизнеса',
  },
  {
    uz: 'TypeScript’da interfeys va type farqi nima?',
    en: 'What is the difference between interface and type in TypeScript?',
    ru: 'В чём разница между interface и type в TypeScript?',
  },
]

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatApp() {
  const { lang } = useLang()
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(
    'aichat-conversations',
    [],
  )
  const [activeId, setActiveId] = useState<string | null>(
    () => conversations[0]?.id ?? null,
  )
  const [model, setModel] = useLocalStorage<string>('aichat-model', 'openai')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId],
  )

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  )

  const messages = active?.messages ?? []

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages.length, busy, activeId])

  const send = async (raw?: string) => {
    const content = (raw ?? input).trim()
    if (!content || busy) return

    setError(false)
    setInput('')
    setBusy(true)

    const targetId = active?.id ?? makeId()
    const history = active?.messages ?? []

    if (!active) {
      const conversation: Conversation = {
        id: targetId,
        title: content.slice(0, 48),
        messages: [],
        updatedAt: Date.now(),
      }
      setConversations((prev) => [conversation, ...prev])
      setActiveId(targetId)
    }

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    }

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === targetId
          ? {
              ...conversation,
              title:
                conversation.messages.length === 0 ? content.slice(0, 48) : conversation.title,
              messages: [...conversation.messages, userMessage],
              updatedAt: Date.now(),
            }
          : conversation,
      ),
    )

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reply = await askAi(
        [...history, userMessage].map((message) => ({
          role: message.role,
          content: message.content,
        })),
        model,
        controller.signal,
      )
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: reply,
        createdAt: Date.now(),
      }
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === targetId
            ? {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(true)
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const retry = () => {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user')
    if (!lastUser) return
    setError(false)
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeId
          ? {
              ...conversation,
              messages: conversation.messages.filter(
                (message) => message.id !== lastUser.id,
              ),
            }
          : conversation,
      ),
    )
    void send(lastUser.content)
  }

  const startNew = () => {
    abortRef.current?.abort()
    setActiveId(null)
    setInput('')
    setError(false)
    inputRef.current?.focus()
  }

  const remove = (id: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation.id !== id))
    if (activeId === id) setActiveId(null)
  }

  const clearAll = () => {
    if (!window.confirm(localize(copy.confirmClear, lang))) return
    abortRef.current?.abort()
    setConversations([])
    setActiveId(null)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="card-surface flex max-h-60 flex-col p-3 lg:h-[660px] lg:max-h-none">
        <button type="button" onClick={startNew} className="btn-primary w-full justify-center">
          <Plus className="size-4" />
          {localize(copy.newChat, lang)}
        </button>

        <p className="mt-4 px-1 text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">
          {localize(copy.history, lang)}
        </p>

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
          {sorted.length === 0 ? (
            <p className="px-1 py-3 text-xs leading-relaxed text-slate-400">
              {localize(copy.emptyHistory, lang)}
            </p>
          ) : (
            sorted.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                  conversation.id === activeId
                    ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                    : 'text-slate-600 hover:bg-slate-500/8 dark:text-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(conversation.id)
                    setError(false)
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-xs font-medium"
                >
                  <MessageSquare className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{conversation.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(conversation.id)}
                  aria-label={localize(copy.delete, lang)}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500 focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {conversations.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-500 dark:border-white/10"
          >
            <Trash2 className="size-3" />
            {localize(copy.clearAll, lang)}
          </button>
        )}
      </aside>

      <section className="card-surface flex h-[640px] flex-col overflow-hidden lg:h-[660px]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-600 uppercase dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {localize(copy.free, lang)}
            </span>
          </div>

          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <Cpu className="size-3.5" />
            <span className="sr-only">{localize(copy.model, lang)}</span>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 outline-none focus:border-violet-400 dark:border-white/10 dark:bg-[#0d1117] dark:text-slate-200"
            >
              {AI_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && !busy ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25">
                <Sparkles className="size-6" />
              </span>
              <h2 className="mt-5 text-xl font-extrabold">{localize(copy.emptyTitle, lang)}</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {localize(copy.emptyText, lang)}
              </p>
              <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item.en}
                    type="button"
                    onClick={() => void send(localize(item, lang))}
                    className="rounded-xl border border-slate-200 bg-white/60 px-3.5 py-3 text-left text-xs font-medium text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:text-violet-200"
                  >
                    {localize(item, lang)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message) => {
                const isUser = message.role === 'user'
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-sm ${
                        isUser
                          ? 'bg-slate-700 dark:bg-slate-600'
                          : 'bg-gradient-to-br from-violet-500 to-indigo-500'
                      }`}
                    >
                      {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                    </span>
                    <div className={`min-w-0 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block rounded-2xl px-4 py-2.5 text-left ${
                          isUser
                            ? 'rounded-tr-sm bg-slate-900 text-white dark:bg-slate-700'
                            : 'rounded-tl-sm bg-slate-100 text-slate-800 dark:bg-white/[0.06] dark:text-slate-100'
                        }`}
                      >
                        {isUser ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : (
                          <RichText text={message.content} />
                        )}
                      </div>
                      <p className="mt-1 px-1 font-mono text-[10px] text-slate-400">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}

              {busy && (
                <div className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm">
                    <Bot className="size-4" />
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-white/[0.06]">
                    <Loader2 className="size-4 animate-spin text-violet-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {localize(copy.thinking, lang)}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-300/60 bg-rose-500/8 p-3 text-left dark:border-rose-400/20">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-300">
                      {localize(copy.errorTitle, lang)}
                    </p>
                    <p className="mt-0.5 text-xs text-rose-500/90 dark:text-rose-300/80">
                      {localize(copy.errorText, lang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 dark:border-rose-400/30 dark:text-rose-300"
                  >
                    <RefreshCw className="size-3" />
                    {localize(copy.retry, lang)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200/70 p-3 dark:border-white/10">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 focus-within:border-violet-400 dark:border-white/10 dark:bg-white/[0.04]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send()
                }
              }}
              rows={1}
              placeholder={localize(copy.placeholder, lang)}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                aria-label={localize(copy.stop, lang)}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-700 text-white transition-colors hover:bg-slate-800 dark:bg-slate-600"
              >
                <Square className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim()}
                aria-label={localize(copy.send, lang)}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
