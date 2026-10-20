# Tool discovery

- Large tool catalogs consume context through schemas and descriptions, even when most tools are irrelevant.
- Too many choices can also confuse less capable models.
- Start with a small set of frequently needed tools and a discovery tool such as `search_tools`.
- Keep available capability areas and reasons to search them visible in the initial context, while deferring detailed tool contracts.
- Let it search in natural language and obtain relevant descriptions, callable schemas, and usage guidance.
- Some designs return schemas immediately; others separate discovery from detailed contract inspection.
- Resolve the actual contract before calling a tool; do not make the agent guess names or arguments.
- Keep direct declarations for small, stable toolsets where discovery adds more friction than value.
- Choose by context cost and task needs, not a universal tool-count threshold.

### Example: discover a service-ownership tool

Suppose a harness declares `search_tools` initially and registers discovered tools for subsequent model calls.

**Initial capability guidance:**

```text
Service ownership records are available through tool search.
When you need the team responsible for a service, use search_tools to find
its lookup tool and obtain the current call schema.
```

**Task and discovery call:**

```text
User: Which team owns payments-api?
Agent: search_tools({"query": "look up the team responsible for a service"})
```

**Search result, also registered as a callable tool declaration:**

```json
{
  "name": "get_service_ownership",
  "description": "Return the owning team for a service from the service catalog.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "serviceName": {
        "type": "string",
        "description": "Exact service name, such as payments-api."
      }
    },
    "required": ["serviceName"],
    "additionalProperties": false
  }
}
```

**Next call and result:**

```text
Agent: get_service_ownership({"serviceName": "payments-api"})
Tool: {"serviceName": "payments-api", "owningTeam": "Payments Platform"}
```

- The agent knows ownership lookup exists before it knows the tool name or parameter spelling.
- The search result supplies the contract. The harness registration makes the discovered tool callable on the next turn.
- Hiding detailed schemas reduces initial context. Hiding all awareness of the capability removes the reason to search.

## Match tools by intent

- Consider a lightweight, in-memory vector index over tool names and descriptions.
- Embed natural-language queries to retrieve tools by semantic similarity, not only keyword overlap.
- For example, “Who is responsible for this service?” could discover `get_service_ownership` without matching its exact terminology.
- Keep descriptions clear about purpose and intended use; embeddings cannot compensate for poor descriptions.
- Consider hybrid retrieval to preserve exact tool-name matches alongside semantic matches.
- Refresh the index when tools change, and resolve current schemas and usage guidance from the tool registry.
- Treat vector search as an option; lexical search can suffice when descriptions match the agent's task language.

## Keep discovery separate from execution

- Tool search scales the capability catalog; code mode scales coordination across operations and datasets.
- Either can work alone; discovery can lead to direct calls or scriptable bindings.
- Distinguish no search matches from disconnected services or denied access.
- Do not treat a tool's absence from the prompt as an authorization boundary.
- Define whether discovered tools remain declared after later turns, resume, or branching.
- Account for declaration changes using [cache-aware context guidance](prompt-caching.md#construct-stable-prefixes).

When composing discovered tools through scripts, read [code-mode guidance](code-mode.md) for orchestration and execution behavior.

## Study the designs

- [Pi: tool search](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli.md#tool-search): study discovery that loads declarations for subsequent model calls.
- [Pi: tool exposure](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md#control-tool-exposure): compare direct declarations, deferred discovery, and script access.
- [FastMCP: discovery tools](https://gofastmcp.com/servers/transforms/code-mode#discovery-tools): study staged search and schema inspection.
- Pi and FastMCP document lexical ranking; the vector-index option above is a separate design choice.
