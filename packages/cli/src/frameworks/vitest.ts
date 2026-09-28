// The Vitest framework generator: turns a document's title and bullets into a
// Vitest test file.
import type { Nodes } from 'mdast'
import { bulletTitle, bulletTokens, slugify, type Token } from '../document.js'

export const vitest = {
  name: 'vitest',
  extension: 'ts',
  generatedFile: (doc: string) => `${doc}.test.ts`,

  generate(title: string, bullets: Nodes[]): string {
    const tokens = bullets.flatMap((bullet) => bulletTokens(bullet))
    const hasAssertion = tokens.some((token) => token.kind === 'assertion')
    const imports = ['describe', ...(hasAssertion ? ['expect'] : []), 'it']
    const output = [`import { ${imports.join(', ')} } from 'vitest'`]
    if (bullets.length > 0) {
      output.push("import { bindings } from '../backend'")
    }
    output.push('', `describe(${JSON.stringify(title)}, () => {`)
    for (const bullet of bullets) {
      output.push(`  it(${JSON.stringify(bulletTitle(bullet))}, () => {`)
      const bulletTokensList = bulletTokens(bullet)
      const inputs = bulletTokensList.filter(
        (token): token is Extract<Token, { kind: 'input' }> =>
          token.kind === 'input',
      )
      for (const input of inputs) {
        const value = input.literal ? JSON.stringify(input.value) : input.value
        output.push(`    const ${input.name} = ${value}`)
      }
      const args = inputs.map((input) => input.name).join(', ')
      output.push(
        `    const outputs = bindings[${JSON.stringify(slugify(title))}].run({ ${args} })`,
      )
      for (const token of bulletTokensList) {
        if (token.kind === 'assertion') {
          output.push(`    expect(outputs.result).${token.verb}(${token.args})`)
        }
      }
      output.push('  })')
    }
    output.push('})')
    return `${output.join('\n')}\n`
  },
}
