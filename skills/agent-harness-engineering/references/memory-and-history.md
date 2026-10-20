# Memory and history

Treat working context, retained history, and durable memory as separate design choices. Add recovery access only when the task needs it.

## Separate context reduction, retention, and recovery access

| Decision | Purpose |
| --- | --- |
| [Compaction](compaction.md) | Summarize accumulated conversation context while preserving what the agent needs to continue. |
| History retention | Store the original interaction for purposes such as debugging and observability. |
| Agent recovery access | Let the agent retrieve omitted information from retained history when that access suits the task. |

- Choose retention and recovery access according to the project's requirements. Neither follows automatically from choosing compaction.
- Retaining a transcript for debugging does not require exposing it to the agent.
- Searchable history can help a coding agent recover omitted details. Other designs may expose only task artifacts or structured state.
- When history recovery is supported, provide an explicit retrieval path; stored material is not automatically accessible context.
- Do not depend on later transcript recovery when the application does not retain or expose that transcript.

## Study optional long-term recall designs

- Add long-term recall only when tasks need information beyond the current working context.
- Choose designs by required information, recall fidelity, and access method—not by storage technology alone.
- Combine patterns where needed; one implementation can illustrate several patterns.

### Retrieve durable knowledge across tasks

- [Mem0: how memory works](https://docs.mem0.ai/core-concepts/how-it-works): study extraction, retrieval, and application-controlled selection of memories for context.
- [Mnemopi](https://github.com/can1357/oh-my-pi/tree/main/packages/mnemopi): study a local memory engine with remember, recall, and consolidation workflows.
- [Graphiti / Zep](https://github.com/getzep/graphiti): study entities, relationships, source provenance, and temporal validity when facts change.
- [Hindsight: main operations](https://hindsight.vectorize.io/developer/api/main-methods): study the separation between retaining information, retrieving evidence, and reasoning over evidence.
- [LangGraph-backed long-term memory](https://docs.langchain.com/oss/python/langchain/long-term-memory): study namespaced storage primitives that leave capture and update policies to the application.

### Separate always-present knowledge from retrieved knowledge

- [Letta: memory blocks](https://docs.letta.com/v1-sdk/memory/memory-blocks) and [archival memory](https://docs.letta.com/v1-sdk/memory/archival-memory): compare continuously visible knowledge with material retrieved on demand.

### Maintain organized knowledge documents

- [Letta: filesystem memory](https://docs.letta.com/letta-agent/memory): study always-loaded documents and a navigable tree of deeper material.
- [OMP: local-memory pipeline](https://github.com/can1357/oh-my-pi/blob/main/docs/memory.md): study session extraction, consolidation, and a compact overview of file-backed knowledge.

### Recover original history on demand

- [OMP: history interface](https://github.com/xpcmdshell/oh-my-pi/blob/8cd6f8c619e89e935b6c6c5c91f6a4d20f6d7a75/packages/coding-agent/src/internal-urls/history-protocol.ts): study explicit transcript access, including the experimental full active-branch history route.
- Recovery fidelity depends on what the harness actually retains; transcript access cannot recover discarded output.

### Navigate history at multiple resolutions

- [OptMem](https://github.com/VictorTaelin/OptMem): study hierarchical summaries over recorded notes, progressive expansion, and rebuilding derived summaries.
- [Taelin's personal-assistant guide](https://gist.github.com/VictorTaelin/91837951a5ce5b38f341ec1ba1df6449): study hierarchical conversation views, background summarization, and cache-aware batching.
- Distinguish recorded notes from conversation records; each design can recover only its retained source material.
