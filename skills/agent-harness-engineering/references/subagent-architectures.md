# Subagent architectures

Delegate meaningful outcomes with clear ownership. Give each child enough context to work independently and a way to coordinate after dispatch. The parent remains responsible for the combined result.

A subagent architecture needs both delegation guidance and harness support. Instructions to clarify, escalate, wait, or stop are ineffective without corresponding capabilities.

## Break work down before dispatch

Use subagents for discrete tasks that benefit from separate attention, expertise, or parallel execution. Prefer assignments with limited dependencies and little need for continuous coordination.

- Perform trivial work directly when delegation costs more than completing it, such as a straightforward one-call edit.
- Split implementation by coherent responsibility, not arbitrary fragments of a tightly coupled change.
- Establish shared design before delegating dependent implementations.
- Define interfaces, data shapes, behavior, and error semantics that cross assignment boundaries.
- Give each assignment explicit ownership and non-overlapping edit targets.
- Do not dispatch concurrent implementations of the same responsibility or concurrent edits to the same file.
- Sequence tasks whose inputs or contracts depend on unresolved work.
- Keep tightly coupled work together when correctness requires continuous mutual adjustment.

Communication handles questions and unexpected discoveries. It does not replace a sound work breakdown.

### Example: implement two modules against an agreed contract

Suppose a feature needs an importer and a storage module.

**Poor breakdown:**

> Agent A: build the importer. Agent B: build storage. Work out the details as you go.

Both agents must invent the shared record format and storage behavior. Their implementations can each look reasonable while remaining incompatible.

**Better breakdown:**

- The parent establishes the record type and storage interface before dispatch.
- The contract defines validation responsibilities, duplicate handling, and error behavior for this feature.
- Agent A owns importer files and tests against the agreed storage interface.
- Agent B owns storage files and tests against the same contract.
- The parent owns shared contract files and final integration.
- If either child discovers a contract problem, it reports the issue before changing the shared agreement.

These module names and contract details illustrate the decomposition, not a required architecture. The transferable rule is to resolve shared decisions before assigning independent implementations.

## Give each child a complete brief

Apply [prompt-writing guidance](prompt-writing.md) when constructing dispatch instructions. The child does not inherit the parent's conversation or understanding unless the harness actually supplies it.

A useful brief establishes:

| Content | What the child needs to understand |
| --- | --- |
| Broader goal | What the overall task accomplishes and how this assignment contributes. |
| Assignment | The specific outcome to produce and the boundaries of the work. |
| Ownership | Files or responsibilities it owns, shared contracts, and relevant neighboring assignments. |
| Context | Decisions, constraints, inputs, and accessible references needed for the work. |
| Completion | Required behavior, validation procedure, and evidence that establishes success. |
| Return | The result or artifact the parent needs for integration. |
| Coordination | Dependencies, questions to escalate, and how to contact the parent or relevant peers. |

- Supply relevant context rather than dumping the entire parent transcript.
- Use precise references when the child can access the material. Include the information directly when it cannot.
- Replace references to an unseen discussion with the decisions and requirements from that discussion.
- State what the child may decide independently and which changes affect other assignments.

## Make delegation conversational

Provide communication after dispatch, not only an initial prompt and a final response.

- Let the parent clarify an assignment, supply new evidence, answer questions, and redirect work.
- Let children ask questions, report blockers, and escalate decisions while their assignments are active.
- Let related children communicate about dependencies and conflicting work.
- Identify message senders, recipients, and the question or thread being answered.
- Deliver messages to the intended agent's working context. A log entry alone is not communication.
- Ensure an agent waiting for an answer can receive it and continue.

When a child discovers a shared contract problem:

1. Identify the conflicting assumption and affected work.
2. Notify the parent and relevant peers through the communication mechanism.
3. Continue independent work if possible; leave work that depends on the unresolved decision blocked.
4. Resume dependent work after the owner resolves the contract and communicates the change.

## Support the full lifecycle

Expose the capabilities needed to coordinate work from dispatch through termination. The operation names below illustrate a coherent interface; their exact spelling is not required.

| Capability | Required behavior |
| --- | --- |
| `spawn` | Start a bounded assignment and return a stable handle for subsequent coordination. Support independent assignments without requiring serial dispatch. |
| `list` | Show assignments, owners, and current states so the parent can understand ongoing work. |
| `inspect` | Retrieve enough task detail to diagnose progress or a blocker without relying on a final response. |
| `message` | Deliver questions, answers, clarifications, and direction to identified agents. |
| `wait` | Yield until relevant work settles or a message needs attention, rather than requiring repeated status polling. |
| `result` | Retrieve the completed output and its status. |
| `stop` | Terminate obsolete, superseded, or unwanted work. |

### Make states and transitions understandable

- Distinguish queued work, running work, a child awaiting input, successful completion, failure, and stopped work.
- Surface completion, questions, and failures so the parent knows when action is needed.
- Preserve results for retrieval after completion.
- Define whether a follow-up message resumes a completed child or requires a new assignment.
- Report rejected lifecycle operations clearly. Do not imply that a stopped or failed child receives work it cannot execute.
- Make termination actually stop the work rather than merely hiding the assignment from a list.

Use the framework's existing lifecycle and messaging support where available. The agent-facing tools should expose useful coordination operations, not internal scheduler bookkeeping.

## Integrate and verify the combined result

- Have the parent review child outputs against the assignment and shared contracts.
- Check the supplied evidence rather than treating “done” as proof of success.
- Resolve incompatible assumptions before accepting the combined work.
- Verify the integrated behavior against the broader task's completion criteria.
- Stop obsolete work when the plan changes and communicate changes to affected agents.
- Keep failures and unresolved dependencies visible in the final assessment.

## Verify the delegation design

Test both the parent's delegation behavior and the harness mechanisms that support it.

| Scenario | Expected result |
| --- | --- |
| Straightforward one-call edit | The parent performs it directly rather than spawning a child. |
| Two independent modules with an agreed interface | Children work in separate ownership areas and integrate against the same contract. |
| Task depends on an unresolved interface | The parent establishes the contract or sequences the work before dispatching implementation. |
| Child lacks information | Its question reaches the parent; an answer reaches the child and work continues. |
| Peers discover conflicting assumptions | They communicate the conflict and coordinate a resolution without silently changing shared contracts. |
| Parent waits for completion | Results or questions wake the parent without a polling loop. |
| Child fails or work becomes obsolete | The parent sees the failure or stops the work; status accurately reflects the outcome. |
| Child reports success | The parent checks the result and verifies integrated behavior before declaring the overall task complete. |
