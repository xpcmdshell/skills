# Subagent architectures

Build subagent capability into the target system by connecting three parts:

| Part | What the engineer supplies |
| --- | --- |
| Runtime support | Child execution, tool access, dispatch, communication, progress inspection, and termination. |
| Parent instructions | When to delegate, how to divide work and brief children, and how to manage and integrate their outputs. |
| Child instructions and context | Reusable specialization, the particular assignment, relevant evidence, and coordination guidance. |

A prompt telling a child to ask questions needs a working communication mechanism. A spawn tool needs parent instructions explaining when and how to use it. Design and verify these parts together.

## Integrate existing subagent support

- Inspect the target framework's delegation, session, messaging, and lifecycle support before building replacements.
- Establish how the framework constructs child context, exposes tools, reports progress, and returns results.
- Use existing capabilities directly when they fit. Add missing behavior through the framework's extension points.
- Decide with the user whether children can communicate directly with peers or coordinate through the parent.
- Use those findings to write the parent and child instructions. Describe the target's actual operations and notification behavior.

## Choose reusable profiles or dedicated implementations

For systems with several kinds of subagents, prefer a shared execution mechanism with configurable profiles.

- A profile supplies reusable instructions, a description, available tools, and model-selection defaults.
- The shared runtime handles session creation, dispatch, communication, progress, and termination.
- Adding a reviewer or researcher then means defining its profile, not rebuilding its lifecycle and messaging machinery.
- Keep the particular assignment separate from the profile so the same specialization serves different tasks.
- Use the framework's profile mechanism when available. YAML, JSON, or Markdown with frontmatter can make custom profiles easy to maintain.

A dedicated implementation can fit a very narrow child task with a fixed interface and task-specific execution needs.

- For example, a document-processing pipeline can invoke a child to extract specified fields and return a validated record.
- Code can establish that child's prompt, tools, model, and return contract at the invocation boundary.
- Several specializations that differ mainly in prompts, tools, or models benefit from profiles rather than separate agent implementations.

## Teach the parent how to delegate

Apply [prompt-writing guidance](prompt-writing.md) to the target parent's instructions. Explain the available capabilities, when they help, and how the parent remains responsible for the combined result.

The parent's instructions need to answer these operational questions:

| Parent decision | What its instructions must explain |
| --- | --- |
| Whether to delegate | Which work benefits from parallel execution, isolated investigation, or specialized expertise, and which work stays local. |
| How to divide work | How to identify shared decisions, establish contracts, and assign independent responsibilities. |
| What to send | Which goals, constraints, context, ownership, and completion criteria belong in each brief. |
| What to do after dispatch | How to continue independent work, inspect progress, answer questions, redirect children, and stop obsolete work. |
| When the task is complete | How to check child evidence and verify the combined result against the user's requirements. |

### Example: parent-facing delegation instructions

Suppose the target exposes a tool named `agents` with `spawn`, `list`, `inspect`, `message`, `result`, and `stop` operations. The harness automatically delivers completion and message notifications. The engineer can include the following in the parent's prompt:

```text
Use the agents tool to delegate assignments to context-isolated subagents.
Its spawn operation starts independent investigations or implementations concurrently.
Keep small tasks and changes requiring continual joint decisions local.
A specialized profile is not, by itself, a reason to delegate.

Before dispatch, resolve shared decisions and supply the same contract to
children whose work must agree. Assign distinct file ownership and avoid
duplicate implementations of the same responsibility.
Give each child its goal, assignment, relevant context, constraints, and
completion criteria. Children do not inherit this conversation.

Use the list operation to see assignments and inspect to examine progress.
Use the message operation to answer questions or redirect a running child.
Use the stop operation to cancel obsolete work.

Continue independent work after spawning. Completion and messages notify you;
do not repeatedly poll for them. Use the result operation to retrieve outputs.
Inspect supporting evidence before accepting the work.

You own integration and the final answer. A child's completion claim does not
establish that the overall task is complete.
```

The capability description and profile catalog belong in the parent's accessible context. Their existence in configuration files alone does not teach the parent to use them.

### Example: teach the parent to establish shared contracts

