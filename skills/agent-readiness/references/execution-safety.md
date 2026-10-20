# Preparation for isolated, authorized, recoverable work

Apply this guide when intended delegation involves shared resources, parallel workers, credentials, persisted mutations, delivery, or operations. It establishes safeguards; it does not authorize exercising destructive operations on real systems.

## Inspect boundaries

- Identify resources reachable from ordinary development commands: files, services, credentials, accounts, and remote environments.
- Determine which operations mutate state, deliver notifications, publish artifacts, or incur material costs.
- Inspect whether development credentials and defaults permit unrelated destructive operations.
- Identify shared state between worktrees or workers: caches, ports, databases, output directories, and processes.
- For intended state-changing jobs, identify partial-failure behavior, retry semantics, and recovery assumptions.

A warning in documentation is not an enforced permission boundary. A separate worktree does not isolate a shared database or user cache. A backup file does not prove restoration works.

## Remediate after approval

- Provide safe development defaults and explicit selection of consequential environments.
- Separate credentials and permissions according to the intended work. Do not broaden access just to complete an assessment.
- Make test resources independently addressable and cleanable without touching unrelated work.
- Establish lifecycle commands for services and fixtures where needed; handle interrupted runs and owned-resource cleanup.
- Provide controlled rehearsal environments for approved migration, retry, or recovery verification.
- Document which operations require human approval and how to obtain it through existing project processes.
- Establish integration safeguards and appropriate scrutiny for changes to those safeguards; use the [automation guide](setup-and-automation.md).

Do not build a distributed coordination system merely because agents may work in parallel. Use existing workspace, service, and access-control facilities that solve demonstrated interference.

## Concrete implementation paths

- **Shared test state:** adapt the existing fixture setup to allocate a resource namespace per run/workspace, pass that identity through normal configuration, and clean up only owned resources. Verify overlapping runs and unrelated-state preservation.
- **Unsafe environment defaults:** make ordinary development select disposable resources; require explicit configuration for consequential targets. Establish separate credentials through the project's actual access-control facility.
- **Unrehearsed recovery:** create representative disposable state, a controlled interruption mechanism, and a restore/retry command using existing project operations. Assert recovered data and progress, not just command success.

Agree required service/access changes before implementation. Deliver configuration or executable facilities plus concise instructions; warnings alone do not establish isolation or recovery.

## Verify preparation

- In an isolated environment, run relevant workflows concurrently when parallel work is intended; inspect resource interference and results.
- Verify cleanup affects only owned resources and preserves unrelated work.
- Inspect actual credential/rule boundaries where access permits; report unavailable remote evidence as unknown.
- Rehearse relevant interruption or recovery paths with disposable state and confirm the intended outcome.
- Establish rollback compatibility with stored state where applicable, not just the existence of a code rollback command.

Verification itself must respect the user's approved scope. If a safe rehearsal cannot be established, report the missing preparation instead of testing on production.
