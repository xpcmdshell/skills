# Code mode / programmatic tool calling

- Traditional tool calling lets the agent request one tool or a batch of tools per model turn.
- This is sufficient for simple tasks.
- Code mode, also called programmatic tool calling (PTC), gives the agent scriptable bindings to its tools.
- Scripts can loop over datasets, run independent calls concurrently, chain dependent calls, and inspect structured results.
- Intermediate data can stay in the runtime instead of entering the model's context.
- Return the evidence needed for the next decision, rather than every intermediate response.
- Use code for coordination the agent can already specify; return to the model when the next step requires judgment.

## Example: inspect a dataset of test runs

- Goal: identify failing tests across recent runs.
- Ordinary calling can batch report requests, but the model still receives intermediate records and full reports.

```text
Model: list recent runs
  → tool returns run records
Model: request reports for those runs
  → tools return full reports
Model: inspect reports and identify failures
```

- Code mode combines collection and structured result inspection into one invocation.
- The following bindings are illustrative, not built-in tools.
- The listing returns the selected dataset; paginated APIs require completing pagination before claiming full coverage.

```js
// Structured tool outputs:
// list_test_runs → { runs: [{ id }] }
// get_test_report → { status: "passed" | "failed", failures: [...] }
// Tool execution failures reject.

const { runs } = await tools.list_test_runs({
  branch: "main",
  since: "2026-09-01",
});

const results = await Promise.allSettled(
  runs.map((run) => tools.get_test_report({ runId: run.id })),
);

const failedRuns = [];
const retrievalErrors = [];

for (const [index, result] of results.entries()) {
  const runId = runs[index].id;

  if (result.status === "rejected") {
    retrievalErrors.push({ runId, error: String(result.reason) });
    continue;
  }

  const report = result.value;

  if (report.status === "failed") {
    failedRuns.push({ runId, failures: report.failures });
  }
}

text({
  runsExamined: runs.length - retrievalErrors.length,
  failedRuns,
  retrievalErrors,
});
```

- The same script handles more records without making the model enumerate calls or copy identifiers.
- Retrieval failures remain visible; missing reports do not count as passing tests.
- Structured outputs let scripts inspect results without fragile parsing of human-oriented text.
- Follow each tool's failure contract; some tools return error fields instead of rejecting calls.
- Respect service concurrency and rate limits when executing large fan-outs.
- Apply [bounded-result guidance](tool-design.md#return-useful-results-without-flooding-context) when the collected findings themselves become large.
- Preserve normal permission checks and tracing for calls made through scripts.
- Define partial-execution behavior; a script failure does not undo earlier external effects.

When the tool catalog needs on-demand discovery, read [tool-discovery guidance](tool-discovery.md) before designing that interface.

## Reuse existing code-mode support

- Check the current framework or harness before building a script runtime and tool bridge.
- Several established frameworks ship code-mode support, sometimes through optional packages rather than default configuration.
- A shell or code sandbox alone is not PTC; generated code must also reach the intended tools through callable bindings.
- Use the references below to study, import, or adapt implementations that fit the existing application.
- Verify nested-call permissions, cancellation, errors, and tracing instead of assuming they match direct calls.

### Framework and harness integrations

| Reference | Reusable feature and study purpose |
| --- | --- |
| [Pi: code mode](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/codemode.md) | Built-in JavaScript orchestration through QuickJS. Study tool bindings, structured results, discovery, and partial-execution behavior. |
| [Deep Agents: Python integration](https://docs.langchain.com/oss/python/deepagents/interpreters) and [JavaScript integration](https://docs.langchain.com/oss/javascript/deepagents/interpreters) | QuickJS middleware exposes selected tools as `tools.*`. Study explicit tool selection and interpreter-state lifetime. |
| [Pydantic AI: CodeMode](https://pydantic.dev/docs/ai/harness/code-mode) | `pydantic_ai_harness.CodeMode` wraps selected tools in a Monty-backed Python runtime. Study typed bindings and nested-call observability. |
| [Hugging Face smolagents](https://huggingface.co/docs/smolagents/index) | `CodeAgent` expresses actions as Python calls to registered tools. Study a code-first agent loop rather than an added orchestration tool. |

- Deep Agents uses `langchain_quickjs.CodeInterpreterMiddleware` in Python and `@langchain/quickjs` in JavaScript; both execute generated JavaScript.
- Deep Agents marks interpreters as beta and currently documents that PTC calls do not enforce per-tool `interrupt_on`/`interruptOn` approvals.
- Pydantic AI uses Monty's Python subset; do not assume unrestricted CPython or arbitrary package imports.
- For smolagents, review [executor choices and isolation](https://huggingface.co/docs/smolagents/en/tutorials/secure_code_execution) separately from the code-first agent design.

### Importable libraries and MCP adapters

| Reference | Reusable feature and study purpose |
| --- | --- |
| [Cloudflare: `@cloudflare/codemode`](https://github.com/cloudflare/agents/tree/main/packages/codemode) | Converts tools into typed JavaScript bindings. Study `createCodeTool`, tool providers, and the executor interface. |
| [FastMCP: CodeMode transform](https://gofastmcp.com/servers/transforms/code-mode) | Wraps existing MCP tools with discovery, schema inspection, and Python execution. Study server-side composition without replacing the agent harness. |

- Cloudflare provides AI SDK and TanStack AI adapters; its `DynamicWorkerExecutor` requires Cloudflare Workers.
- Cloudflare exposes an executor interface for other runtimes; a custom executor still needs an appropriate isolation boundary.
- FastMCP provides the `fastmcp[code-mode]` extra and a Monty-backed transform; its discovery interface is experimental.
- FastMCP also illustrates combining search and execution while keeping their contracts separate.

### Managed execution

- [Anthropic: programmatic tool calling](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling) provides managed Python execution with callbacks to application tools.
- Study the pause-and-resume protocol: the application supplies tool results, and code consumes them without another model generation.
