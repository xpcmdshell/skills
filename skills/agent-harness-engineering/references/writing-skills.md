# Writing skills: transfer expertise

> **“I know kung-fu.” — Neo, *The Matrix***

A skill transfers experience, taste, and expertise to the agent that loads it. Organize it around the problem or job to be done. Equip the agent to solve common cases quickly, handle edge cases, and follow a robust process for complex work.

The result is a capability, not a collection of instructions. The agent should recognize situations, choose suitable actions, and judge results without the originating conversation.

## 1. Establish the capability and recover the expertise

- Define what the agent must do well, at which interface and level, and what successful work produces.
- Keep research inside that scope. A query-optimization skill needs plan interpretation, not a survey of database architecture.
- Assume general competence. Spend context on unfamiliar facts, consequential distinctions, and non-obvious reasoning.
- From documentation, recover working usage, alternatives, constraints, and authoritative lookup sources.
- From completed work, recover why the approach worked, not the sequence of attempts.
- From corrections, recover the missing concept rather than accumulating warnings about individual mistakes.
- From examples, recover the quality standard that transfers to other cases.
- Remove incidental names, paths, and development history. Preserve concrete details when correctness depends on them.
- Distinguish observed success from an established explanation. Resolve essential knowledge gaps instead of inventing guidance.

## 2. Teach the model and the decisions it supports

Open with the governing approach. Explain the entities, relationships, constraints, and outcomes that organize expert reasoning.

### Establish shared concepts

- Define specialized terms when ambiguity changes a decision. Explain their relationships, not just their individual meanings.
- Use the same vocabulary across the entry file and references.
- Prefer established concepts when they carry the intended meaning. Define unfamiliar ones before relying on them.
- Use a glossary only when the distinctions warrant it.
- Identify tempting but incorrect interpretations. Explain which model replaces them and what difference it makes.

### Make judgment usable

- Give common cases a direct route to a useful result, with conditions that establish when the route applies.
- Explain how edge cases change the reasoning or procedure.
- Introduce categories when classification changes the next action, evidence requirement, or validity standard.
- Turn quality labels such as “robust” into observable criteria. Identify what to inspect and which decision it changes.
- Explain important tradeoffs. Use diagnostic questions or thought experiments when they help expose a relevant property.
- Label heuristics as heuristics and state what evidence can override them.
- For recognizable patterns, connect the clue, its mechanism, confirming evidence, counterevidence, and limits of the conclusion.

### Example: diagnose a slow report

Suppose a skill teaches performance diagnosis for a reporting application.

**Recipe-only guidance:**

> Inspect the query plan, add an index, and rerun the report.

**Expertise-transfer guidance:**

> Measure where the report spends its time: database execution, data transfer, or rendering. Compare measurements from the same workload. Investigate the part responsible for the delay.
>
> When database execution dominates, inspect the plan and compare estimated and actual row counts. A scan is a clue, not sufficient reason to add an index. Determine whether the query needs most rows before treating the scan as wasteful.
>
> After a change, compare timings under equivalent conditions and confirm that report results remain unchanged. If workload conditions differ, treat the performance comparison as inconclusive.

- The second excerpt supplies a problem model, a conditional investigation path, and a validity standard.
- The scan example teaches why recognizable evidence does not settle its interpretation.
- These database details illustrate expert reasoning; they are not requirements for unrelated skills.

### Use examples to teach, not decorate

- Contrast plausible mistakes with good execution. Choose examples that resolve a real ambiguity in the guidance.
- State hypothetical assumptions and identify the transferable lesson.
- State binding requirements directly, with their applicability conditions. Do not hide them inside illustrative stories.
- Write the desired behavior explicitly. Pair necessary prohibitions with what the agent should do instead.
- Keep qualifications that change an action or conclusion. Remove unrelated hedging.

## 3. Define the process and what counts as complete

For complex work, organize the process around questions to answer, decisions to make, and evidence to establish.

- Explain how earlier observations support later decisions.
- Specify analytical obligations rather than every tool call. Require exact procedures and ordering where correctness depends on them.
- Define intermediate results when later work depends on them. Use the application's output contract rather than inventing a competing format.
- Preserve the source, context, and limits of evidence through investigation and reporting.

### Set completion criteria with clarity and sufficient coverage

- **Clarity:** make complete and incomplete distinguishable through observable results or evidence.
- **Coverage:** require enough work to support the intended outcome, not merely production of an artifact.
- Define the relevant scope. Exhaustiveness means covering that scope, not exploring without a stopping condition.
- Apply these standards to reference-led work as well as ordered procedures.