When child assignments must agree on behavior, the parent's delegation instructions must require that agreement before dispatch.

**Guidance to include in the parent's prompt:**

```text
Before delegating work across a shared interface, identify the decisions
that both implementations must agree on. Resolve them from the task's
requirements or ask for the missing decision before dispatching dependent work.

Specify the shared data types, operation signatures, and behavior, including
failure and partial-success handling. Give each child the same contract and
its own implementation responsibility. Require children to raise contract
problems with you before changing the agreement.

Do not leave shared decisions to separate children merely because they own
different files. Check the combined behavior when integrating their work.
```

Suppose the target parent delegates a contact-import feature to an importer child and a storage child. The project already has a CSV parser and a SQLite `Database` type in `src/database.ts`.

The task requires replacing contacts with matching IDs and leaving storage unchanged if any input row is invalid.

The following briefs show the difference between naming responsibilities and communicating the shared behavior required by the task.

**Poor parent output: importer brief**

```text
Implement CSV contact import in src/contacts/import-csv.ts.
Parse the id and displayName columns, validate the rows, and save contacts
through the storage module. Return the number imported. Add integration tests.
```

**Poor parent output: storage brief**

```text
Implement contact persistence in src/contacts/sqlite-store.ts using SQLite.
Provide a batch save operation for the importer. Handle duplicate IDs and
database errors, and add integration tests.
```

- These briefs specify files and responsibilities but leave shared behavior undecided.
- The importer might save rows incrementally while the intended import must leave storage unchanged when any row is invalid.
- The storage agent might skip existing IDs while the importer counts every submitted row as saved.
- Each child can implement and test its own interpretation. The disagreement appears only when the pieces run together.
- The parent's prompt must require it to settle this shared behavior and include that agreement in both briefs.

**Better parent output: shared contract established in `src/contacts/contract.ts` before dispatch**

```ts
export interface Contact {
  id: string;
  displayName: string;
}

export interface ContactStore {
  // Insert new IDs and replace existing contacts with matching IDs.
  // Commit the whole batch or reject without changing stored contacts.
  save(contacts: readonly Contact[]): Promise<void>;
}
```

**Better parent output: importer brief**

```text
Goal: import CSV contacts into persistent storage.
Own src/contacts/import-csv.ts and tests/import-csv.integration.ts.
Read src/contacts/contract.ts. The storage agent implements ContactStore.

Export importContacts(csv: string, store: ContactStore): Promise<number>.
Use the project's CSV parser. Require id and displayName columns.
Reject empty field values and duplicate IDs within the input.
Validate the whole input before calling store.save once.
Return the imported row count after save succeeds. Propagate save failures.

Test valid input and an invalid later row through the importer and a real
store once the storage implementation is available. Invalid input must
leave stored contacts unchanged.
Return changed paths and integration results, including blocked checks.
Choose private helpers freely. Send shared-contract issues to the parent
through the agents tool's message operation before changing the contract.
```

**Better parent output: storage brief**

```text
Goal: persist CSV-imported contacts across application restarts.
Own src/contacts/sqlite-store.ts and tests/sqlite-store.integration.ts.
Read src/contacts/contract.ts. The importer agent validates CSV input.

Export createContactStore(db: Database): ContactStore using the project's
SQLite Database type from src/database.ts. The caller owns the connection lifetime.
Implement save with a transaction: insert new IDs and replace matching IDs.
Resolve after commit. Reject on failure with no partial batch committed.

Test insertion, replacement, and rollback against a real temporary database.
Reopen the database to verify persistence.
Return changed paths and integration results.
Choose private helpers freely. Send shared-contract issues to the parent
through the agents tool's message operation before changing the contract.
```

- In the better output, the parent owns `contract.ts` and wires the importer to storage for final integration.
- The contract settles shared decisions so each child can implement without repeatedly waiting for decisions from the other.
- Evaluate the target parent's delegation by whether its assignments establish this agreement, not merely whether its briefs name separate files.
- Teach the parent to keep work together when important decisions still require continual joint adjustment.

## Construct child context and reusable profiles

Apply [prompt-writing guidance](prompt-writing.md) when authoring profiles and defining how the target assembles each child's input.

