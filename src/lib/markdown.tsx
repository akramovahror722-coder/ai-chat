import type { ReactNode } from 'react'

function inline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="font-bold">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-slate-500/15 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:text-slate-100"
        >
          {token.slice(1, -1)}
        </code>
      )
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      )
    }
    return <span key={key}>{token}</span>
  })
}

function textBlock(text: string, keyPrefix: string): ReactNode {
  const lines = text.split('\n')
  return (
    <span key={keyPrefix}>
      {lines.map((line, index) => {
        const trimmed = line.trim()
        const isBullet = /^[-*•]\s+/.test(trimmed)
        const isNumbered = /^\d+[.)]\s+/.test(trimmed)
        if (isBullet || isNumbered) {
          const content = trimmed.replace(/^([-*•]|\d+[.)])\s+/, '')
          return (
            <span key={index} className="flex gap-2 py-0.5">
              <span className="shrink-0 select-none text-slate-400">
                {isNumbered ? `${trimmed.match(/^\d+/)?.[0]}.` : '•'}
              </span>
              <span className="min-w-0 flex-1">{inline(content, `${keyPrefix}-${index}`)}</span>
            </span>
          )
        }
        return (
          <span key={index}>
            {inline(line, `${keyPrefix}-${index}`)}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        )
      })}
    </span>
  )
}

export function RichText({ text }: { text: string }) {
  const blocks = text.split('```')
  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const lines = block.replace(/^\n/, '').split('\n')
          const first = lines[0].trim()
          const hasLanguage = first.length > 0 && first.length < 20 && !first.includes(' ')
          const code = hasLanguage ? lines.slice(1).join('\n') : lines.join('\n')
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-xl border border-slate-700/40 bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"
            >
              {hasLanguage && (
                <span className="mb-2 block font-mono text-[10px] tracking-wider text-slate-400 uppercase">
                  {first}
                </span>
              )}
              <code className="font-mono">{code.replace(/\n$/, '')}</code>
            </pre>
          )
        }
        if (!block.trim()) return null
        return <div key={index}>{textBlock(block, `b${index}`)}</div>
      })}
    </div>
  )
}