For the reporting example, “produce a benchmark table” is observable but insufficient. A useful criterion requires comparable workloads, recorded timings, and unchanged report results. State the task's actual comparison procedure and acceptance conditions; do not leave “unchanged” or “comparable” undefined when their meaning is task-specific.

### Handle uncertainty and revision

- Explain what can continue when evidence is missing and which conclusions remain conditional or blocked.
- Preserve those conditions in the final result rather than converting uncertainty into certainty during synthesis.
- Identify observations that challenge an earlier assumption or approach.
- Explain what to reconsider and where to resume after revision.
- Distinguish ordinary execution difficulty from recurring evidence that the approach is wrong.

## 4. Organize the package around what the agent needs next

A skill can contain several specialized capabilities. Keep a focused skill in one file when its guidance is useful together. Use references when different tasks or stages need substantial, different guidance.

### Keep the shared foundation visible

- Give `SKILL.md` YAML `name` and `description` fields. Match the name to its directory.
- Describe the capability and the situations that should select it.
- Keep the shared problem model, core rules, and orientation in the entry file.
- Keep material needed by every task branch inline. Move substantial branch-specific guidance behind references.
- In workflows, keep the steps visible rather than burying them beneath specialized reference material.
- Split by sub-capability, task variant, or stage, not arbitrary file length.
- Let each reference use the form it needs: conceptual guide, decision framework, workflow, recipe, or worked example.

### Write references as actionable pointers

A pointer names material outside the current context and states when to load it. Skill descriptions and internal reference links both serve this function.

- State the triggering condition, reference path, and what to do with the material.
- Route by task in the index and by stage or decision at the point of use.
- Make required guidance mandatory when its condition holds, not optional “further reading.”
- Use descriptive relative Markdown links for internal references.
- State prerequisites. Do not assume sibling references are loaded merely because they exist.
- Allow multiple references when work spans subareas, without loading the whole package at startup.
- Verify discovery and invocation behavior against the target harness rather than assuming universal metadata semantics.

For the hypothetical reporting skill:

- **Weak pointer:** “More information: query-plans.md.”
- **Actionable pointer:** “When measurements identify database execution as the bottleneck, read `references/query-plans.md` to interpret the plan and choose what to investigate.”
- The entry file teaches how to locate the bottleneck. Query-plan details load only when relevant.
- Separate rendering guidance serves rendering bottlenecks; the agent need not load both for every report.

### Keep each concept together

- Keep a concept's definition, rules, examples, and consequential caveats together so reading one brings the others into view.
- Give shared guidance one authoritative home. Reference it instead of restating it across files.
- Repeat established terms for consistency, not their full definitions at every use.
- Preserve necessary expertise when splitting. A shorter entry file is not an improvement if essential guidance becomes undiscoverable.

## 5. Use the right source of truth

- Use prose for judgment, unwritten conventions, non-obvious constraints, and reasons that affect decisions.
- Use existing tools or executable helpers for repeatable mechanics and checks when they improve reliability.
- Document helper invocation, dependencies, inputs, and useful outputs. Remove redundant manual procedures.
- Treat copied commands and configuration as potentially stale copies of environment facts.
- Point to authoritative configuration or installed help for straightforward lookups.
- Include exact commands when they materially improve execution or encode non-obvious invocation details. Verify them against the actual environment.
- Link version-matched external documentation for unfamiliar capabilities and changed behavior.
- Keep routine use possible without rereading an entire external manual.
- Distinguish external fact-checking sources from internal references that teach the capability.

## 6. Test discovery, execution, and transfer

Test the package from the receiving agent's context, without supplying the author's conversation or unlisted prerequisites.

| Test | Evidence to look for |
| --- | --- |
| Discovery | A matching request causes the agent to load the skill and relevant references; unrelated branches stay unloaded. |
| Common case | The agent reaches a correct result without reconstructing missing expertise. |
| Edge case | The agent recognizes that a familiar recipe does not apply and adjusts appropriately. |
| Complex work | The agent satisfies the evidence and coverage requirements and revisits decisions when warranted. |
| Transfer | An unfamiliar valid task uses the taught reasoning without inheriting incidental example details. |
| Mechanics | Frontmatter and links work; documented recipes and helpers execute through the stated path. |

- If required material is missed, test the pointer's wording before inlining the entire reference.
- If work stops too early, sharpen the completion criterion before adding more process.
- If judgment remains uncertain, use fresh-context trials. Successful script execution alone does not establish reasoning quality.
- Test suspected no-op instructions against the model's behavior with and without them rather than judging by style alone.
- Remove whole passages that add no capability. Retain explanations that improve decisions and transfer.
- Prune stale facts, duplicate rules, decorative examples, and unrelated qualifiers instead of continually appending corrections.
- Report untested portions and verification limits outside the skill. Install or publish only when requested.
