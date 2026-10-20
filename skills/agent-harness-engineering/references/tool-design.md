# Tool design

## Complete meaningful operations

- Design tools around the agent's job-to-be-done domain, not the implementation behind it.
- Give the agent a simple interface to a useful workflow.
- Encapsulate known mechanical steps inside the tool.
- Do not make the agent drive an internal state machine to accomplish one domain operation.
- Return a useful work product, not merely confirmation that an internal flag changed.
- Keep choices that require the agent's judgment visible.
- A tool can complete one coherent part of a task without completing the entire assignment.
- A small schema is not enough if using it requires implementation knowledge and repeated bookkeeping calls.

Hide implementation complexity. Keep accepted inputs, public behavior, and outcomes explicit.

## Ask for domain knowledge, not internal bookkeeping

- Require arguments that represent information the agent knows or decisions it must make for its task.
- When the harness already knows an identity, do not require the agent to copy it into tool arguments.
- When the harness manages records and their relationships, keep that work inside the implementation.
- Do not make the agent learn internal storage conventions merely to submit its domain work.
- Apply this distinction by responsibility, not by field name.
- An identifier can be appropriate when the agent must choose a resource.
- The same identifier is unnecessary when the runner already knows the resource.

## Keep schemas simple and accepted values explicit

- Use the simplest schema that accurately represents the operation.
- When a parameter accepts a fixed set of values, express those values as an enum.
- Do not advertise an unrestricted string when backend validation accepts only specific strings.
- Express input types, required fields, and accepted values in the agent-visible schema.
- Keep backend validation consistent with the advertised schema.
- Do not compensate for hidden input constraints by teaching implementation details in the agent's prompt.
- Simplify the caller's responsibility, not just the number of fields.

### Example: expose accepted values before the call

Suppose `record_assessment` records whether evidence supports an investigated claim. The agent chooses the outcome and explains its reasoning.

**Poor agent-visible schema:**

```json
{
  "type": "object",
  "properties": {
    "outcome": { "type": "string" },
    "reason": { "type": "string" }
  },
  "required": ["outcome", "reason"],
  "additionalProperties": false
}
```

The backend accepts only `supported`, `unsupported`, or `inconclusive`, but this schema also advertises `confirmed` as valid input.

**Corrected agent-visible schema:**

```json
{
  "type": "object",
  "properties": {
    "outcome": {
      "type": "string",
      "enum": ["supported", "unsupported", "inconclusive"],
      "description": "Whether the evidence supports the claim. Use inconclusive when the evidence cannot settle it."
    },
    "reason": {
      "type": "string",
      "description": "Explain how the evidence supports the chosen outcome, with references to the relevant sources."
    }
  },
  "required": ["outcome", "reason"],
  "additionalProperties": false
}
```

- The enum communicates valid choices before execution. The description explains how to choose among them.
- Backend validation still enforces the contract. It no longer contains a secret part of that contract.
- The reason remains freeform because the agent must explain its evidence, not select from a fixed vocabulary.

## Return useful results without flooding context

Design both what the result communicates and how much enters the agent's context. A large response can be legitimate; its size alone is not a reason to discard it or fail the operation.

### Make the result actionable

- Return the work product and evidence needed for the agent's next decision, not an internal backend dump.
- Keep operation status, partial failures, and important limitations visible separately from the bulk output.
- Preserve provenance so the agent can trace observations to their sources.
- Distinguish exact excerpts from generated summaries. A summary can orient the agent but does not replace source evidence.

### Bound the preview, preserve the response

- When output exceeds the inline budget, save the complete response to an agent-accessible file and return a bounded preview.
- Limit what enters context, not what the tool may legitimately produce. Preserve the full response before truncating its inline representation.
- Select a useful preview: the beginning of a document, the end of command output, or relevant excerpts.
- Clearly label partial output and indicate its coverage where practical, such as displayed lines and total size.
- Include the full-output path and explain how to inspect the rest with available file-reading, search, or processing tools.
- Ensure the file is readable from the agent's execution environment and remains available for follow-up inspection.
- Bound subsequent reads too. Provide range selection or another practical way to inspect the file without loading it all into context.
- Account for huge single-line responses; a line-count limit alone does not bound output size.
- Reuse the harness's output-budget and file-preservation facilities where available rather than inventing unrelated limits for each tool.
- Surface failures to preserve the output. Do not claim the complete response is available when saving it failed.

### Example: a large test run

Suppose a test tool finishes successfully, but one test fails and the run produces a megabyte of diagnostics.

```json
{
  "executionStatus": "completed",
  "testOutcome": "failed",
  "failedTests": ["refund completes after settlement"],
  "diagnostics": {
    "preview": "FAIL refund completes after settlement\nExpected: completed\nReceived: pending",
    "previewComplete": false,
    "fullOutputPath": "/artifacts/test-run-184.log",
    "nextRead": "Search this file for the failed test name, then read the surrounding lines."
  }
}
```

