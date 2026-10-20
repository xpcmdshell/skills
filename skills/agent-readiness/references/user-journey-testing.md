# Automated user-journey coverage

## Working model

A journey connects user intent to meaningful observable outcomes. Tests exercise real application behavior through supported public module APIs. They run automatically in the normal suite.

The runner does not determine test scope. A pytest or Go test can exercise a complete journey. Spawning the application or passing through framework dispatch is not required. Do not replace missing architectural boundaries with subprocess-based tests.

## Build the matrix

For every confirmed core journey, record:

| Field | Evidence required |
| --- | --- |
| Intent | What the consumer wants to accomplish |
| Outcome | Results and important failure/recovery guarantees |
| Entry seam | Public API actually called by the test |
| Real implementation | Components exercised behind the API |
| Substitutions | Replaced external dependencies and what remains unproven |
| Assertions | How the test establishes the outcome |
| Execution | Test location, normal command, result, environment |

Use existing tests before proposing new ones. Read bodies and helpers; names and coverage percentages do not prove journeys.

## Choose the seam

- Prefer the application's public capability interface beneath framework adapters.
- Let consumers compose supported operations when those operations express domain choices.
- Do not reconstruct internal workflows in test code.
- If a capability is available only inside framework callbacks, report an architectural gap separately. Preserve existing useful coverage.
- When the required outcome is itself interface behavior, exercise that interface. A browser interaction requires UI evidence; backend behavior alone cannot establish it.
- Keep adapter-specific coverage focused on meaningful project-owned behavior. Do not duplicate journeys to retest framework mechanics.

## Use real behavior

- Use real parsing, transformations, storage, and other components that establish the claimed outcome.
- Use temporary storage and controlled fixtures to avoid real user data.
- Substitute external services at their boundary where appropriate. Record fidelity limits.
- A fixture HTTP server returning documents permits testing the real download and extraction path.
- A mocked extractor returning final records cannot establish extraction correctness.
- A fake database cannot establish the production database's transaction or query semantics.

For network protocols, file formats, and integrations, use authoritative or independently produced fixtures where needed. A round trip through two implementations sharing the same mistake can pass; do not claim interoperability without independent evidence.

## Environment and delivery claims

Associate execution evidence with the environment actually tested. Host tests do not establish behavior on every supported target. Use the [contract guide](contracts-and-change-impact.md) when supported environments or independent expected results are unclear.

Packaging and deployment have distinct outcomes when those jobs are intended. A consumer import check or artifact-identity check can establish delivery behavior without moving ordinary feature journeys away from public APIs. Inspect those preparation needs through [setup and automation](setup-and-automation.md).

## Implement missing coverage

1. Choose an uncovered core outcome with meaningful risk, not an easy case that increases test count.
2. Write the integration/journey test before implementing the required behavior.
3. Invoke the supported public interface with realistic inputs and real internal implementation.
4. Assert externally meaningful results: persisted data, correct selected output, recovered progress, or explicit failure.
5. Include important failure/recovery sequences according to the product's contract.
6. Make the test executable through the existing suite and CI, without manual driving each time.

Write few high-value integration and journey tests. Do not add unit-test inventories, tautological assertions, implementation-change detectors, or one test per private helper. A bug report does not automatically justify another narrowly tailored regression test; improve relevant journey coverage when its contract lacks evidence.

### Concrete deliverables

For each approved missing journey, deliver a test in the existing integration suite, reusable realistic fixtures, public-API invocation, meaningful outcome assertions, and its normal execution command. Wire it into existing validation rather than requiring manual agent driving. Inspect the actual runner configuration to ensure the test is discovered.

If the public capability does not exist independently of an adapter, propose the architectural change explicitly using the [architecture implementation path](architecture.md). Do not silently refactor the application or build a subprocess harness to avoid that decision.

## Verify and report

- Execute tests, inspect results, and report skips or environmental blockers.
- Confirm assertions distinguish wrong outcomes, not merely no exception or a nonempty object.
- Check isolation and repeatability where mutable state or order dependence matters.
- State uncovered outcomes explicitly. Do not demand coverage of every hypothetical edge case.
- Do not declare tests inadequate solely because they run in-process.

See [contrasting API and test examples](../examples/public-api-journeys.md) for operation-oriented, stateful, and composable designs.
