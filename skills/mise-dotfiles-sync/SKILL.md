---
name: mise-dotfiles-sync
description: Set up automatic dotfile synchronization across machines using mise’s built-in file watcher and a private Git repository. Use when asked to sync settings, skills, rules, or other dotfiles without routine manual commits, pushes, or pulls. Covers installation, explicit path tracking, background services, additional-machine enrollment, and conflict handling.
---

# Automatic dotfile sync with mise

## Goal

Keep selected dotfiles synchronized across machines using mise’s built-in file watcher and Git-backed history. Files stay in place. The background service detects edits, saves commits, publishes changes, and applies incoming updates without routine manual push/pull commands.

## Prerequisites

- **mise 2026.9.2 or newer** on each machine:
  - macOS: `brew install mise`
  - macOS/Linux official installer: `curl -fsSL https://mise.run | sh`
  - Windows: use Scoop or winget. See [installation instructions](https://mise.jdx.dev/installing-mise.html).
- Git installed.
- A private repository and persistent read/write Git authentication on every machine, usable by the background service.

## First machine

1. Review the exact files/directories to share. Exclude credentials, caches, databases, and machine-specific state **before tracking**. Tracking immediately saves history.
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
   mise bootstrap --from-git <PRIVATE_GIT_URL> --dry-run
   mise bootstrap --from-git <PRIVATE_GIT_URL> --yes
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

**Ask the user before performing a write-based test.** Temporary probe creation, edits, and deletion become permanent Git history, which may be unwanted.

If approved:
- Create a harmless temporary file inside a tracked directory.
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