| Input | Where it comes from |
| --- | --- |
| Reusable specialization | Profile instructions written by the engineer or user, such as how to conduct a code review. |
| Assignment-specific context | The target parent's brief, including requirements, relevant paths, ownership, and expected output. |
| Callable capabilities | The runtime's configured tool set and agent-visible contracts. |
| Coordination instructions | Harness-specific guidance for asking questions, receiving answers, waiting, and completing the assignment. |

- Configure the child-session builder to combine these inputs. A profile name alone does not supply the current assignment.
- Teach the parent to put actual decisions in the brief rather than refer to discussions the child cannot see.
- Make referenced files accessible in the child's environment. A path in a brief is useful only if the child can read it.
- Apply tool selection when creating the session. Listing tools in the child's prompt does not make them callable.

### Example: a reusable review profile

For a harness that loads Markdown profiles with YAML frontmatter, the engineer can define a reviewer once and reuse it across assignments. This example assumes an `agents` coordination tool with a `message` operation:

```yaml
---
name: reviewer
description: Review supplied code files against established requirements and report actionable findings without edits.
model: github-copilot/gpt-6.1-sol
tools:
  - read
---

Review the supplied files against the assignment's requirements.
Cite the relevant file and lines for each finding.
Use the read tool to inspect the supplied paths and related source files.
Use the agents tool's message operation to ask for missing requirements
or file locations. Set the recipient argument (to) to "parent" and put
your question in the text argument.
When blocked on the answer, set waitForReply to true.
Return supported findings and unresolved questions. Do not implement fixes.
```

- Load the profile body into the child's instructions and expose the selected `read` tool.
- Supply the `agents` coordination tool alongside those profile-selected tools, as assumed by this example.
- Present the profile name and description to the parent for selection. Load the full review instructions into the selected child.
- Pass the parent's assignment separately. Changing the review target does not require rewriting the profile.

## Configure model selection

The review profile above selects its model directly with `model: github-copilot/gpt-6.1-sol`. Define how the target resolves that field and whether an assignment can override it.

- Decide whether the subagent definition fixes the model or the parent can choose one at dispatch.
- Expose available model choices to the parent when it selects at runtime.
- Apply that selection policy in the runtime and explain it in the parent's instructions.
- Model roles are an optional indirection: a profile names a role, and separate configuration maps it to a model.
- Roles let users change shared model assignments without editing each profile. Direct model fields keep selection in the definition itself.

Teach the parent to select from the profiles exposed by the harness. For the example `agents` tool, its resulting spawn arguments can be:

```json
{
  "op": "spawn",
  "tasks": [
    {
      "name": "review-contact-import",
      "profile": "reviewer",
      "summary": "Review contact import validation and storage behavior",
      "task": "Review src/contacts/import-csv.ts and src/contacts/sqlite-store.ts against src/contacts/contract.ts. Invalid CSV must leave storage unchanged. Report actionable findings without editing files."
    }
  ]
}
```

- The runtime resolves `reviewer`, applies its configured model and tools, and supplies `task` as the child's assignment.
- If runtime overrides are enabled, document the assignment's `model` field for the parent and apply it without changing the profile's instructions or tools.

## Provide missing management capabilities

When implementing or extending subagent support, expose useful operations rather than internal scheduler bookkeeping. Apply [tool-design guidance](tool-design.md) to their schemas, results, and errors.

The example `agents` tool can expose these management operations:

| Operation | Agent-facing contract |
| --- | --- |
| `spawn` | Accept one or more assignments and return stable IDs without waiting for completion. |
| `list` | Show assignments, responsibilities, states, and current activity. |
| `inspect` | Retrieve progress and conversation records, including tool calls and results, before completion. |
| `message` | Send questions, answers, feedback, or redirection to an identified recipient. |
| `wait` | Yield until watched work finishes or a message needs attention. Report what caused the return. |
| `result` | Retrieve completed output together with status and errors. |
| `stop` | Cancel the selected work and report its resulting state. |

### Choose communication support for the task

Check which communication channels the framework already supports. When implementing subagents yourself, consider messaging for coordination after dispatch.

