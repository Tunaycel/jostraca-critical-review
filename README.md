# Jostraca: regeneration under review

[![Verify experiments](https://github.com/Tunaycel/jostraca-critical-review/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/Tunaycel/jostraca-critical-review/actions/workflows/verify.yml)

A technical review of **Jostraca 0.39.0**, focused on what happens when generated files have been edited by hand. Seven executable scenarios connect factual claims to assertions and recorded results.

**Finding:** independent edits survive a three-way merge when generation history is available. Overwrite defaults, the interaction of `present` and `write`, and missing merge ancestry require deliberate handling by the generator author.

[Engineering report](docs/ENGINEERING-REVIEW.md) · [Claim ledger](evidence/claims.json) · [Recorded results](evidence/experiment-results.json) · [Open findings](https://github.com/Tunaycel/jostraca-critical-review/issues)

## Reproduce

Requires Node.js 24 and npm. Run from the repository root:

```sh
npm ci --ignore-scripts
npm test
```

The runner marks the report `running` before experiments, `failed` on a scenario failure, and `passed` only after all scenarios complete. Assertion failures exit nonzero. An interrupted run remains visibly incomplete; an old successful report cannot masquerade as its result. A passed scenario may reproduce undesirable behavior; it does not certify safety. Each run retains isolated files under ignored `scratch/` directories and refreshes `evidence/experiment-results.json`.

## Evidence at a glance

| Check | Observed result | What it establishes |
|---|---|---|
| Identical-input rerun | Same SHA-256 and modification time | This example avoids an unnecessary rewrite |
| Independent edit with merge history | User addition retained; generated port updated | Both independent changes survive |
| Overlapping edit | One conflicted file; generate resolves | Callers must inspect the conflict result |
| Rerun over unresolved conflict | Output bytes retained; conflict still reported | Existing markers are not stacked in this example |
| present:true alone | Local addition lost; no sidecar | Default write takes precedence |
| write:false, present:true | Original retained; proposed file written separately | Explicit presentation preserves this edited file |
| Merge history unavailable | Local addition lost; no conflict entry | Requesting merge alone is insufficient |

The seven scenarios passed locally on Windows with Node 24.12.0 and on Ubuntu/Windows in [PR #1](https://github.com/Tunaycel/jostraca-critical-review/pull/1/checks). The committed JSON records a local Windows execution. These are behavioral checks, not performance benchmarks or exhaustive test coverage.

## Review map

| File | Purpose |
|---|---|
| [examples/regeneration.mjs](examples/regeneration.mjs) | Executable reproductions and assertions |
| [evidence/claims.json](evidence/claims.json) | Seven claims mapped to scenarios |
| [evidence/experiment-results.json](evidence/experiment-results.json) | Outputs, hashes, timestamps and file classifications |
| [docs/ENGINEERING-REVIEW.md](docs/ENGINEERING-REVIEW.md) | Method, interpretation, risks and recommendations |
| [TIME-LOG.md](TIME-LOG.md) | Human effort and contribution record |

The approximately 1,000-word article is pending. This repository supports the review; it is not an upstream Jostraca fork or a completed submission.

## Version and scope

The lockfile pins the dependencies. npm metadata associates Jostraca 0.39.0 with `de40adf895c670eb28b62b3c65c6bcb15f080992`. The separately inspected repository HEAD was `3152882e61197633b299444d8166eda292fdccb4`; those identities are not interchangeable.

The experiments use one small text file per scenario. They do not establish cross-language parity, semantic correctness of merged code, multi-file atomicity, or throughput. Recommendations are review judgements, distinct from observed behavior.

Changes use focused branches and commits followed by PRs. Ubuntu and Windows verification must pass before merge.