- The tool executed, the tests failed, and the preview is partial. These are three separate facts in the response.
- The agent can investigate immediately without loading every diagnostic into context.
- The tool saves the full output before returning its path. The agent's file tools can access that path.

Dumping the megabyte into context and returning only “three tests failed” are both poor results. The first overwhelms context; the second loses evidence. The useful contract is bounded inline output, complete retained output, and an explicit way to inspect the rest.

## Make recoverable failures actionable

- Return recoverable tool failures to the agent as useful error messages.
- Do not terminate the harness over a correctable tool-use mistake.
- Do not return only `"error"`.
- Explain what went wrong.
- Identify the input or condition that caused the failure.
- Explain what the agent can change or do next, when recovery is possible.
- For an invalid enum value, name the parameter and list its accepted values.
- Do not leave the agent guessing which undocumented value the backend accepts.
- Do not hide a failure or report an unsuccessful operation as successful.

For the `record_assessment` example, a rejected call with `outcome: "confirmed"` can return:

```json
{
  "status": "error",
  "code": "invalid_argument",
  "parameter": "outcome",
  "received": "confirmed",
  "acceptedValues": ["supported", "unsupported", "inconclusive"],
  "message": "Choose the outcome that matches your evidence and resubmit. No assessment was saved."
}
```

The agent can correct the call without guessing values or wondering whether the rejected submission created a record.

## Describe tools for selection and use

A tool description explains:

- What the tool does and what useful result it returns.
- When the agent should use it.
- When the agent should not use it.
- Any important conditions needed to use it correctly.
- For potentially large results, the preview behavior and how to access complete output.

Include a brief example when it resolves a likely misunderstanding. Keep the description consistent with the schema and behavior.

## Domain interface examples

### Web search: a useful workflow behind a small interface

The existing `web_search` interface accepts:

- `objective`: the research goal and relevant context.
- `search_queries`: the keyword queries.
- Optional constraints, such as domain restrictions or a publication cutoff.

It returns source URLs and substantive Markdown evidence that the agent can reason over.

- The agent supplies the research goal and queries. The tool returns evidence for that research.
- Creating requests, polling, and retrieving results are known mechanical steps. Asking the agent to perform them adds no research judgment.
- Deciding whether the evidence answers the question depends on the goal and what the results reveal.
- Keep that decision with the agent, which can refine the search, investigate conflicting evidence, or answer the question.
- Completing more of the workflow inside the tool is useful only when it removes mechanics without taking over task-dependent judgment.

A hypothetical poor interface exposes this mechanical sequence:

```text
create search request
  → configure request
  → start search
  → poll status
  → collect result IDs
  → retrieve results
```

The tool should perform these steps internally and return the evidence. The agent should not coordinate them merely to obtain a search result.

### Finding submission: domain work instead of database records

Suppose a research runner already knows the target and manages its database records.

The poor tool requires:

- Build and service IDs that the runner already knows.
- An internal evidence-strength classification.
- Evidence record IDs that the runner manages.
- An unrestricted `outcome` string, although hidden backend validation accepts only four values.

The agent attempts submission 14 times. Each rejection omits the accepted values.

- The agent spends calls guessing implementation details instead of doing its research.
- The tool exposes bookkeeping and hides part of its input contract.
- The error messages do not help the agent correct its calls.

For this scenario, the corrected interface asks the agent for:

- A finding title.
- A technical report.
- Exact code locations.

The runner handles:

- The known target identity.
- Citations and their records.
- Review state.

An agent-visible input schema for this corrected `submit_finding` tool:

```json
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "description": "Name the finding." },
    "report": { "type": "string", "description": "Explain the finding and its supporting evidence." },
    "locations": {
      "type": "array",
      "description": "Code locations supporting the finding, relative to the target repository.",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "startLine": { "type": "integer", "minimum": 1, "description": "First line, counted from 1." },
          "endLine": { "type": "integer", "minimum": 1, "description": "Last line, inclusive, at or after startLine." }
        },
        "required": ["path", "startLine", "endLine"],
        "additionalProperties": false
      }
    }
  },
  "required": ["title", "report", "locations"],
  "additionalProperties": false
}
```

The backend checks location ranges against the target source. The agent supplies source locations, not database citation IDs.

The responsibilities determine which inputs belong in the contract:

- The runner supplies the known target identity. Copying it through model output adds no decision and introduces another opportunity for error.
- The agent supplies exact code locations as evidence. The runner creates citation records and links them to the finding.
- The runner manages review state because submitting research does not require the agent to manage the review workflow.
- If the task requires the agent to classify a finding, retain that input and explain its meaning and accepted values.
- Hidden accepted values are a schema defect. Expose them rather than removing a useful input or making the agent guess.

A smaller schema helps when it removes unnecessary caller responsibility. Renaming bookkeeping fields or hiding them in a report does not fix the boundary.
