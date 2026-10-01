# Jostraca technical review workspace

Supporting workspace for the second Voxgig mini task: an approximately 1,000-word critical article with executable code examples. Jostraca is the current candidate; the article's conclusions remain subject to verification and participant judgement.

## Deliverables

- `article.md`: the final article, to be created after experiments and review.
- `examples/`: runnable, version-pinned examples, to be added during verification.
- `evidence/claims.json`: evidence supporting factual claims and the limits of each observation.
- `TIME-LOG.md`: participant-estimated human effort, including preparation.

The task permits submission as Markdown and does not require a public repository. This workspace has not been published. No experiment or performance result is claimed at setup.

## Verification plan

Use a pinned package version and record its relationship to the inspected source commit. Check first generation, identical-input regeneration, preservation of independent local edits, conflicting edits, and the interaction of `present` and `write`. Record output hashes and file outcomes. Verify the role of saved generation state before drawing conclusions about it.

Treat document descriptions as claims to test. Separate observed behavior from recommendations. Do not interpret text merges as proof that generated programs remain semantically correct. Timing measurements, if included, must identify the environment and repeated-run method.

## Change workflow

The initial commit establishes this workspace. Subsequent changes use focused branches and commits. If published to GitHub, push each branch, open a PR, and merge only after applicable checks pass. Add CI when runnable experiments exist; setup alone does not substantiate a green test claim.

AI assistance and participant review will be recorded accurately. The participant must approve the article's technical opinions before submission.
