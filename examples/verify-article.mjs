import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const article = readFileSync(join(root, 'article.md'), 'utf8')
const blocks = [...article.matchAll(/```js\r?\n([\s\S]*?)```/g)].map((match) => match[1])
assert.equal(blocks.length, 3, 'Review article check when executable blocks change')
mkdirSync(join(root, 'scratch'), { recursive: true })
const workspace = mkdtempSync(join(root, 'scratch', 'article-'))
const imports = `import assert from 'node:assert/strict';
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';\n`

function check(name, source) {
  const folder = join(workspace, name)
  mkdirSync(folder)
  const script = join(folder, 'check.mjs')
  writeFileSync(script, imports + source)
  const result = spawnSync(process.execPath, [script], { cwd: folder, encoding: 'utf8' })
  assert.ifError(result.error)
  assert.equal(result.status, 0, `${name}: ${result.stderr}`)
  console.log(`PASS article example: ${name}`)
}

check('component-and-merge-example', blocks[0] + `
await renderSettings('PORT=8080\\nHOST=localhost\\n');
appendFileSync('./out/config.sh', 'DEBUG=1\\n');
await renderSettings('PORT=9090\\nHOST=localhost\\n');
assert.equal(readFileSync('./out/config.sh', 'utf8'), 'PORT=9090\\nHOST=localhost\\nDEBUG=1\\n');
`)

check('presentation-example', `import { Jostraca, Project, File, Content } from 'jostraca';\n` + blocks[1] + `
const run = (body) => generator.generate({folder:'./out'}, () => Project({}, () => File({name:'config.sh'}, () => Content(body))));
await run('PORT=8080\\n');
appendFileSync('./out/config.sh', 'DEBUG=1\\n');
await run('PORT=9090\\n');
assert.equal(readFileSync('./out/config.sh', 'utf8'), 'PORT=8080\\nDEBUG=1\\n');
assert.equal(readFileSync('./out/config.new.sh', 'utf8'), 'PORT=9090\\n');
`)

check('conflict-guard-example', blocks[0] + `
await renderSettings('PORT=8080\\n');
writeFileSync('./out/config.sh', 'PORT=7070\\n');
await assert.rejects(async () => {
${blocks[2]}
}, /Generated files need conflict resolution/);
`)

const jsonBlocks = [...article.matchAll(/```json\r?\n([\s\S]*?)```/g)]
assert.equal(jsonBlocks.length, 1)
const value = JSON.parse(jsonBlocks[0][1])
const evidence = JSON.parse(readFileSync(join(root, 'evidence', 'experiment-results.json'), 'utf8'))
assert.equal(evidence.status, 'passed')
const scenario = evidence.results.find((result) => result.name === 'clean-text-merge-can-violate-domain-invariant')
assert.deepEqual(value, JSON.parse(scenario.output))
console.log('PASS article JSON: matches observed semantic counterexample')
