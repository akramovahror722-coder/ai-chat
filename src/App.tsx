import { Code2, Cpu, History, KeyRound, Sparkles } from 'lucide-react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { ChatApp } from './components/ChatApp'
import { useLang } from './lib/lang'
import { localize } from './lib/locale'
import type { Localized } from './lib/types'

const hero = {
  kicker: { uz: 'AI yordamchi', en: 'AI assistant', ru: 'AI-помощник' },
  title: { uz: 'AI Chat', en: 'AI Chat', ru: 'AI Chat' },
  subtitle: {
    uz: 'Kalitsiz, bepul AI suhbatdosh. Savol bering, matn yozdiring yoki kod bo‘yicha yordam oling — hammasi brauzerda.',
    en: 'A keyless, free AI chat. Ask questions, generate text or get help with code — all in your browser.',
    ru: 'Бесплатный AI-собеседник без ключа. Задавайте вопросы, пишите тексты или получайте помощь с кодом — всё в браузере.',
  },
} satisfies Record<string, Localized>

const chips: Localized[] = [
  { uz: 'Kalitsiz va bepul', en: 'Keyless and free', ru: 'Без ключа и бесплатно' },
  { uz: '4 ta model', en: '4 models', ru: '4 модели' },
  { uz: 'Suhbatlar tarixi', en: 'Chat history', ru: 'История чатов' },
  { uz: 'Kod bloklari', en: 'Code blocks', ru: 'Блоки кода' },
]

const stats = [
  { value: '4', label: { uz: 'Modellar', en: 'Models', ru: 'Модели' } },
  { value: '3', label: { uz: 'Tillar', en: 'Languages', ru: 'Языка' } },
  { value: '0', label: { uz: 'So‘m / oy', en: 'Cost / month', ru: 'Стоимость' } },
] satisfies { value: string; label: Localized }[]

const features: { icon: typeof KeyRound; title: Localized; text: Localized }[] = [
  {
    icon: KeyRound,
    title: { uz: 'Kalitsiz ishlaydi', en: 'Works without a key', ru: 'Работает без ключа' },
    text: {
      uz: 'Ro‘yxatdan o‘tish yoki API kaliti shart emas. Saytni oching va yozishni boshlang.',
      en: 'No sign-up or API key required. Open the site and start typing.',
      ru: 'Без регистрации и API-ключа. Откройте сайт и начните писать.',
    },
  },
  {
    icon: Cpu,
    title: { uz: 'Bir nechta modellar', en: 'Multiple models', ru: 'Несколько моделей' },
    text: {
      uz: 'OpenAI, Mistral va Llama modellari orasidan vazifangizga mosini tanlang.',
      en: 'Pick the model that fits your task from OpenAI, Mistral and Llama.',
      ru: 'Выберите подходящую модель из OpenAI, Mistral и Llama.',
    },
  },
  {
    icon: History,
    title: { uz: 'Suhbatlar tarixi', en: 'Chat history', ru: 'История чатов' },
    text: {
      uz: 'Suhbatlar brauzerda saqlanadi — istalgan paytda qaytib davom ettirishingiz mumkin.',
      en: 'Chats are stored in your browser — return and continue anytime.',
      ru: 'Чаты хранятся в браузере — вернитесь и продолжите в любой момент.',
    },
  },
  {
    icon: Code2,
    title: { uz: 'Kod va formatlash', en: 'Code and formatting', ru: 'Код и форматирование' },
    text: {
      uz: 'Javoblar sarlavhalar, ro‘yxatlar va kod bloklari bilan chiroyli ko‘rinishda.',
      en: 'Answers come with headings, lists and code blocks nicely rendered.',
      ru: 'Ответы оформлены заголовками, списками и блоками кода.',
    },
  },
]

export function App() {
  const { lang } = useLang()

  return (
    <div id="top" className="min-h-screen">
      <SiteHeader
        brand="AI Chat"
        tagline={hero.kicker}
        accent="from-violet-500 to-indigo-500"
        icon={<Sparkles className="size-5" />}
      />

      <main>
        <section className="relative overflow-hidden pt-14 pb-12 sm:pt-16">
          <div
            className="pointer-events-none absolute -top-28 left-1/3 size-[26rem] rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-500/10"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" aria-hidden="true" />
          <div className="container-page relative">
            <div className="max-w-3xl page-enter">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-violet-600 uppercase dark:border-violet-400/20 dark:text-violet-300">
                <span className="size-1.5 rounded-full bg-violet-500" />
                {localize(hero.kicker, lang)}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
                {localize(hero.title, lang)}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                {localize(hero.subtitle, lang)}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {chips.map((item) => (
                  <span
                    key={item.en}
                    className="chip bg-white/70 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
                  >
                    <Sparkles className="size-3 text-violet-500" />
                    {localize(item, lang)}
                  </span>
                ))}
              </div>

              <div className="mt-9 grid max-w-md grid-cols-3 gap-3">
                {stats.map((item) => (
                  <div key={item.label.en} className="card-surface px-4 py-3">
                    <p className="font-mono text-2xl font-extrabold text-violet-600 dark:text-violet-300">
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      {localize(item.label, lang)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container-page">
            <ChatApp />
          </div>
        </section>

        <section className="section-alt py-16 sm:py-20">
          <div className="container-page">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title.en} className="card-surface card-hover p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{localize(feature.title, lang)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {localize(feature.text, lang)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        brand="AI Chat"
        note={{
          uz: 'Pollinations API asosidagi bepul, kalitsiz AI suhbatdosh.',
          en: 'A free, keyless AI chat powered by the Pollinations API.',
          ru: 'Бесплатный AI-чат без ключа на основе Pollinations API.',
        }}
        tech={['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Pollinations API', 'localStorage']}
        repoUrl="https://github.com/akramovahror722-coder/ai-chat"
        accentText="text-violet-600 dark:text-violet-300"
      />
    </div>
  )
}
