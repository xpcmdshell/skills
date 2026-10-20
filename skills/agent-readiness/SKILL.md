---
name: agent-readiness
description: Assess and prepare repositories for reliable autonomous agent work. Use when making a project agent-friendly, auditing readiness, or establishing engineering guardrails. Identifies preparation needs across development and delivery, then makes approved improvements to architecture, testing, diagnostics, setup, documentation, and external safeguards.
---

# Agent readiness

Prepare the repository so agents can understand intended outcomes, use reliable interfaces, observe results, and detect mistakes. Assess the work the user wants to delegate, then establish the missing project capabilities.

This skill improves repositories, tooling, environments, and engineering processes. It does not perform the future feature, debugging, release, or operational job merely because that job appears in the assessment. Safeguards belong to normal project tooling, not this skill.

## Working model

Connect **intended work → required capabilities and contracts → evidence → gaps → approved improvements → verification**.

- **Intended work:** tasks the user wants agents to handle, and how far they should carry them.
- **Core journey:** a meaningful consumer task with observable success and relevant failure outcomes.
- **Public application API:** an interface intended for consumers or other modules, independent of framework wiring. It need not be network-accessible or exported from a published package.
- **Deep module:** a module that hides substantial complexity behind a coherent interface. Consumers choose domain actions; the module owns internal coordination.
- **Evidence:** inspected code/configuration, observed execution, or an explicitly labeled qualitative judgment supporting a particular claim.

Use this chain to reason, not to create a database or mandatory inventory. One observation can support several findings without supporting every conclusion about them.

## Workflow and permission boundaries

1. **Discover without editing.** Inspect repository instructions, local skills, harness hooks, project structure, working-tree changes, public interfaces, existing commands, tests, and automation.
2. **Establish preparation scope.** Propose intended delegated work, its extent, core journeys, and architectural principles from the request and maintained project guidance. Confirm consequential unknowns with the user. Reuse established decisions; do not administer a lifecycle questionnaire.
3. **Assess preparation needs.** Read [assessment and reporting](references/assessment-and-report.md) before investigation. Read the [lifecycle map](references/lifecycle.md) to select relevant preparation concerns. Use the guides below for those concerns. A broad assessment covers all preparation areas below; a targeted assessment names exclusions.
4. **Present findings and proposals.** Use the report format in the assessment guide. Explain strengths, evidence limits, priorities, tradeoffs, and verification. Ask whether to save a dedicated Markdown report inside the project or elsewhere; confirm its destination before writing. Do not create project-local reports or scratch files by default.
5. **Discuss and wait.** Ask which proposed actions to pursue, defer, or revise. End the assessment turn without beginning remediation. Agreement with findings is not implementation permission; saving a report is a separate choice.
6. **Make approved improvements.** Establish the selected scope, approach, and verification before editing. Follow the relevant guides. Preserve working infrastructure and unrelated changes. Write meaningful integration/journey tests before new implementation behavior. Discuss materially wider scope or changed approaches before proceeding.
7. **Verify affected claims.** Execute relevant workflows and inspect outcomes. Update affected findings, not an automatic full reassessment. Report changes, execution evidence, and remaining gaps.

Assessment authorizes investigation and safe verification, not code, dependency, documentation, hook, CI, or remote-policy changes. Inspect commands for side effects first. Ask before live deliveries, destructive setup, or access that could modify real user data.

A general request to make a project ready does not approve every discovered remediation. Once specific actions and their approach are approved, execute routine steps without repeated confirmation. Guides explain approved implementation; they do not independently authorize it. Report saving does not authorize staging, commits, or ignore-rule changes.

## Preparation guides

Use these as complementary questions about the same project, not independent scans.

| Area | Preparation outcome | Required guide when assessing or improving |
| --- | --- | --- |
| Code quality | Readable-code expectations and executable mechanical checks | [Code quality](references/code-quality.md) |
| Architecture | Deep public boundaries and durable design principles | [Architecture](references/architecture.md) |
| User journeys | Meaningful automated proof through public APIs and real implementations | [User-journey testing](references/user-journey-testing.md) |
| Debugging | Reproducible scenarios, observable state, and usable diagnostics | [Debugging](references/debugging.md) |
| Setup and automation | Repeatable setup, representative state, repo-local skills, harness hooks, and external safeguards | [Setup and automation](references/setup-and-automation.md) |
| Documentation | Accurate task guidance, examples, and authoritative intent | [Documentation](references/documentation.md) |
| Work coordination | An authoritative tracker, working agent access, and concrete task conventions | [Work coordination](references/work-coordination.md) |

When changes can affect consumers, persisted data, or ambiguous requirements, read [contracts and change impact](references/contracts-and-change-impact.md). When intended work involves shared state, parallel workers, credentials, or consequential mutations, read [execution safety](references/execution-safety.md).

## Judgment rules

- Intent, promised contracts, and current behavior can disagree. Surface conflicts; do not silently choose the implementation as authority.
- Journey scope is behavioral, not procedural distance from the executable. Public APIs are the normal test seam; frameworks and subprocesses earn no extra credit.
- Credit useful behavioral tests even when their code has architectural problems. Report those problems separately.
- Public API composition can express legitimate consumer choices. Do not confuse it with leaked implementation coordination.
- Formatting does not prove readability; artifacts do not prove execution; execution does not prove enforcement.
- Missing access means uncertainty, not absence or irrelevance. Preserve evidence limits in summaries.
- Prefer improvements addressing demonstrated causes over tool accumulation. Do not add arbitrary limits or score-driven requirements.
- Make recommendations concrete: for example, propose [Kata](https://github.com/kenn-io/kata) for local work tracking, or connect the existing validation command to CI. Explain the fit and how success is checked. The assessment need not specify every command or configuration detail; consult maintained tool guidance when implementing approved changes.

For ambiguous module boundaries, read [contrasting API examples](examples/public-api-journeys.md). For translating evidence into preparation proposals, read the [worked assessment](examples/delegation-assessment.md).

## Completion

An assessment is complete when intended work has supported preparation conclusions, scoped areas have findings or explicit unknowns, and core journeys map to tests or gaps. It ends with actionable proposals and user decisions, not edits.

Approved remediation is complete when the changes and relevant verification succeed and affected guidance matches reality. If verification is blocked, distinguish implemented work from unverified outcomes. Do not certify future changes or promise unattended correctness.

Durable improvement means less ambiguity and more reusable project capability for the next agent. Preserve approved knowledge in appropriate project guidance and executable workflows, not automatic audit journals or a private memory system.
