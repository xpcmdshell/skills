# Prompt writing

> **“Show your prompt to a colleague with minimal context on the task and ask them to follow it. If they'd be confused, Claude will be too.”**
> — [Anthropic: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)

Write for the agent receiving the prompt, not for the developer who already understands the system.

## Supply the task context

- State the agent's role and the domain in which it works.
- Describe its assignment, the inputs it receives, and the scope of its responsibility.
- Explain the desired outcome, not just the technique or next action.
- Identify the expected deliverable and what makes it successful.
- Supply the task knowledge needed to act correctly.
- Do not assume the receiving agent inherits the coding agent's conversation, design discussions, or knowledge of the codebase.
- Review the prompt with the tools, references, and runtime context the receiving agent actually receives.
- Put necessary information in that accessible context. Do not mentally fill gaps from the development conversation.

## Include details that affect the work

- Include facts that affect the agent's decisions, actions, or interpretation of results.
- Omit implementation trivia and qualifications unrelated to the task.
- Explain system behavior when the agent needs that knowledge to act correctly.
- Do not describe internal implementation merely because you encountered it while building the system.
- State requirements directly.
- Use qualifiers only when they express a real applicability condition or uncertainty.

### Example: distinguish implementation details from operational context

Suppose a support agent issues approved refunds. The refund tool can return `pending` or `completed`. A status tool checks progress.

**Poor prompt excerpt:**

> Issue approved refunds using `issue_refund`. Requests become rows in the refund_jobs table. A background worker processes them through the payment adapter. This flow does not use the legacy billing service. Tell the customer the result.

**Better prompt excerpt:**

> Issue approved refunds using `issue_refund`. A `pending` result means the request is accepted, but the refund is not complete. Use `get_refund_status` to check its progress. Tell the customer the refund is complete only when its status is `completed`. Otherwise, explain that it remains pending.

- The poor excerpt describes storage, components, and development history without explaining how to interpret the tool's result.
- The better excerpt explains the operational consequence: acceptance does not establish completion.
- Both concern the same system. Only the second gives the agent information needed to act and report accurately.
- This hypothetical workflow illustrates relevance. Its tools and statuses are not requirements for other agents.

## Define procedures and validity requirements

- Do not substitute phrases such as “verify your results” for a task's actual verification requirements.
- When the task requires a specific procedure, state that procedure and any required ordering.
- Identify the evidence the procedure must produce.
- State the conditions that establish a valid result.
- Explain how the agent handles failed or inconclusive checks.
- If requirements are unknown, obtain them from the user or an authoritative task reference. Do not invent them.
- Make required references accessible and tell the agent when to consult them.
- Distinguish required procedures from optional techniques and illustrative examples.

### Example: make verification operational

Suppose an agent checks a converted transaction file against its source. The task requires exact row correspondence and preserved amounts.

**Poor instruction:**

> Convert the file and verify your results.

**Better instruction:**

> Convert the supplied transaction file to the requested format. Preserve every transaction ID and amount.
>
> Before submitting the converted file:
> - Check that every source transaction ID appears exactly once in the output.
> - Check that the output contains no additional transaction IDs.
> - Compare each output amount with its source amount using exact decimal values.
> - Treat the conversion as verified only if all checks pass.
> - If a check fails, correct the conversion and repeat the checks.
> - If missing or unreadable source data prevents comparison, report the blocker. Do not claim verification succeeded.

- The better instruction defines the checks, evidence, acceptance conditions, and handling of unsuccessful checks.
- These particular checks belong to this hypothetical task. They are not a universal verification procedure.
- Transfer the specificity of the instructions, not their transaction-specific requirements.

## Generalize lessons, not development history

- Write instructions for the intended task class, not a transcript of recent debugging.
- When correcting a failure, identify the missing instruction or distinction that caused it.
- Express that lesson at the scope where it applies.
- Do not accumulate unrelated caveats after each failure.
- Do not convert incidental example details into universal requirements.
- Label hypothetical examples and state their assumptions.
- Use examples to clarify an instruction, not to hide requirements inside a story.
- When multiple examples are useful, vary them to demonstrate the intended general behavior.
- Fix an unclear tool contract instead of adding prompt instructions that teach the agent hidden implementation rules.

## Review from the receiving agent's perspective

Review the assembled prompt, tool descriptions, loaded references, and runtime inputs together.

- Can a reader identify the role, assignment, scope, and desired outcome without the development conversation?
- Can the reader find the information needed to perform the task?
- Are task-specific procedures and success conditions explicit?
- Does each implementation detail affect a decision or action the agent must take?
- Does each qualifier express a real condition or uncertainty?
- Are examples clearly distinct from binding instructions?
- Does the guidance still apply to another valid instance of the task?

Resolve gaps before treating the prompt as complete. Test on representative task instances beyond the one that motivated the prompt.

## Sources

- [Anthropic: Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) — clear instructions, relevant context and motivation, and explicit success criteria.
- [OpenAI: Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) — explicit identity and instructions, relevant context, clear structure, and diverse examples.

Use these living references when adapting guidance to a particular model. Do not copy model-specific advice or sample prompts without checking their applicability.
