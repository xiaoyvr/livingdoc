// The pytest framework generator: turns a document's title and bullets into a
// pytest test module. Every output line is a template literal, so the source
// reads like the file it emits; `lines` and `indent` only touch whitespace.
import type { Nodes } from 'mdast'
import { bulletTitle, bulletTokens, slugify, type Token } from '../document.js'

type Input = Extract<Token, { kind: 'input' }>
type Assertion = Extract<Token, { kind: 'assertion' }>

const quote = JSON.stringify

const lines = (...parts: (string | false | undefined)[]) =>
  parts
    .flat()
    .filter((line): line is string => line !== false && line !== undefined)
    .join('\n')

const indent = (text: string) =>
  text
    .split('\n')
    .map((line) => (line === '' ? line : `    ${line}`))
    .join('\n')

const inputLine = (input: Input) =>
  `${input.name} = ${input.literal ? quote(input.value) : input.value}`

const assertLine = (assertion: Assertion) =>
  `assert result ${assertion.verb} ${assertion.args}`

const testName = (bullet: Nodes) =>
  `test_${slugify(bulletTitle(bullet)).replace(/-/g, '_') || 'case'}`

const className = (title: string) =>
  'Test' +
  slugify(title)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const caseBlock = (title: string, bullet: Nodes): string => {
  const tokens = bulletTokens(bullet)
  const inputs = tokens.filter((token): token is Input => token.kind === 'input')
  const assertions = tokens.filter(
    (token): token is Assertion => token.kind === 'assertion',
  )
  const args = inputs.map((input) => `"${input.name}": ${input.name}`).join(', ')

  return lines(
    `def ${testName(bullet)}(self):`,
    indent(
      lines(
        ...inputs.map(inputLine),
        `result = run(${quote(slugify(title))}, {${args}})`,
        ...assertions.map(assertLine),
      ),
    ),
  )
}

export const pytest = {
  name: 'pytest',
  extension: 'py',
  generatedFile: (name: string) => {
    const parts = name.split('/')
    const file = parts.pop()!
    return [...parts, `test_${file}.py`].join('/')
  },

  generate(title: string, bullets: Nodes[], appends: string[]): string {
    const needsBindings = bullets.length > 0 || appends.length > 0
    const body =
      appends.length > 0 || bullets.length > 0
        ? indent(
            lines(
              ...appends,
              ...bullets.map((bullet) => caseBlock(title, bullet)),
            ),
          )
        : indent('pass')

    return lines(
      needsBindings && `from livingdoc_runtime import setup`,
      needsBindings && `import backend`,
      needsBindings && '',
      needsBindings && `bind, run = setup(backend)`,
      needsBindings && '',
      `class ${className(title)}:`,
      body,
      '',
    )
  },
}
