# Work coordination

Agents need an authoritative place to discover, record, own, and finish work. This is project work tracking, not storage for readiness reports.

## Assess

- Identify the existing tracker and project conventions before proposing another system. Project work must remain discoverable across sessions; session-local todos and resumable conversations are not a durable project backlog.
- Check whether agents can access the intended project and understand ownership, blockers, and completion.
- Distinguish missing access from a missing tracker. Do not infer authority from the source-code host alone.

## Recommend

| Situation | Example recommendation |
| --- | --- |
| Tracker already used | Retain it; establish agent access and link its workflow from project guidance |
| Team uses GitHub with no tracker | Propose GitHub Issues rather than a separate backlog |
| Team uses Azure DevOps | Use its existing work-item process; discover project-specific types and states |
| Local/offline tracking preferred | Propose [Kata](https://github.com/kenn-io/kata) as a local alternative to GitHub Issues or Azure DevOps work items |
| Multiple trackers | Clarify which is authoritative for each kind of work before proposing synchronization |

These are choices to discuss, not mandatory tools. After approval, establish the selected system and document only project-specific facts: where work lives, how agents access it, and any conventions not already supplied by the tool.

Use maintained tool guidance instead of copying its manual:

- **[Kata](https://github.com/kenn-io/kata):** inspect `kata init --help`; use `kata quickstart --format contract` for its agent workflow. A workspace binding does not share the underlying issue database. Initialization can change project files and ignore rules.
- **GitHub:** use `gh issue --help` and the [CLI manual](https://cli.github.com/manual/gh_issue). Assignment alone does not guarantee exclusive ownership between concurrent agents.
- **Azure DevOps:** use the existing integration or [Boards CLI guidance](https://learn.microsoft.com/en-us/cli/azure/boards?view=azure-cli-latest). Process types and states are project-specific. Azure CLI can auto-install extensions during discovery; disable dynamic installation if installation is not approved.

For unfamiliar tools, consult their current setup and agent-integration guidance. Do not introduce custom statuses, templates, or coordination machinery unless the project needs them.

## Verify

Confirm agents reach the intended tracker/project. If write capability needs verification, agree a real or disposable task and its disposition before exercising the workflow. Read-only access does not prove write access.

Verify offline or shared-worker behavior only when required. Do not automatically create issues from readiness findings, duplicate a backlog in Markdown, or delete records without approval.
