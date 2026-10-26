// The Vitest framework generator: turns a document's title and bullets into a
// Vitest test file. Every output line is a template literal, so the source
// reads like the file it emits; `lines` and `indent` only touch whitespace.
import type { Nodes } from 'mdast'
import { join } from 'node:path'
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
  `expect(result).${assertion.verb}(${assertion.args})`

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
        `const result = run(${quote(slugify(title))}, { ${args} })`,
        ...assertions.map(assertLine),
      ),
    ),
    '})',
  )
}

export const vitest = {
  name: 'vitest',
  stub: `// Example:
// import { bind } from '@livingdoc/runtime'
//
// bind("applying-a-discount", ["code", "total"], ({ code, total }) => total)

export {}
`,
  entry: (dir: string) => [join(dir, 'backend.ts')],
  scaffold: (dir: string) => join(dir, 'backend.ts'),
  generatedFile: (name: string) => `${name}.test.ts`,

  generate(title: string, bullets: Nodes[], appends: string[], backend: string): string {
    const tokens = bullets.flatMap((bullet) => bulletTokens(bullet))
    const hasAssertion = tokens.some((token) => token.kind === 'assertion')
    const vitestImports = ['describe', ...(hasAssertion ? ['expect'] : []), 'it']
    const runtimeImports = appends.length > 0 ? ['bind', 'run'] : ['run']
    const specifier = backend.replace(/\.ts$/, '.js')

    return lines(
      `import { ${vitestImports.join(', ')} } from 'vitest'`,
      `import '${specifier}'`,
      `import { ${runtimeImports.join(', ')} } from '@livingdoc/runtime'`,
      '',
      `describe(${quote(title)}, () => {`,
      appends.length > 0 && indent(lines(...appends)),
      bullets.length > 0 &&
        indent(lines(...bullets.map((bullet) => caseBlock(title, bullet)))),
      '})',
      '',
    )
  },
}
