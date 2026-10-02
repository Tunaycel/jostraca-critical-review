import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, statSync, existsSync, renameSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { Jostraca, Project, File, Content } from 'jostraca'

const root = resolve(import.meta.dirname, '..')
mkdirSync(join(root, 'scratch'), { recursive: true })
const workspace = mkdtempSync(join(root, 'scratch', 'regeneration-'))
const results = []
const hash = (text) => createHash('sha256').update(text).digest('hex')
const baseline = 'PORT=8080\nHOST=localhost\n'
const changed = 'PORT=9090\nHOST=localhost\n'

function setup(name, options = {}) {
  const folder = join(workspace, name)
  const generator = Jostraca(options)
  const file = join(folder, 'config.sh')
  const run = (body) => generator.generate({ folder }, () => {
    Project({}, () => File({ name: 'config.sh' }, () => Content(body)))
  })
  return { folder, file, run, read: () => readFileSync(file, 'utf8') }
}

async function observe(name, test) {
  results.push({ name, status: 'passed', ...(await test()) })
}

await observe('identical-input-regeneration', async () => {
  const x = setup('identical')
  await x.run(baseline)
  assert.equal(x.read(), baseline)
  const before = { sha256: hash(x.read()), mtimeMs: statSync(x.file).mtimeMs }
  // Give the filesystem clock enough separation to detect a rewrite.
  await new Promise((done) => setTimeout(done, 50))
  const result = await x.run(baseline)
  const after = { sha256: hash(x.read()), mtimeMs: statSync(x.file).mtimeMs }
  assert.deepEqual(after, before)
  return { before, after, files: result.files }
})

await observe('default-overwrites-local-edit', async () => {
  const x = setup('default')
  await x.run(baseline)
  appendFileSync(x.file, 'DEBUG=1\n')
  const result = await x.run(changed)
  assert.equal(x.read(), changed)
  return { output: x.read(), files: result.files }
})

await observe('merge-preserves-independent-edit', async () => {
  const x = setup('merge', { existing: { txt: { write: true, merge: true } } })
  await x.run(baseline)
  appendFileSync(x.file, 'DEBUG=1\n')
  const result = await x.run(changed)
  assert.equal(x.read(), changed + 'DEBUG=1\n')
  assert.equal(result.files.conflicted.length, 0)
  return { output: x.read(), files: result.files }
})

await observe('merge-reports-conflict-and-preserves-unresolved-output', async () => {
  const x = setup('conflict', { existing: { txt: { write: true, merge: true } } })
  await x.run(baseline)
  writeFileSync(x.file, 'PORT=7070\nHOST=localhost\n')
  const result = await x.run(changed)
  const conflicted = x.read()
  assert.equal(result.files.conflicted.length, 1)
  assert.match(conflicted, /<<<<<<</)
  const again = await x.run('PORT=6060\nHOST=localhost\n')
  assert.equal(x.read(), conflicted)
  assert.equal(again.files.conflicted.length, 1)
  return { output: conflicted, generateResolvedDespiteConflict: true, files: result.files, repeatedFiles: again.files }
})

await observe('present-alone-still-overwrites', async () => {
  const x = setup('present-alone', { existing: { txt: { present: true } } })
  await x.run(baseline)
  appendFileSync(x.file, 'DEBUG=1\n')
  const result = await x.run(changed)
  assert.equal(x.read(), changed)
  assert.equal(existsSync(join(x.folder, 'config.new.sh')), false)
  return { output: x.read(), sidecarExists: false, files: result.files }
})

await observe('present-with-write-false-keeps-original', async () => {
  const x = setup('present-safe', { existing: { txt: { write: false, present: true } } })
  await x.run(baseline)
  appendFileSync(x.file, 'DEBUG=1\n')
  const result = await x.run(changed)
  assert.equal(x.read(), baseline + 'DEBUG=1\n')
  const sidecar = readFileSync(join(x.folder, 'config.new.sh'), 'utf8')
  assert.equal(sidecar, changed)
  return { output: x.read(), sidecar, files: result.files }
})

await observe('merge-without-saved-baseline', async () => {
  const x = setup('lost-baseline', { existing: { txt: { write: true, merge: true } } })
  await x.run(baseline)
  appendFileSync(x.file, 'DEBUG=1\n')
  const metadata = join(x.folder, '.jostraca')
  assert.equal(existsSync(metadata), true)
  // Retain the history for inspection while removing it from the lookup path.
  renameSync(metadata, join(x.folder, '.jostraca.saved'))
  const result = await x.run(changed)
  const output = x.read()
  assert.equal(output, changed)
  assert.equal(result.files.conflicted.length, 0)
  return { output, localEditPreserved: output.includes('DEBUG=1'), files: result.files }
})

const report = {
  checkedAt: new Date().toISOString(),
  packageVersion: '0.39.0',
  environment: { node: process.version, platform: process.platform, arch: process.arch },
  scope: 'Seven small single-file scenarios; no performance benchmark or exhaustive safety claim.',
  results
}
// Evidence uses paths relative to this run; avoid publishing local machine paths.
const portableReport = JSON.stringify(report, null, 2)
  .split(workspace.replaceAll('\\', '/') + '/').join('')
writeFileSync(join(root, 'evidence', 'experiment-results.json'), portableReport + '\n')
console.log(portableReport)
