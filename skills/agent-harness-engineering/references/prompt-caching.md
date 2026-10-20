# Prompt caching

## Preserve cache reuse as a design requirement

Tokens cost money. Prices generally increase from cached input to uncached input to output. Each turn processes the active conversation context again, not only the newest message. Losing cache reuse can therefore rebill a large existing prefix at uncached rates on every turn.

Cached prefixes also avoid much of the cold-prefill work. Cache preservation affects time to first token, overall task latency, and operating cost. Treat it as a harness design requirement, not a late optimization.

### Construct stable prefixes

Prefix caches reuse matching input, subject to the provider's block boundaries and eligibility rules. Changing an early token can make the entire subsequent region ineligible for reuse, even if that later content is unchanged.

- Keep reusable system instructions, tool definitions, and existing messages stable unless their meaning needs to change.
- Keep ordering and serialization deterministic so equivalent content does not become a different prefix.
- Place changing task information later where the provider's request structure and instruction semantics permit it.
- Avoid rewriting early context blocks on every turn to insert timestamps, progress counters, or other changing state.
- Preserve correctness and instruction priority when a change is necessary. Do not retain stale information just to obtain a hit.
- Check the provider and framework's actual cache rules, including eligibility, expiry, routing, and any explicit cache controls.

### Example: a changing timestamp

Suppose a harness inserts the current time before otherwise stable instructions and conversation history on every request.

**Poor request construction, shown in prefix order:**

```text
Request 1                         Request 2
system: Current time 10:00         system: Current time 10:01  <- first change
        Stable instructions               Stable instructions
tools:  Tool definitions           tools:  Same definitions
history: Existing messages         history: Same messages
                                           New exchange
```

The early timestamp changes the prefix before the reusable instructions, definitions, and history.

**When time matters, append a timestamped observation without rewriting earlier content:**

```text
Request 1                         Request 2
system: Stable instructions       system: Same instructions
tools:  Tool definitions           tools:  Same definitions
history: Existing messages         history: Same messages
         Time observation: 10:00            Time observation: 10:00
                                           Assistant response
                                           Time observation: 10:01
                                           New task input
```

- The second request preserves the earlier prefix, including the old observation as part of the conversation history.
- The latest observation supplies current time. It does not revise the earlier message in place.
- Keep instructions at their required priority. Place runtime observations where the provider supports that task context.
- Remove time entirely when the task does not need it. Confirm eligible-prefix reuse using provider cache telemetry.

### Account for deliberate invalidation

- Treat compaction as a cache-affecting event when it replaces an early portion of the context.
- Recognize first-time cache population, intentional prefix changes, and accepted expiry as expected cold work.
- Evaluate context reduction alongside its effect on cache reuse; fewer input tokens alone do not establish lower cost or latency.
- Do not avoid necessary compaction merely to preserve a cache hit.
- When changing summarization or retained history to improve cache reuse, follow [compaction guidance](compaction.md) to preserve correct continuation.

### Diagnose unexpected misses

Treat unexplained or avoidable loss of cache reuse as a harness bug until explained. A cold request is acceptable when it follows an explicit design decision or understood provider behavior.

- Instrument requests with provider-reported cached input, uncached input, and cache-write usage where available.
- Record latency and cost alongside cache usage so the operational effect is visible.
- Correlate misses with prefix changes, compaction, model or routing changes, and elapsed idle time.
- Preserve enough request identity and context-change information to locate the invalidation without assuming a hit from prompt similarity.
- Investigate repeated cold processing during an otherwise stable active conversation.
- Distinguish unavailable cache telemetry from a measured zero-hit result.

### Choose cache warming explicitly

Cache-aware context construction is baseline guidance. Cache warming is optional project policy.

- Decide whether warming is worthwhile from provider behavior, expected idle periods, latency needs, and cost.
- If warming is chosen, reuse the relevant prefix before expiry with minimal additional input and output.
- A standalone tiny request does not warm a conversation unless it reaches that conversation's relevant cached prefix.
- Confirm that the provider refreshes the cache as expected; do not assume a universal expiry or refresh mechanism.
- Account for cached reads and any new input, output, or cache-write charges.
- Compare warming cost with the expected cost and latency of a cold restart.
- Intentionally allowing idle caches to expire is valid. Do not add periodic warming as an automatic default.

## Verify cache behavior

- Exercise consecutive turns with an unchanged eligible prefix and inspect actual cache usage.
- Change late task data and confirm that earlier eligible material remains reusable under the provider's rules.
- Check that intended early changes and compaction produce explainable cache behavior rather than silent repeated misses.
- If warming is enabled, test the provider's idle-refresh behavior and account for the warming requests' costs.
