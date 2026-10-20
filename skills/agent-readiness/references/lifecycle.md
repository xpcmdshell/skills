# Preparation needs across the lifecycle

This map selects repository improvements. It is not instructions to perform the future jobs. A release-readiness assessment does not authorize publishing; a migration-readiness assessment does not authorize migrating real data.

Establish what work the user wants agents to handle and where responsibility stops: implementation, integration, delivery, or operation. Infer from context and confirm consequential uncertainty. Do not require every lifecycle stage for every repository.

| Intended delegated work | Preparation to inspect or establish | Failure the preparation addresses |
| --- | --- | --- |
| Find, record, assign, and resume work | Authoritative tracker, agent access, task conventions, dependencies, ownership, completion evidence | Lost work, duplicate tasks, conflicting ownership, unsupported claims of completion |
| Understand requests and scope features | Product purpose, vocabulary, authoritative requirements, concrete acceptance outcomes | Plausible implementation of the wrong request |
| Design changes | Architectural rationale, constraints, responsibility boundaries, known contracts | Local improvements that erode the overall design |
| Bootstrap a project | Supported environment, approved tools, repeatable setup, minimal real development loop | Elaborate scaffolding without a working product path |
| Implement features and integrations | Deep public APIs, representative data, readable-code standards, integration seams | Duplicated behavior, adapter-owned logic, happy-path-only implementation |
| Verify changes | Confirmed journeys, independent expectations, real implementation tests, inspectable results | Self-confirming tests or mocks that bypass the risky behavior |
| Debug failures | Reproduction fixtures, observable runtime state, diagnostic instructions | Symptom-driven guesses and error suppression |
| Refactor or upgrade dependencies | Consumer discovery, supported environments, compatibility policy, contract checks | Broken consumers or unsolicited compatibility machinery |
| Evolve schemas or persisted formats | Ownership, migration policy, realistic state fixtures, interruption and recovery checks | Corruption or unusable partially transformed state |
| Work concurrently and integrate | Isolated workspaces/resources, clear task boundaries, trusted validation | Clobbered work, shared-state interference, semantic merge failures |
| Package, publish, or deploy | Repeatable release automation, artifact provenance, appropriate credentials, delivered-result checks | Wrong artifacts, leaked credentials, false success |
| Operate or recover systems | Safe access boundaries, operational diagnostics, rehearsable recovery procedures | Irreversible actions or incompatible rollback state |
| Retire features and resources | Discoverable consumers/ownership, usage evidence where available, cleanup and retention procedures | Deleting used contracts or abandoning resources and credentials |

## Greenfield route

- Establish intended users, a meaningful first journey, supported environment, and architectural direction with the user.
- Propose the smallest real implementation slice that can establish setup, public boundaries, automated verification, and diagnostics.
- Readiness work may establish scaffolding and approved verification infrastructure. It does not silently take over product feature development.
- If verifying preparation requires new product behavior, propose that dependency explicitly and agree its scope.
- Separate undecided requirements from absent implementations. An undecided requirement is unknown; an agreed required capability that is absent is missing, even in greenfield work.
- Treat future out-of-scope capabilities as planned or excluded, not readiness failures.
- Local validation and CI can support feature development without releases. Assess them against the intended collaboration and integration workflow; do not exclude CI merely because publishing is out of scope.
- Do not require deployment systems, tracing, databases, or compatibility policies without relevant intended work.

## Brownfield route

- Discover actual consumers, commands, data flows, and useful existing tests before proposing replacements.
- Compare maintained intent and promised contracts with actual behavior. Surface contradictions.
- Find implicit knowledge and brittle operations that block the desired delegation.
- Propose incremental preparation improvements that preserve useful behavior and infrastructure.
- Do not use a readiness assessment as authorization for a broad rewrite.

## Selecting guidance

- Consumer or compatibility questions require the [contracts guide](contracts-and-change-impact.md).
- Permissions, shared state, migrations, and recovery require the [execution-safety guide](execution-safety.md).
- Work discovery, ownership, and handoff preparation require the [work-coordination guide](work-coordination.md).
- Use the area guides from the entry file to implement the resulting preparation improvements.

A future job can require several areas. One fixture system, public boundary, or validation command can support several jobs. Prefer coherent shared capabilities over one tool or document per table row.
