# Assessment and reporting

## Investigate to resolve decisions

1. Establish shared facts once: components, supported environments, public boundaries, commands, state, and project instructions.
2. Connect intended delegated work to capabilities it depends on. Use the lifecycle map without assuming every job is in scope.
3. Read relevant implementation, callers, test bodies, and configuration. Trace evidence to the claim it supports.
4. Choose the next check by the uncertainty it resolves, its cost, and its side effects. Reuse valid evidence across areas.
5. Execute safe relevant checks; preserve revision, local changes, inputs, environment, and results needed to interpret them.
6. Resolve conflicting evidence before drawing a conclusion. If blocked, identify the missing evidence and report an unknown.

Do not prescribe arbitrary file, command, or time limits. Narrow investigation around the decision being made. Stop investigating a finding when evidence supports its scoped conclusion or a concrete blocker prevents it. A broad search with no match does not establish absence: inspect likely authoritative configuration and alternate implementations.

Previous reports and documentation are leads, not automatically current evidence. Inspect changes affecting a previous claim before reusing it. After remediation, recheck affected behavior and dependent safeguards; unrelated verified facts need not be rediscovered.

## Findings and proposals

Use these statuses:

- **Verified:** evidence establishes the scoped requirement. Label execution, inspection, or qualitative judgment.
- **Partial:** specify established portions and remaining gaps.
- **Missing:** capability absent or demonstrably broken; state which.
- **Unknown:** evidence insufficient or unavailable.
- **Not applicable:** explain why the requirement does not apply to confirmed work.

An unknown may remain in a completed assessment; it cannot count as verified preparation. Lack of access does not make an in-scope concern irrelevant. Exclude a lifecycle concern because the intended work does not require it, not because its evidence is difficult to obtain. Do not assign global maturity levels or average away consequential gaps.

Connect each gap to an intended outcome and plausible consequence. Group findings that share a cause; one approved improvement can address several areas. State action dependencies explicitly. A prerequisite outside approved scope requires discussion, not silent expansion.

Recommend concrete repository, tooling, environment, or process improvements. If you cannot identify the missing capability, propose investigation rather than a speculative rewrite. Preserve working infrastructure. Distinguish essential preparation from optional improvements using the intended work, not a universal checklist.

## Report format

Deliver Markdown in conversation first. Formatting does not imply creating a file. Use these sections in order. Keep stable finding and action IDs within the report; no persistent ID system is required.

### 1. Delegation preparation summary

| Intended work and extent | Supported preparation | Consequential gaps / unknowns | Recommended next step |
| --- | --- | --- | --- |
| User-confirmed task boundary | Evidence-backed strengths | What limits confidence and why | Preparation action, not execution of the future job |

Lead with the most useful decision and its uncertainty. These conclusions are advisory, not permissions to perform the future work.

### 2. Scope and evidence

- Identify repository, components, revision/local changes, and relevant environments.
- List confirmed journeys and architectural principles; label unresolved assumptions.
- List checks executed and results. Separate inspection, judgment, and checks not run, with reasons.
- Name excluded areas for targeted assessments.

### 3. Findings

| ID | Area / component | Status | Finding and consequence | Evidence |
| --- | --- | --- | --- | --- |
| F1 | Relevant area and scope | Defined status | Established capability or specific gap | Source location, command/result, or labeled judgment |

Include strengths and gaps. Do not convert a mixed set of findings into a pillar-level pass. Link a shared observation rather than copying its full output into every row.

### 4. User-journey coverage

| Journey and outcome | Public API seam | Automated test | Real behavior / substitutions | Execution evidence and gaps |
| --- | --- | --- | --- | --- |
| Confirmed consumer task | Actual entry point or absent | Location or absent | What executes and what is replaced | Result, not run, and limits |

### 5. Recommended remediations

| Action | Findings addressed | Change and benefit | Scope, dependencies, and tradeoffs | Verification |
| --- | --- | --- | --- | --- |
| R1 | Finding IDs | Concrete preparation improvement | Affected boundaries and decisions | Observable outcome and how to establish it |

Recommend a concrete approach and explain why it fits. For example, 'Use the team's existing Azure DevOps project and establish agent access' is more useful than 'add work tracking'. Include relevant scope, tradeoffs, and a success check; leave routine implementation details to tool guidance after approval.

Order by consequence and useful enabling dependencies. Do not equate an easily fixed cosmetic gap with a critical missing safeguard. State alternatives when they materially affect the user's decision.

### 6. Decisions for the user

- Recommend a starting scope and explain why.
- Ask which actions to pursue, defer, or revise. Surface unresolved decisions for those actions.
- Ask: "Would you like a dedicated Markdown report? If so, inside this project or at another location?"
- Confirm the destination before writing; reuse an explicit path or established no-file preference without asking again.
- Stop and wait. Do not begin remediation in the report turn.

A reply approving the findings does not authorize changes. Ask which proposed actions the user wants to pursue if that decision remains open; do not treat an ordinary acknowledgement as an error or leave the discussion stalled. A report-save request authorizes only that file at the agreed location. Do not stage, commit, modify ignore rules, or silently save disposable artifacts in the checkout.

## After approved remediation

Report the approved actions performed, changed project capabilities, verification results, and remaining unknowns. Link changes back to findings. If evidence invalidates an earlier conclusion, correct it explicitly. Do not claim successful preparation from configuration creation alone.

Update a saved report only within the user's file-writing authorization. Keep useful long-term guidance in its appropriate project location when that documentation change is approved; do not copy the audit history into the README.
