# Writing skills: transfer expertise

> **“I know kung-fu.” — Neo, *The Matrix***

A skill transfers experience, taste, and expertise to the agent that loads it. Organize it around the problem or job to be done. Equip the agent to solve common cases quickly, handle edge cases, and follow a robust process for complex work.

The result is a capability, not a collection of instructions. The agent should recognize situations, choose suitable actions, and judge results without the originating conversation.

A skill combines prompt guidance with supporting files. Read [prompt-writing guidance](prompt-writing.md) before drafting or revising a skill. It explains how to supply task context, distinguish requirements from examples, remove irrelevant detail, and make success conditions explicit. This guide adds how to recover expertise, teach transferable judgment, and organize material for selective loading. You'll need to apply concepts from both to make a great skill.

## 1. Establish the capability and recover the expertise

- Define what the agent must do well, at which interface and level, and what successful work produces.
- Keep research inside that scope. A query-optimization skill needs plan interpretation, not a survey of database architecture.
- Assume general competence. Spend context on unfamiliar facts, consequential distinctions, and non-obvious reasoning.
- From documentation, recover working usage, alternatives, constraints, and authoritative lookup sources.
- From completed work, recover the requirements, constraints, established facts, assumptions, chosen mechanism, and observed outcome. Explain why the choice fits those conditions and which changes would call for another choice. Distinguish documented facts from author-derived alternatives. Preserve the reasoning, not the sequence of attempts.
- From corrections, recover the missing concept rather than accumulating warnings about individual mistakes.
- From examples, recover the quality standard that transfers to other cases.
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
- When guidance uses a quality label, explain what that quality means for the task: which decisions it changes and what distinguishes a satisfactory result. Preserve the intended outcome without substituting an arbitrary proxy.
- Explain important tradeoffs. Use diagnostic questions or thought experiments when they help expose a relevant property.
- Label heuristics as heuristics and state what evidence can override them.
- For recognizable patterns, connect the clue, its mechanism, confirming evidence, counterevidence, and limits of the conclusion.

### Illustrative examples, not prescribed definitions

The examples below show how to translate a quality label into task-specific guidance. Derive the relevant decisions and success conditions for the actual task; do not reuse these interpretations automatically.

| Quality label | Illustrative task-specific meaning |
| --- | --- |
| Concise | Include what supports the requested decision, choose a clear representation, and omit repetition. |
| Reliable | Preserve specified outcomes across the failures the system must tolerate. |
| Actionable | Resolve the choices and supply the information needed for the recipient's next step. |

### Example: diagnose a slow report

Suppose a skill teaches performance diagnosis for a reporting application.

**Guidance that assumes the cause and remedy:**

> Inspect the query plan, add an index, and rerun the report.

**Expertise-transfer guidance:**

> Measure where the report spends its time: database execution, data transfer, or rendering. Compare measurements from the same workload. Investigate the part responsible for the delay.
>
> When database execution dominates, inspect the plan and compare estimated and actual row counts. A scan is a clue, not sufficient reason to add an index. Determine whether the query needs most rows before treating the scan as wasteful.
>
> After a change, compare timings under equivalent conditions and confirm that report results remain unchanged. If workload conditions differ, treat the performance comparison as inconclusive.

- The first excerpt assumes the database causes the delay and an index fixes it before establishing either.
- The better guidance locates the delay before choosing an intervention. A rendering bottleneck needs a different investigation from slow database execution.
- A scan can be appropriate when the query needs most rows. Seeing a scan alone does not justify adding an index.
- The guidance teaches the agent to choose actions from evidence, rather than repeat the same fix for every slow report.

When expressing the recovered expertise as instructions, follow [prompt-writing guidance](prompt-writing.md#generalize-lessons-not-development-history) for requirements, examples, and applicability.

## 3. Define the process and what counts as complete

For complex work, organize the process around questions to answer, decisions to make, and evidence to establish.

- Explain how earlier observations support later decisions.
- Organize the skill around analytical obligations rather than a transcript of tool calls.
- Define intermediate results when later work depends on them. Use the application's output contract rather than inventing a competing format.
- Preserve the source, context, and limits of evidence through investigation and reporting.

### Set completion criteria with clarity and sufficient coverage

- **Clarity:** make complete and incomplete distinguishable through observable results or evidence.
- **Coverage:** require enough work to support the intended outcome, not merely production of an artifact.
- Define the relevant scope. Exhaustiveness means covering that scope, not exploring without a stopping condition.
- Apply these standards to reference-led work as well as ordered procedures.

Suppose the assignment is to explain why a report is slow.

- A benchmark table can compare equivalent workloads correctly without identifying what causes the delay.
- For example, measuring a small gain from a database change does not explain a delay dominated by rendering.
- Completing the diagnosis requires identifying where the delay occurs and supporting that explanation with measurements.
- If the assignment also requires improvement, completion must address the requested performance outcome while preserving report results.
- The artifact and its measurements support the answer. Producing them does not establish that the assignment is answered.

To express the checks and acceptance conditions, follow [procedures and validity requirements](prompt-writing.md#define-procedures-and-validity-requirements).

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
- Treat copied commands and configuration as potentially stale copies of environment facts.
- Point to authoritative configuration or installed help for straightforward lookups.
- Include exact commands when they materially improve execution or encode non-obvious invocation details. Verify them against the actual environment.
- Link version-matched external documentation for unfamiliar capabilities and changed behavior.
- Keep routine use possible without rereading an entire external manual.
- Distinguish external fact-checking sources from internal references that teach the capability.

### Bundle useful supporting files

- Include any files that help the task. Explain when and how to use them.
- **Recipes** teach implementation techniques through code the agent adapts, such as editing formatted Word text.
- **Automations** implement repeatable operations the agent runs with supplied inputs, such as extracting document comments.
- Choose the form by what is reusable: the technique or the complete operation.
- Document automation invocation, prerequisites, inputs, outputs, and failure behavior.
- Reuse common utilities rather than bundling scripts that merely duplicate them.

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
- Use fresh-context trials to check whether the agent applies the taught reasoning to new tasks without the author's context.
- Test suspected no-op instructions against the model's behavior with and without them rather than judging by style alone.
- When correcting an unwanted behavior, also test a task where similar behavior is necessary. Verify that the agent learns the controlling conditions rather than a blanket preference. Illustrative pairs include a short recommendation versus a complete implementation handoff, or unnecessary infrastructure versus distribution required by residency or availability. Choose pairs relevant to the capability being taught.
- Remove whole passages that add no capability. Retain explanations that improve decisions and transfer.
- Prune stale facts, duplicate rules, decorative examples, and unrelated qualifiers instead of continually appending corrections.
- Report untested portions and verification limits outside the skill. Install or publish only when requested.