| Communication | What it enables | Tradeoff |
| --- | --- | --- |
| Parent → child | Follow-up instructions, corrections, new evidence, and redirection while work runs. | The child cannot initiate clarification unless another channel exists. |
| Child → parent | Questions, progress, blockers, and discoveries before completion. | Questions need a response channel to become a useful clarification loop. |
| Parent ↔ child | The parent answers questions and adjusts assignments without restarting the child. | The parent must handle incoming requests while managing its own work. |
| Child ↔ child | Collaborating children share results and resolve ambiguities directly. | More communication paths can produce conflicting decisions or leave the parent unaware of changes. |

- Use parent-child messaging when assignments need clarification or adjustment after dispatch.
- Consider peer messaging when children need to collaborate. Agree with the user whether coordination is direct or parent-mediated.
- Teach children which decisions they can resolve together and which require the parent. Peer communication must not silently change shared requirements or contracts.
- Match prompts to the available channels. Do not instruct a child to ask and wait when the harness cannot deliver an answer.

### Connect communication instructions to delivery

- Implement or integrate delivery into the recipient's working context. A log entry alone does not communicate with the agent.
- Include sender and recipient identity in delivered messages so agents can interpret and answer them.
- Configure permitted recipients for the chosen communication channels, then describe those channels in the parent and child prompts.
- Ensure the runtime can wake a waiting child when an answer arrives.

In the review-profile example, the child uses the `message` operation with `to`, `text`, and `waitForReply` arguments. The runtime must deliver the question, wait for incoming communication, and resume the child when an answer arrives.

Write waiting instructions for each caller's lifecycle. If ending a child run marks its assignment complete, instruct it to wait rather than return while blocked. A parent that resumes on notifications can use a different waiting procedure.

### Make lifecycle contracts match execution

- Report queued, running, awaiting input, completed, failed, and stopped assignments distinctly through management tools.
- Deliver questions, completion, and failures through the notification or wait mechanism described to the parent.
- Preserve results after completion and provide access to supporting records.
- Define whether feedback resumes a completed child's session or requires a new assignment. Explain that behavior in the tool contract.
- Reject operations that cannot execute in the current state, rather than implying they succeeded.
- Implement stopping as cancellation of execution, not removal of a roster entry.

## Verify parent behavior and harness support together

Test the system you are building with its actual parent prompt, profiles, tools, and model-selection configuration. Inspect the generated briefs and child sessions as well as the final result.

| Scenario | Expected result |
| --- | --- |
| Straightforward one-call edit | The parent completes it directly rather than delegating unnecessarily. |
| Assignments whose implementations must agree | The parent resolves shared behavior before dispatch, gives both children the same contract, and verifies their combined behavior. |
| Unresolved shared design | The parent resolves or sequences the dependency before dispatching implementation. |
| Same profile used for different tasks | Each child receives the reusable instructions and selected tools with its own task-specific brief. The parent does not embed fixed task assumptions in the profile. |
| Fixed model or permitted runtime selection | The child uses the configured model without changing its behavioral profile. |
| Child lacks information | Its question reaches the parent; the answer reaches the child and work continues. |
| Peer coordination | Direct messages work when enabled; parent-mediated coordination works when they are disabled. |
| Parent has no independent work | Completion or a question wakes it through the supported notification or wait mechanism. |
| Work fails or becomes obsolete | Failure remains visible or the parent stops execution; status reflects the outcome. |
| Child reports success | The parent checks evidence and integrated behavior before declaring the overall task complete. |

## Study existing designs

| Reference | What to study |
| --- | --- |
| [GitHub Copilot SDK: custom agents](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/custom-agents) | Session-level agent definitions with prompts, selected tools, models, and preloaded skills; subagent lifecycle events. |
| [OMP: task agent discovery and selection](https://github.com/can1357/oh-my-pi/blob/main/docs/task-agent-discovery.md) | Markdown agent definitions, tool selection, role-backed models, and user/project discovery. Includes a profile, role mapping, and dispatch example. |
| [OpenCode: agents](https://opencode.ai/docs/agents/) | JSON or Markdown definitions with prompts, subagent mode, models, and per-agent permissions. |
