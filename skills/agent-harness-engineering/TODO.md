# Agent harness engineering skill backlog

Develop each area collaboratively before writing its guidance. Extend the existing skill with focused references, not separate top-level skills.

## Existing first drafts

- [x] Tool design.
- [x] Prompt writing.
- [x] Writing skills.
- [x] Subagent architectures.
- [x] Entry file and reference routing.
- [x] Agent-stack resources: framework languages, notable capabilities, model choice, inference providers, hosting, and subscription access.
  - Retain real integration and custom-harness guidance; remove unsolicited adoption policies and checklists.
  - Official documentation informs the shortlist; live provider integrations and fresh-context behavior remain untested.
  - Named model examples are domain-specific leads, not verified vulnerability-discovery price-performance comparisons.

## Next areas

- [ ] **Extend prompt writing: storage, versioning, and templating.**
  - Keep prompts in standalone files tracked in Git, rather than large heredoc-style strings embedded in application code.
  - Load and parameterize prompt files through the project's templating mechanism.
  - Prefer the framework's prompt templating support when available; otherwise use the language's standard or established community templating solution.

- [x] **Extend tool design: agent-facing results.**
  - Return useful evidence and outcomes rather than raw internal dumps.
  - Select and structure output for the agent's next decision.
  - Preserve provenance and access to supporting detail without flooding context.
  - Bound inline previews, preserve complete large responses in accessible files, and support bounded follow-up inspection.

- [x] **Extend tool design: code mode and tool search.**
  - Explain programmatic tool calling with dataset fan-out and structured result inspection.
  - Separate on-demand tool discovery from scriptable execution.
  - Include optional intent-based vector indexing and hybrid retrieval.
  - Link public pi references for code mode, tool search, and exposure.
  - Include existing framework support, reusable libraries, MCP adapters, and managed PTC options.
  - Distinguish documented interfaces from untested behavior and note integration-specific limits.

- [ ] **Context engineering and memory.**
  - Select, assemble, and retrieve task-relevant context.
  - [x] Draft compaction and continuation principles in `references/compaction.md`.
  - [x] Separate compaction, history retention, and optional agent recovery access.
  - [x] Draft cache economics, stable-prefix construction, miss diagnostics, and compaction effects in `references/prompt-caching.md`.
  - [x] Present cache warming as an optional project policy, not a default.
  - [x] Add concept-grouped public study references in `references/memory-and-history.md`.
  - [ ] Write the discussed conceptual comparison of memory patterns, their tradeoffs, and when to choose them.
  - Distinguish working context, persistent memory, and source artifacts.
  - Address retrieval relevance and provenance; link to tool-result guidance rather than duplicate it.

- [ ] **Execution, state, and recovery.**
  - Choose deterministic workflows versus model-directed next actions.
  - Distinguish invalid calls, retryable failures, blocked work, and completion.
  - Handle retries, duplicate external effects, interruption, cancellation, and cleanup.
  - [x] Draft durable-execution basics in `references/durable-execution.md`: worker loss, recovery boundaries, activation, and integration contracts.
  - [x] Add focused study references for existing framework integrations, including pi-durable and LangGraph.
  - [ ] Validate recovery behavior through representative worker-loss trials; current coverage is documentation-based.
  - Distinguish agent idleness or a completion claim from satisfied requirements.
  - Cover workflows that validate submitted artifacts when the agent goes idle before accepting completion.

- [ ] **Evaluations, debugging, introspection, and telemetry.**
  - Define representative end-to-end tasks and concrete success criteria.
  - Distinguish verifiable outcomes or rewards from subjective quality judgments.
  - Cover evaluation pitfalls, including limitations of LLM-as-judge assessments.
  - Diagnose model limitations separately from context, tool, and harness defects.
  - Record useful traces, artifacts, and resulting state.
  - Cover cache-hit/miss telemetry and attribution, building on `references/prompt-caching.md`.
  - Cover transcript retention for debugging separately from agent access to historical context.
  - Introduce OpenTelemetry and explain what instrumentation helps answer operational and evaluation questions.

- [ ] **Permissions and trust boundaries.**
  - Cover scoped credentials, isolated execution, and untrusted content.
  - Define approval boundaries and delegated permissions.
  - Distinguish prompt instructions from enforced authorization.

- [ ] **Human interaction and control.**
  - Present meaningful progress, outcomes, blockers, and decisions instead of streaming raw machinery.
  - Turn agent activity into a concise, understandable user experience, with supporting detail available when needed.
  - Ask for decisions that require human judgment rather than outsourcing observable facts.
  - Support correction, interruption, and cancellation during work.
  - Deliver useful artifacts and make partial results and uncertainty clear.

## Package follow-through

- [x] Split mixed tool and context references by task, with direct routes from `SKILL.md` to nine references.
- [ ] Add reference routing as each new area is drafted.
- [ ] Review overlaps and keep each topic's detailed guidance in one place.
- [ ] Run representative fresh-context trials; current drafts have not had behavioral validation.
- Source research establishes documented interfaces, not independently verified security, performance, or end-to-end behavior.
- The organization refactor checks content preservation and navigation, not agent behavior.
