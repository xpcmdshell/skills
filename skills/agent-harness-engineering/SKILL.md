---
name: agent-harness-engineering
description: "Build, extend, and improve AI agents and their harnesses. Use when creating an agent, choosing an agent SDK or model provider, or adding or changing tools, prompts, skills, context management, memory, subagents, or execution and recovery behavior. Covers standalone agent applications and plugins or extensions to existing coding-agent harnesses."
---

# Agent harness engineering

**Design from the receiving agent's perspective.** It can act only on the context and capabilities it actually receives—not the developer's understanding of the system. Shape the design around its job and desired outcome, whether adding one tool to an existing harness or building a new agent application.

Tools, prompts, skills, and subagent coordination are parts of that same design. Their contracts must agree: instructions cannot rely on context the agent never receives or capabilities the harness does not provide.

For new agents, establish real model access and prefer a suitable existing harness. Build a custom harness when requirements exceed existing options and their extension points.

Read the references that match the work before designing or making changes. Load multiple references when needed, not the whole collection by default.

| When working on | Read |
| --- | --- |
| New agents: framework selection, model providers, gateways, and real integration | [Choose an agent stack](references/choosing-an-agent-stack.md) |
| Individual tools: contracts, schemas, descriptions, results, and errors | [Tool design](references/tool-design.md) |
| Programmatic tool calling: batching, loops, structured results, and reusable implementations | [Code mode](references/code-mode.md) |
| Large tool catalogs: on-demand discovery, intent matching, and schema loading | [Tool discovery](references/tool-discovery.md) |
| System prompts, task instructions, and subagent briefs | [Prompt writing](references/prompt-writing.md) |
| Skills: authoring, expertise transfer, and reference organization | [Writing skills](references/writing-skills.md) |
| Subagents: work breakdown, delegation, communication, and lifecycle management | [Subagent architectures](references/subagent-architectures.md) |
| Prompt caching: stable prefixes, invalidation, diagnostics, and optional warming | [Prompt caching](references/prompt-caching.md) |
| Compaction: continuation checkpoints, coherent history, and transition failures | [Compaction](references/compaction.md) |
| Durable execution: worker loss, long waits, and recovery through existing frameworks | [Durable execution](references/durable-execution.md) |
| Optional long-term recall: retention, history recovery, and memory design references | [Memory and history](references/memory-and-history.md) |
