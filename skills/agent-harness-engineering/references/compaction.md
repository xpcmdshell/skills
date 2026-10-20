# Compaction

Compaction summarizes accumulated conversation context when it approaches the model's context limit. The summary and retained messages must give the agent enough information to continue the task.

## Compact for continuation, not retrospective narration

Treat the summary as a checkpoint for the next decision, not a story about the conversation.

Preserve the information needed to continue:

- The user's current goal, requirements, and constraints.
- Completed, ongoing, and blocked work, including what was actually verified.
- Decisions and the rationale needed to avoid reopening settled questions.
- Next actions and unresolved questions.
- Relevant evidence, limitations, and references needed to inspect supporting artifacts.
- Exact identifiers, paths, and errors when their spelling matters to subsequent work.

Update that checkpoint across repeated compactions. Incorporate new progress, resolve old blockers, and remove superseded information without losing still-applicable constraints.

### Example: retain the correction and unfinished check

Suppose a coding conversation contains this sequence:

```text
User: Add CSV export to the report page.
Assistant: I'll export the visible page of results.
User: No, export every matching row, not just the current page.
      Keep the active filters. Don't commit the changes.
Tool result: Updated src/reports/export.ts to traverse all result pages.
Assistant tool call: Run the filtered-export integration check.
Tool result: Check could not start: DATABASE_URL is missing.
             Full output saved to /artifacts/export-check.log.
```

**Poor summary:**

```text
Worked on CSV export, discussed pagination, updated code, and ran checks.
```

**Continuation summary:**

```text
Goal: CSV export includes every row matching the active filters.
The user rejected exporting only the visible page. Do not commit changes.
Changed: src/reports/export.ts now traverses all result pages.
Verification: not completed. The integration check could not start because
DATABASE_URL is missing. Output: /artifacts/export-check.log.
Next: establish the test database configuration, rerun the check, and verify
that export includes matching rows beyond page one and excludes other rows.
```

- The correction becomes the current requirement, rather than an unresolved choice about pagination.
- The edit is recorded as completed. The check is recorded as blocked, not passed or failed on export behavior.
- The next agent can continue without reopening the scope or mistaking a test invocation for verification.

## Preserve a coherent continuation

- Retain recent working detail verbatim where it remains useful; summarize older material to reduce its context cost.
- Choose cut points that preserve valid message structure. Keep tool results with the tool calls they answer.
- When a long-running request must be split, preserve its original assignment and earlier progress needed to interpret the retained continuation.
- Keep active system instructions separate from the conversation summary rather than relying on a paraphrase to preserve them.
- Rebuild context consistently from the selected summary, retained messages, and current instructions.
- When continuation depends on retrieving omitted history, use the [history-recovery guidance](memory-and-history.md#separate-context-reduction-retention-and-recovery-access) to establish that access.

## Preserve authoritative records and evidence during summarization

- Keep existing authoritative execution records intact when replacing conversation context with a summary.
- Use those records rather than reconstructing execution state from the summary's prose.
- In the summary, distinguish attempted operations from confirmed results. A recorded tool call does not prove the change succeeded.
- If tool results are shortened before summarization, preserve consequential evidence and recovery pointers in the summarizer's input.
- Taking only the beginning of a result can hide a trailing path or diagnostic from the summarizer.

A compaction checkpoint describes the context for continued reasoning. It does not, by itself, provide [durable execution](durable-execution.md) or define memory for future tasks.

## Integrate compaction with the request lifecycle

- Check context size before the next model request, including new tool results and other injected material.
- Base the decision on the context actually being sent and the active model's limits, not conversation length alone.
- Use applicable provider usage and estimates for newly added material. Recalculate when edits or compaction invalidate earlier measurements.
- Leave room for continued generation instead of waiting for a context-overflow error.
- Treat overflow recovery as a separate execution path rather than the normal compaction trigger.
- Reuse the framework's compaction support when it satisfies the required behavior.
- Replacing early context can invalidate cached prefixes. See [deliberate cache invalidation](prompt-caching.md#account-for-deliberate-invalidation) when assessing compaction's cost and latency.

## Treat failed compaction as a failed transition

- Accept a new checkpoint only after summarization completes successfully.
- Reject output-limit-truncated summaries rather than installing partial text as a valid checkpoint.
- Surface failures and cancellation so the caller can recover without assuming context was successfully reduced.
- Keep diagnostic records of compaction outcomes according to the project's observability and retention policy.

## Verify continuity

- Test continued work after compaction, not merely whether the summary reads well or uses fewer tokens.
- Check that the agent preserves requirements, recognizes completed work, and follows the appropriate next action.
- Exercise repeated compaction and a cut within one long-running request.
- Confirm retained tool-call/result sequences remain valid and referenced artifacts remain accessible where promised.
- If history recovery is supported, test retrieval of a detail omitted from the summary.
- Check that incomplete summarization does not become an accepted checkpoint.
