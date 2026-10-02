# Jostraca's merge works. Your generated project still needs a safety policy.

By Hüseyin Tunay Çelik · 2 October 2026

A generated file becomes harder to manage as soon as somebody edits it. A timeout gets tuned, a configuration gains a deployment flag, or a bug gets fixed directly in the output. Regenerating from an updated model now means reconciling two authors. For a team maintaining SDKs, that ownership problem can determine whether generation remains useful after the initial scaffold.

[Jostraca](https://github.com/jostraca/jostraca) offers components for describing output files and several strategies for existing content. Eight small experiments against version 0.39.0 show useful merge behavior alongside defaults that need careful integration. The distinction is practical: keeping edits, detecting conflicts and preserving application rules are separate responsibilities.

## A generator with ordinary code

Jostraca represents output through components such as Project, File and Content. Its define phase constructs a tree; a subsequent build phase writes files. Iteration and branching remain ordinary JavaScript. A generator author can organize repeated output into functions without maintaining control flow in a separate template language. [The project documents this design](https://github.com/jostraca/jostraca/blob/main/docs/explanation.md).

The following core is exercised in the accompanying experiments:

```js
import { Jostraca, Project, File, Content } from 'jostraca'

const generator = Jostraca({
  existing: { txt: { write: true, merge: true } },
})

const renderSettings = (body) => generator.generate(
  { folder: './out' },
  () => Project({}, () => {
    File({ name: 'config.sh' }, () => Content(body))
  }),
)
```

This abstraction is useful when output has repeated structures. For a generator that writes two static files, nested component callbacks could be more machinery than needed. The decision should depend on expected regeneration and customization, rather than treating components as inherently better than templates.

## Preservation works when ancestry exists

The first fixture generated PORT=8080 and HOST=localhost. A local edit appended DEBUG=1. The generator then changed the port to 9090. With merge enabled and saved history available, both independent changes survived. With default options, the added line disappeared.

Overwrite is reasonable for disposable files wholly owned by a generator. Applying that default to edited application files requires an explicit ownership decision. Enabling merge globally would also be an incomplete answer: some outputs should be replaced, others reviewed, and some should never accept hand edits.

An identical-input rerun retained the fixture's SHA-256 and modification time. Avoiding an unnecessary write can prevent downstream tools from reacting to a timestamp change. This experiment demonstrates that behavior for one small file; it is not a throughput benchmark or evidence about a large repository.

## Presentation needs two flags

The existing-file options have an awkward interaction. Setting present:true alone left write enabled. The edited file was replaced and no proposed-output sidecar appeared. Explicitly disabling write preserved the original and produced config.new.sh:

```js
const generator = Jostraca({
  existing: { txt: { write: false, present: true } },
})
```

The behavior follows the option precedence, but the API asks callers to express one intention through two booleans. A mutually exclusive strategy option could prevent this configuration mistake. Alternatively, validation could reject combinations whose apparent intent differs from their effective behavior. Documentation helps; making the unsafe combination harder to express would help further.

## Missing history changes the guarantee

Three-way merge needs an ancestor. Jostraca retains previous generated content under .jostraca. To test its absence, the experiment renamed that directory after generation and a local edit, then regenerated with write:true and merge:true.

The result contained the new generated content, lost DEBUG=1 and reported no conflicted file. Requesting merge did not prevent overwrite when ancestry was unavailable.

A text merger cannot infer an absent ancestor reliably. The policy decision is what happens next. For edited output, an explicit refusal or a proposed-file fallback would be easier to trust than silent replacement. Generator authors should establish whether history must travel with the project and how a clean checkout verifies its availability.

## Conflict detection needs an integration check

When both sides changed the port differently, Jostraca wrote conflict markers and returned one entry in files.conflicted. The asynchronous generate call still resolved. A further generation preserved the unresolved output and continued reporting the conflict, which avoids stacking new markers over old ones.

The caller should reject conflicted output before downstream use. The accompanying article check executes this guard against a deliberately conflicting file:

```js
const result = await renderSettings('PORT=9090\n')
if (result.files.conflicted.length > 0) {
  throw new Error('Generated files need conflict resolution')
}
```

That check would not catch the missing-history overwrite. The result classifications and ancestry checks address different failure modes.

## A clean merge can still produce invalid configuration

The eighth experiment began with a JSON range whose minimum was 0 and maximum 100. The generator raised minimum to 80. Independently, the user lowered maximum to 50. Each change produced a valid range on its own. The unchanged units field separated the edited lines.

Jostraca combined the edits without reporting a textual conflict:

```json
{
  "minimum": 80,
  "units": "percent",
  "maximum": 50
}
```

The output parsed successfully but violated minimum <= maximum. A clean text merge preserved the edits while breaking their shared constraint. This is a boundary of text merging, not evidence that Jostraca promises to understand application semantics. Schema checks, compilation where relevant, and domain tests still belong after generation.

## Where it fits

Jostraca is a credible option for generators that repeatedly update editable text. Its merge, conflict reporting and unchanged-file behavior are useful. Adoption should include a file-ownership policy, retained ancestry, conflict checks and application validation. Teams with completely disposable output may reasonably keep overwrite behavior and avoid the additional merge obligations.

The [reproductions and recorded results](https://github.com/Tunaycel/jostraca-critical-review) pin the package and dependencies. They cover small files on Windows and Ubuntu, not performance, cross-language parity or every output mode. The recommendation is conditional because those integration requirements affect whether preserved text becomes dependable software.

For an adoption decision, a team's next evaluation should use its actual output and edit patterns. A merge that preserves a deployment flag in this fixture says little about generated clients with renamed methods or changed types. Maintaining assertions over representative regenerated projects would provide more relevant evidence than increasing the number of tiny examples indefinitely. The examples here establish specific behaviors and integration questions; they should help a team design that evaluation rather than substitute for it.
