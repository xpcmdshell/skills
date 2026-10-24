# Repeatable setup and external safeguards

## Inspect

- Identify supported runtimes, dependency sources, native requirements, and service dependencies.
- Find setup, build, run, and validation entry points. Read their implementation before execution.
- Identify ambient assumptions: installed tools, user configuration, cached dependencies, credentials, and persistent data.
- Inspect CI jobs, hook installation, exclusions, and remote integration rules when access permits.

## Establish a usable workflow

- Provide one discoverable setup entry point using existing ecosystem facilities where possible.
- Check prerequisites and report actionable failures. Do not silently switch to an incompatible runtime or partial setup.
- Make repeated setup safe for the intended development environment.
- Use the project's dependency locking or reproducibility facilities where supported.
- Provide straightforward validation commands that run the real checks and propagate failures.
- Isolate test state from user data, including databases, caches, files, and services where present.
- Document required credentials and safe acquisition without committing secrets.

A setup script can coordinate existing tools. It need not reimplement a package manager. Containers are optional; use them when they solve actual dependency or isolation needs.

## Representative development state

Setup must make relevant journeys usable, not merely start an empty application. Inspect seed data, service fixtures, and ways to enter important domain states. After approval, establish reusable fixtures and reset commands where missing. Preserve realistic variation without copying sensitive production data.

For parallel workers, inspect resource isolation using the [execution-safety guide](execution-safety.md). Reuse the same fixtures across development, journey verification, and reproduction where their contracts fit.

## Delivery preparation

When publishing or deployment is intended, inspect existing automation for artifact identity, supported consumer environments, credentials, and post-delivery evidence. Propose missing release checks separately from feature journey tests. Verification can use an isolated consumer or staging environment; it does not require duplicating every journey through a binary.

Preparation verification does not authorize a real release. Use the [execution-safety guide](execution-safety.md) for consequential operations.

## Repository-local agent guidance and enforcement

Inspect the harnesses the team uses and their existing repository instructions, skills, and hooks. Skills and hooks are optional improvements, not readiness requirements. Credit useful existing ones; their absence alone is not a finding.

Suggest a repo-local skill only when repository evidence shows a recurring, non-obvious workflow with consequential project-specific decisions. For example, a common integration task may require coordinating several documented contracts and verification steps. Explain that evidence and what the skill would teach beyond existing guidance. Offer only high-confidence, high-value candidates; suggest none when the benefit is unclear.

Choose the mechanism for a demonstrated need:

| Need | Example recommendation |
| --- | --- |
| Essential conventions for every task | Keep concise repository instructions with links to deeper guidance |
| Recurring, tricky work with substantial project-specific knowledge | Suggest a repo-local skill, for example, teaching a common parser-extension workflow when its contracts and verification are non-obvious |
| Mandatory action or behavior that must not depend on agent recall | Use a supported harness hook, for example, blocking a protected operation until a required project check succeeds |

Skills should teach the decisions and workflow needed for reliable execution, not duplicate general tool manuals. Give them clear selection descriptions and reuse project commands for deterministic work.

Harness hooks are stronger interventions. Recommend them for a concrete mandatory requirement, not every preference. Keep reusable check logic in project-owned scripts or tools. Use the harness's documented events and enforcement semantics rather than assuming any hook can block an action. A notification or context-injection hook does not establish enforcement.

After approval, verify a repo-local skill is discovered and guides a representative task in a fresh agent context. For a hook, exercise both permitted and prohibited cases safely. Confirm failures block the intended action when enforcement is required, successful cases proceed, and errors explain how to recover. Check scope and bypass paths; enforcement in one harness does not cover other agents or direct shell use.

Use current documentation for the selected harness. Do not require every repository to add skills or hooks, or create configurations for harnesses the team does not use.

## Connect safeguards

Assess each property independently:

| Property | What to inspect |
| --- | --- |
| Locally usable | Contributor command runs checks and exposes actionable failures |
| Automatic | CI or appropriate hooks invoke the checks on relevant changes |
| Enforced | Project policy prevents integration when required checks fail |
| Protected | Routine changes cannot casually weaken checks without the agreed scrutiny |

Use CI and repository policy for authoritative integration checks. Git hooks can provide early feedback but can be skipped. Harness hooks can enforce supported actions within that harness; assess their actual scope rather than treating them as repository-wide enforcement.

A common recommendation is to protect the default branch against force pushes and deletion, require changes through pull requests rather than direct pushes, and require relevant CI checks to pass before merging. These are separate protections; blocking force pushes alone does not require PRs. Inspect the actual branch rules and confirm that credentials used by agents cannot bypass them. Propose missing protections and obtain approval before changing remote policy.

Also examine review requirements around validation configuration according to the project's autonomy policy. Do not impose universal ownership files or organization workflows.

## Remediate

1. Fix the setup or validation entry point before duplicating it in CI.
2. Reuse that entry point in automation to prevent divergent instructions.
3. Configure required integration checks where requested and permitted.
4. Choose Git hooks for useful early feedback and harness hooks for supported mandatory behaviors. Avoid duplicating expensive checks unnecessarily.
5. Explain changes to remote policy and obtain appropriate approval before applying them.

Use version-matched tool documentation and installed help for exact commands and configuration. Do not copy guessed branch-rule or CI syntax.

## Verify

- Exercise setup, build where relevant, and journey validation from a clean environment.
- State exactly what was clean: checkout, home/configuration, dependency caches, services, and runtime provisioning.
- Existing-machine success does not prove fresh-clone setup.
- Inspect CI execution results, not merely workflow files.
- Confirm failures propagate rather than being hidden by shell pipelines, unconditional success, or permissive job settings.
- Confirm remote enforcement through its actual settings. Missing access means unknown.

Do not install runtimes, access production, send real notifications, or destroy state without authorization. Do not add guessed resource cutoffs that reject normal valid usage; use established contracts or agreed budgets.
