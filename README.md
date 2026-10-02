# Jostraca technical review workspace

Supporting workspace for the second Voxgig mini task: an approximately 1,000-word critical article with executable code examples. Jostraca is the current candidate; the article's conclusions remain subject to verification and participant judgement.

## Deliverables

- `article.md`: the final article, to be created after experiments and review.
- `examples/`: runnable, version-pinned examples, to be added during verification.
- `evidence/claims.json`: evidence supporting factual claims and the limits of each observation.
- `TIME-LOG.md`: participant-estimated human effort, including preparation.

The task permits submission as Markdown and does not require a public repository. This supporting workspace is public at [Tunaycel/jostraca-critical-review](https://github.com/Tunaycel/jostraca-critical-review). The article is pending; the repository currently contains executable evidence, not a completed submission.

## Run the experiments

Requires Node.js 24. Dependencies are pinned in the lockfile.

```sh
npm ci --ignore-scripts
npm test
```

Seven small scenarios have been reproduced locally on Windows with Node 24.12.0 and Jostraca 0.39.0, and passed on Ubuntu and Windows in [PR #1 CI](https://github.com/Tunaycel/jostraca-critical-review/pull/1/checks). Results are written to `evidence/experiment-results.json`; isolated output is retained under ignored `scratch/` directories. Paths in the report are relative to each run. A passing assertion can reproduce a risky behavior; it does not certify that behavior as safe. The committed result records the local Windows run.

The npm registry identifies the release's `gitHead` as `de40adf895c670eb28b62b3c65c6bcb15f080992`. The separately observed repository HEAD was `3152882e61197633b299444d8166eda292fdccb4`; release behavior must not be attributed indiscriminately to that newer HEAD.

## Verification plan

Use a pinned package version and record its relationship to the inspected source commit. Check first generation, identical-input regeneration, preservation of independent local edits, conflicting edits, and the interaction of `present` and `write`. Record output hashes and file outcomes. Verify the role of saved generation state before drawing conclusions about it.

Treat document descriptions as claims to test. Separate observed behavior from recommendations. Do not interpret text merges as proof that generated programs remain semantically correct. Timing measurements, if included, must identify the environment and repeated-run method.

## Change workflow

The initial commit establishes this workspace. Subsequent changes use focused branches and commits. If published to GitHub, push each branch, open a PR, and merge only after applicable checks pass. Add CI when runnable experiments exist; setup alone does not substantiate a green test claim.

AI assistance and participant review will be recorded accurately. The participant must approve the article's technical opinions before submission.
