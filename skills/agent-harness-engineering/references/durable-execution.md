# Durable execution

Use durable execution when a task must survive the process or machine that runs it. Reuse framework support or a compatible execution service. Do not build a workflow engine to add agent recovery.

## Choose it for the task

- Durable execution suits interrupted agent runs, long waits, human approvals, and work on disposable workers.
- Ordinary execution can suffice when restarting the whole task is cheap and safe.
- Conversation persistence restores prior messages. It does not necessarily restore pending work or resume an interrupted tool call.
- [Compaction](compaction.md) preserves context for reasoning. [Memory and history](memory-and-history.md) covers retention and recall. Neither replaces execution recovery.

## Understand the pattern

- The runtime records execution progress and completed operation results outside the disposable worker.
- Replacement workers recover from recorded boundaries. They do not restore an arbitrary process instruction or its entire memory.
- Some runtimes replay orchestration code and substitute recorded results for completed operations. Others resume from explicit checkpoints.
- Model choices must survive recovery through the integration's recorded state or results, rather than being guessed again.
- A scheduler, event, or caller activates resumed work. Checkpoint storage alone does not provide this activation.

### Example: wait for approval without keeping a worker alive

- A research agent prepares a report, stores the artifact, and enters a durable approval wait.
- Its worker disappears while the user reviews the report.
- The approval event resumes the task on replacement compute, using the recorded report reference and decision.
- Saving only chat messages leaves the application to reconstruct the pending wait and determine what already happened.
- Saving the report only on the lost worker leaves a valid execution checkpoint pointing to a missing artifact.

## Check the integration contract

| Decision | What to establish |
| --- | --- |
| Recovery scope | Identify which model calls, tools, child tasks, and waits the integration records. |
| Durable storage | Keep execution records outside infrastructure that can disappear. An ephemeral local database does not meet this requirement. |
| Activation | Identify what detects interrupted work and schedules replacement compute. A library may require application-managed hosting. |
| Entry points | Use the durable invocation path. Attaching an integration does not necessarily make ordinary agent calls durable. |
| Recovery boundaries | Choose checkpoint settings that cover abrupt worker loss. Shutdown-only persistence cannot protect against a destroyed process. |
| External effects | Follow retry contracts. Use service-supported idempotency or reconciliation where a repeated operation can cause harm. |
| Artifacts and environments | Persist required artifacts and recreate needed environments. Recorded shell output does not restore the filesystem that produced it. |
| Deployment changes | Follow the runtime's versioning rules so replacement workers can resume existing executions under compatible code. |

- A tool can change an external system before its result is recorded. Recovery can repeat that uncertain operation.
- Do not interpret durable execution as an exactly-once guarantee for arbitrary external effects.
- Do not assume detached background work or unwrapped I/O inherits the agent's durability.
- Use durable waits for external input, rather than keeping a process asleep or polling indefinitely.
- Check cancellation behavior across restarts. Stopping a caller does not necessarily cancel its durable work or undo completed effects.

## Verify recovery, not just persistence

- Start a representative task, complete some work, then terminate its worker without a graceful shutdown.
- Resume on replacement compute with no access to the original worker's local files.
- Check that recorded work is reused, pending work resumes, and required artifacts remain accessible.
- Exercise interruption around an external effect. Confirm retries do not silently duplicate consequential actions.
- Exercise an external-input wait across worker loss. Confirm the event reaches the correct suspended task.
- Check the resulting artifact or external state. A recovered run that ends normally does not prove task success.

## Study existing implementations

- [LangGraph durable execution](https://docs.langchain.com/oss/python/langgraph/durable-execution): study checkpoint-based recovery, replay boundaries, and persistence modes. Deep Agents uses LangGraph infrastructure.
- [Pydantic AI with DBOS](https://pydantic.dev/docs/ai/capabilities/durable_execution/dbos/): study database-backed recovery and the required workflow invocation boundary.
- [OpenAI Agents SDK with Temporal](https://docs.temporal.io/develop/python/integrations/openai-agents): study framework integration with durable orchestration and separate execution of external-I/O tools.
- [Cloudflare Agents with Workflows](https://developers.cloudflare.com/agents/concepts/workflows/): study the separation between an interactive agent and durable background work.
- [pi-durable](https://github.com/earendil-works/pi/tree/main/packages/durable): study harness-level recovery and explicit tool replay contracts. Its APIs are experimental.

These examples illustrate different integration choices. Select existing support for the deployment and task, not durability as a universal requirement.
