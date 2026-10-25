# Skills

A collection of curated skills for agents.

| Skill | Purpose |
| --- | --- |
| [Agent harness engineering](skills/agent-harness-engineering/SKILL.md) | Build and improve agents, tools, prompts, and execution behavior. |
| [Agent readiness](skills/agent-readiness/SKILL.md) | Assess and prepare repositories for reliable autonomous agent work. |
| [Mise dotfiles sync](skills/mise-dotfiles-sync/SKILL.md) | Synchronize dotfiles across machines using mise and a private Git repository. |
| [PR descriptions](skills/pr-descriptions/SKILL.md) | Write concise pull request descriptions. |
| [Python best practices](skills/python-best-practices/SKILL.md) | Write idiomatic Python and configure modern project tooling. |
| [Tailcat](skills/tailcat/SKILL.md) | A networking Swiss Army knife from the creators of Tailscale, combining netcat’s flexibility with Tailscale’s connectivity. |
| [Windows application installer](skills/windows-click-through-installer/SKILL.md) | Package apps for Windows with guided setup, upgrades, and uninstallation. |
| [Writing a README](skills/writing-a-readme/SKILL.md) | Create or revise a project README. |

## Install selected skills

```sh
npx skills add xpcmdshell/skills
```

## Install the collection through a marketplace

Marketplace installation includes all skills. If you're authenticating with SSH, replace `xpcmdshell/skills` with `git@github.com:xpcmdshell/skills.git` in the marketplace add command.

### Claude Code

```sh
claude plugin marketplace add xpcmdshell/skills
claude plugin install curated-skills@skills
```

### GitHub Copilot CLI

```sh
copilot plugin marketplace add xpcmdshell/skills
copilot plugin install curated-skills@skills
```

VS Code Copilot also discovers plugins installed by Copilot CLI. You can instead register `https://github.com/xpcmdshell/skills.git` through VS Code's `chat.plugins.marketplaces` setting, or use `git@github.com:xpcmdshell/skills.git` for SSH.

### OMP

```sh
omp plugin marketplace add xpcmdshell/skills
omp plugin install curated-skills@skills
```
