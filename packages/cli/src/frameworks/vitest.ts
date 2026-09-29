// The Vitest framework generator: turns a document's title and bullets into a
// Vitest test file. Every output line is a template literal, so the source
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
    .map((line) => (line === '' ? line : `  ${line}`))
    .join('\n')

const inputLine = (input: Input) =>
  `const ${input.name} = ${input.literal ? quote(input.value) : input.value}`

const assertLine = (assertion: Assertion) =>
  `expect(outputs.result).${assertion.verb}(${assertion.args})`

const caseBlock = (title: string, bullet: Nodes): string => {
  const tokens = bulletTokens(bullet)
  const inputs = tokens.filter((token): token is Input => token.kind === 'input')
  const assertions = tokens.filter(
    (token): token is Assertion => token.kind === 'assertion',
  )
  const args = inputs.map((input) => input.name).join(', ')

  return lines(
    `it(${quote(bulletTitle(bullet))}, () => {`,
    indent(
      lines(
        ...inputs.map(inputLine),
        `const outputs = bindings.get(${quote(slugify(title))}).run({ ${args} })`,
        ...assertions.map(assertLine),
      ),
    ),
    '})',
  )
}

export const vitest = {
  name: 'vitest',
  extension: 'ts',
  generatedFile: (name: string) => `${name}.test.ts`,

  generate(title: string, bullets: Nodes[]): string {
    const tokens = bullets.flatMap((bullet) => bulletTokens(bullet))
    const hasAssertion = tokens.some((token) => token.kind === 'assertion')
    const imports = ['describe', ...(hasAssertion ? ['expect'] : []), 'it']

    return lines(
      `import { ${imports.join(', ')} } from 'vitest'`,
      bullets.length > 0 && `import { createBindings } from '@livingdoc/runtime'`,
      bullets.length > 0 && `import { register } from '../backend'`,
      '',
      bullets.length > 0 && `const bindings = createBindings()`,
      bullets.length > 0 && `register(bindings)`,
      bullets.length > 0 && '',
      `describe(${quote(title)}, () => {`,
      bullets.length > 0 &&
        indent(lines(...bullets.map((bullet) => caseBlock(title, bullet)))),
      '})',
      '',
    )
  },
}
