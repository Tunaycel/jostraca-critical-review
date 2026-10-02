# Engineering review: Jostraca regeneration behavior

Tested release: **0.39.0**. Local environment: Windows x64, Node **24.12.0**. Cross-platform evidence: [Ubuntu and Windows CI](https://github.com/Tunaycel/jostraca-critical-review/pull/1/checks).

## Assessment

Jostraca preserved an independent user edit while updating generated content in the tested three-way merge. It reported conflicting edits and preserved unresolved conflict output on a further run. These are useful properties for generators that run repeatedly over edited files.

The surrounding contract requires care: merge depends on saved ancestry, conflicting output does not automatically reject generate(), and present:true is subordinate to the default write option. Generator authors must handle these rules explicitly.

## Method and provenance

The package version and dependency graph are pinned in package.json and package-lock.json. npm's gitHead identifies release commit `de40adf895c670eb28b62b3c65c6bcb15f080992`. This is registry provenance, not proof that a fresh source build is byte-identical to the published package.

Each scenario uses a new directory, a new generator instance and one config.sh file. Initial content sets PORT=8080 and HOST=localhost; regeneration changes the port to 9090. Independent edits append DEBUG=1. The conflict case changes the existing port to 7070. The missing-history case renames the entire .jostraca directory to .jostraca.saved, preserving it while removing it from the normal lookup path.

The runner checks exact output, file classifications, SHA-256 and modification time where applicable. The unchanged-file scenario waits 50 ms before the rerun to reduce the chance of an undetected rewrite due to timestamp granularity. This remains an observation on the tested filesystem.

## Behavioral metrics

| Measure | Value | Interpretation |
|---|---:|---|
| Scenario assertions completed | 7 of 7 | Seven scoped observations reproduced |
| Platforms with successful CI | 2 | Ubuntu and Windows |
| Dependencies requested directly | 1 | Jostraca; peer packages remain in the lockfile |
| Changed bytes in identical-input output | 0 | Hash and exact initial content retained |
| Modification-time change in identical-input output | 0 ms | No rewrite observed |
| Conflicted files with overlapping edits | 1 | Conflict exposed through the result |
| Conflicted files with missing history | 0 | Overwrite without conflict classification |
| User additions retained with merge history | 1 | The single DEBUG=1 addition survived |
| User additions retained without merge history | 0 | The single DEBUG=1 addition was lost |

Counts describe these fixtures. They are not population estimates, code coverage percentages or a safety score. No throughput or comparative speed claim is made.

## Findings and recommendations

| Finding | Observed impact | Recommendation | Tracking |
|---|---|---|---|
| Missing merge ancestry falls through to overwrite | Local addition disappears with write:true, merge:true | Offer an explicit missing-base policy: refuse, warn or present | [Issue #3](https://github.com/Tunaycel/jostraca-critical-review/issues/3) |
| present is subordinate to default write | Presentation request can still replace edited output | Consider one explicit strategy or validate incompatible flags | [Issue #4](https://github.com/Tunaycel/jostraca-critical-review/issues/4) |
| Conflict result requires caller handling | Call completes with conflict markers | Check files.conflicted before downstream compilation or publication | Integration responsibility |

These issues track review questions in this repository. No upstream acceptance or fix is claimed. Default overwrite is reasonable for disposable generator-owned files; the concern is applying those defaults to hand-edited output.

## Integration guidance

The following uses the same components and merge options as the experiments. The conflict guard is recommended caller behavior; it is not itself a separately executed listing.

```js
import { Jostraca, Project, File, Content } from 'jostraca'

const generator = Jostraca({
  existing: { txt: { write: true, merge: true } },
})

const result = await generator.generate({ folder: './out' }, () => {
  Project({}, () => {
    File({ name: 'config.sh' }, () => Content('PORT=9090\n'))
  })
})

if (result.files.conflicted.length > 0) {
  throw new Error(`Resolve ${result.files.conflicted.length} conflicted file(s)`)
}
```

This guard detects reported conflicts. It does not recover missing ancestry or edits already overwritten. Generator history needs its own retention and validation policy. For review-before-write, the tested option combination is existing.txt.write=false with existing.txt.present=true.

## Boundaries and judgement

Textual merge success cannot establish that the resulting program compiles or behaves correctly. This review has not measured large-file performance, binary output, concurrent generators, deletion/rename handling, or TypeScript/Go parity. It is not a complete security audit.

Jostraca is worth evaluating for repeated generation over edited text when file ownership, retained ancestry and conflict handling are explicit. The evidence supports a focused article about that operational contract. The participant's final editorial judgement remains pending.
