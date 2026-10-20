# Worked preparation assessment

This fictional example illustrates reasoning and approval boundaries. Its project, findings, and actions are not universal requirements.

## Scenario and supplied evidence

A team maintains a document library and a hosted editing service. It wants agents to implement features and prepare merge-ready changes. Publishing and production operations remain human-owned.

Assume inspection establishes:

- The library exposes open/edit/undo/save operations, with real filesystem integration tests.
- A local validation command executes those tests successfully at the inspected revision.
- CI invokes the same command, but its latest results and branch rules are inaccessible.
- Service tests use one shared development database for all worktrees.
- An architecture guide states module responsibilities and public format promises.
- Installation examples describe a supported runtime range, but validation covers only one runtime.

These are hypothetical observed facts, not instructions to assume these capabilities in another repository.

## Preparation summary

| Intended work | Supported preparation | Gaps / unknowns | Next step |
| --- | --- | --- | --- |
| Library feature changes | Public domain API, real persisted-state tests, successful local validation | Other supported runtimes not verified | Inspect test/environment coverage before proposing expansion |
| Concurrent service changes | Existing validation infrastructure | Shared database can invalidate independent workers' results | Propose isolated test resources |
| Merge-ready changes | CI configuration references working validation | CI execution and remote enforcement unknown | Inspect remote evidence when access is available |

The successful local command supports journey execution and local automation findings. It does not prove CI execution, remote enforcement, or the full runtime range. Reuse its result without rerunning it separately for each report area.

Publishing is outside scope. Do not recommend release infrastructure solely because a library can be published.

## Selected findings

- **F1 — Verified, execution:** persisted edit/undo/save behavior works for the tested runtime and inputs.
- **F2 — Partial, inspection:** test resources are not isolated between workers. Configuration identifies a shared mutable database.
- **F3 — Unknown:** remote integration enforcement cannot be inspected.
- **F4 — Partial:** supported runtime claims exceed obtained verification evidence.

F2 does not prove concurrent corruption has already occurred. It establishes a missing isolation guarantee relevant to intended work. A controlled rehearsal could clarify the failure mechanism without touching real development data.

## Proposals

- **R1 addresses F2:** adapt the existing test setup to allocate and clean up isolated resources. Preserve the existing suite. Verify concurrent runs in disposable environments and inspect unrelated-state preservation.
- **R2 addresses F4:** inspect existing CI/environment coverage first. If genuinely absent, agree which supported environments require verification and extend existing automation.
- **F3 follow-up:** obtain authorized read access or maintainer-provided rule evidence. Do not label protection absent or change rules speculatively.

Recommend R1 first if concurrent development is imminent. Explain any required service permissions before approval. Do not create a new test framework, database service, or report system merely to implement isolation.

## User discussion

Present these proposals with the full report format. Ask which actions to pursue and whether to save a report inside the project or elsewhere.

- User: "Looks accurate." Remain in discussion; ask which actions to implement.
- User: "Save the report at /tmp/readiness.md." Save only that file; do not change the project.
- User: "Implement R1 using isolated databases in the existing test setup." Execute that approved scope. If implementation requires an unapproved shared-service change, discuss it first.

After R1, verify the affected isolation and test-execution claims. Do not rerun the entire assessment or expand into publishing. Update only conclusions supported by new evidence.

## Transferable lesson

Intended work determines preparation needs. Shared evidence supports scoped claims. Proposed changes address demonstrated gaps. Approval controls action. Verification leaves the project better prepared without converting assessment into execution of every future job.
