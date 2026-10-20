---
name: mise-dotfiles-sync
description: Set up automatic dotfile synchronization across machines using mise’s built-in file watcher and a private Git repository. Use when asked to sync settings, skills, rules, or other dotfiles without routine manual commits, pushes, or pulls. Covers installation, explicit path tracking, background services, additional-machine enrollment, and conflict handling.
---

# Automatic dotfile sync with mise

## Goal

Keep selected dotfiles synchronized across machines using mise’s built-in file watcher and Git-backed history. Files stay in place. The background service detects edits, saves commits, publishes changes, and applies incoming updates without routine manual push/pull commands.

## Prerequisites

- A current **mise** release on each machine:
  - macOS: `brew install mise`
  - macOS/Linux official installer: `curl -fsSL https://mise.run | sh`
  - Windows: use Scoop or winget. See [installation instructions](https://mise.jdx.dev/installing-mise.html).
- Git installed.
- A private repository and persistent read/write Git authentication on every machine, usable by the background service.

Before running the recipes, check `mise bootstrap --help` and `mise bootstrap dotfiles --help` against the installed version. Use the [official adoption guide](https://mise.jdx.dev/bootstrap/from-repository.html) for enrolling another machine from shared history.

## Select the files and their contents

- Inspect whether each selected path is a regular file, directory, or symlink.
- Mise saves a symlink itself, not its target's contents. Tracking a directory of symlinks does not enroll those targets.
- To synchronize target contents through mise, explicitly track their real paths as well. Inspect those paths for excluded material before enrollment.
- Alternatively, install or clone the source repository on each machine and create the discovery links there.

For example, `~/.agents/skills/example` can point to `~/dev/skills/skills/example`. Sharing only the discovery link does not share `SKILL.md` or its references. Ensure the source exists on the destination machine and that the link resolves there. Recreate machine-specific absolute links for the destination rather than copying another machine's path.

## First machine

1. Review the selected paths and any symlink targets to share. Exclude credentials, caches, databases, and machine-specific state **before tracking**. Tracking immediately saves history.
2. Enroll the selected paths:
   ```sh
   mise bootstrap dotfiles track ~/.config/example
   ```
3. Add to the global mise configuration:
   ```toml
   [bootstrap.services.mise-history]
   builtin = "history-watch"
   ```
4. Connect the repository and start the watcher:
   ```sh
   mise bootstrap dotfiles origin set <PRIVATE_GIT_URL> --sync sync --yes
   mise bootstrap services apply
   mise bootstrap dotfiles status
   ```

## Each additional machine

1. Inspect and back up existing destination files.
2. Preview, then import:
   ```sh
   mise bootstrap --adopt <PRIVATE_GIT_URL> --dry-run
   mise bootstrap --adopt <PRIVATE_GIT_URL> --yes
   ```
3. If existing files conflict, deliberately select the desired version:
   ```sh
   mise bootstrap dotfiles pull --take-remote <PATH> --yes
   # Or preserve this machine’s version:
   mise bootstrap dotfiles pull --keep-local <PATH> --yes
   ```
4. Ensure its global mise configuration declares the **same tracked paths** and watcher. Merge into existing configuration rather than replacing it:
   ```toml
   [dotfiles]
   "~/.config/example" = { mode = "track" }

   [bootstrap.services.mise-history]
   builtin = "history-watch"
   ```
5. Start and check the service:
   ```sh
   mise bootstrap services apply
   mise bootstrap dotfiles status
   ```

## Verify

Check watcher and synchronization health without modifying tracked files:
```sh
mise bootstrap dotfiles status
```

On the destination machine, check that each shared symlink resolves and that the intended application can read the target content. For a skill, check access to `SKILL.md` and its supporting files. Healthy synchronization status alone does not establish that linked content arrived.

**Ask the user before performing a write-based test.** Temporary probe creation, edits, and deletion become permanent Git history, which may be unwanted.

If approved:
- Create a harmless temporary file inside a tracked directory. For linked content managed by mise, use the explicitly tracked source directory.
- Confirm automatic capture and propagation in both directions.
- Remove the probe and confirm its deletion propagates. Its history remains.
- To expedite verification rather than wait for background intervals:
  ```sh
  mise bootstrap dotfiles sync
  mise bootstrap dotfiles pull --yes
  ```

Defaults: capture after roughly **2 seconds of quiet**, publish within **5 minutes**, fetch/apply every **15 minutes**. Conflicts pause sharing for the entire setup until resolved; local capture continues. File synchronization does not guarantee application reload.

## Notes

- Only explicitly tracked paths are shared. Mise’s own configuration is **not automatically included**. Configure it on each machine or explicitly enroll it.
- Private repositories still retain historical secrets. Untracking does not erase prior commits.
- Background service: LaunchAgent on macOS, systemd user service on Linux, Scheduled Task on Windows. Linux user services need lingering enabled if they must run while logged out.

Reference: [mise dotfiles history](https://mise.jdx.dev/history.html)
