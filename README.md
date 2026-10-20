# Skills

A curated collection of skills for coding agents. Each skill contains task-specific guidance and any supporting references.

| Skill | Purpose |
| --- | --- |
| [Agent harness engineering](skills/agent-harness-engineering/SKILL.md) | Build and improve agents, tools, prompts, and execution behavior. |
| [Mise dotfiles sync](skills/mise-dotfiles-sync/SKILL.md) | Synchronize dotfiles across machines using mise and a private Git repository. |
| [PR descriptions](skills/pr-descriptions/SKILL.md) | Write concise pull request descriptions. |
| [Tailcat](skills/tailcat/SKILL.md) | Share ports, transfer files, and connect over SSH. |
| [Windows click-through installer](skills/windows-click-through-installer/SKILL.md) | Create and verify per-user Windows installers. |
| [Writing a README](skills/writing-a-readme/SKILL.md) | Create or revise a project README. |

## Install selected skills

You need access to this private repository and working Git authentication. The commands below use SSH.

Use the skills installer to select skills and target agents:

```sh
npx skills add git@github.com:xpcmdshell/skills.git
```

The installer supports Claude Code, GitHub Copilot, pi, and other coding agents. To target pi's personal skill directory:

```sh
npx skills add git@github.com:xpcmdshell/skills.git --agent pi --global
```

To list available skills without installing them:

```sh
npx skills add git@github.com:xpcmdshell/skills.git --list
```

## Install the collection through a marketplace

Marketplace installation includes all six skills.

### Claude Code

```sh
claude plugin marketplace add git@github.com:xpcmdshell/skills.git
claude plugin install curated-skills@skills
```

### GitHub Copilot CLI

```sh
copilot plugin marketplace add git@github.com:xpcmdshell/skills.git
copilot plugin install curated-skills@skills
```

VS Code Copilot also discovers plugins installed by Copilot CLI. You can instead register the SSH repository URL through VS Code's `chat.plugins.marketplaces` setting.

### OMP

```sh
omp plugin marketplace add git@github.com:xpcmdshell/skills.git
omp plugin install curated-skills@skills
```

## Maintain the collection

Add a self-contained directory under `skills/` with a `SKILL.md` containing `name` and `description` frontmatter. Put supporting files beside it and use relative links.

The collection uses standard skill discovery and one shared marketplace catalog. New skill directories need no catalog entry. Plugin versions are omitted so Claude Code tracks commits when users update the collection.
