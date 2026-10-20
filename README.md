# Skills

A curated collection of skills for coding agents. Each skill contains task-specific guidance and any supporting references.

| Skill | Purpose |
| --- | --- |
| [Agent harness engineering](skills/agent-harness-engineering/SKILL.md) | Build and improve agents, tools, prompts, and execution behavior. |
| [Agent readiness](skills/agent-readiness/SKILL.md) | Assess and prepare repositories for reliable autonomous agent work. |
| [Mise dotfiles sync](skills/mise-dotfiles-sync/SKILL.md) | Synchronize dotfiles across machines using mise and a private Git repository. |
| [PR descriptions](skills/pr-descriptions/SKILL.md) | Write concise pull request descriptions. |
| [Tailcat](skills/tailcat/SKILL.md) | Share ports, transfer files, and connect over SSH. |
| [Windows click-through installer](skills/windows-click-through-installer/SKILL.md) | Create and verify per-user Windows installers. |
| [Writing a README](skills/writing-a-readme/SKILL.md) | Create or revise a project README. |

## Install selected skills

Use the skills installer to select skills and target agents:

```sh
npx skills add xpcmdshell/skills
```

Or, if you're authenticating with SSH:

```sh
npx skills add git@github.com:xpcmdshell/skills.git
```

The installer supports Claude Code, GitHub Copilot, pi, and other coding agents. To target pi's personal skill directory:

```sh
npx skills add xpcmdshell/skills --agent pi --global
```

To list available skills without installing them:

```sh
npx skills add xpcmdshell/skills --list
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
