---
name: windows-click-through-installer
description: Build and test graphical Windows installers for distributing an application to end users. Use when asked to create a Setup.exe, package an app for Windows, or build a setup wizard. Covers guided setup, shortcuts, optional startup, upgrades, settings preservation, uninstallation, and local installer builds. Not for installing unrelated software on the user's computer.
compatibility: Windows build and verification host. PowerShell and the application's existing build tools; Inno Setup for the default packaging approach.
---

# Build a Windows application installer

Give users a familiar setup wizard without making them install compilers or build the application themselves. Keep the packaging source small, readable, and separate from generated artifacts.

## Establish the scope

Inspect the existing build, install, update, and uninstall paths before choosing tools. Reuse a working installer definition if the project already has one.

Resolve these facts from the repository and conversation:

- Application name, executable, runtime files, and supported Windows versions and architectures.
- Existing install directory, settings location, and startup mechanism.
- Whether the app stays running in the background and how it normally shuts down.
- Whether installation genuinely needs machine-wide access.

Ask only about choices that materially change the experience. Default to a per-user installation, preserved settings, and no desktop shortcut. Offer startup at sign-in when it makes sense for a persistent app; do not add startup to an ordinary foreground tool without a reason.

The deliverable is a working installer, its maintainable source definition, and a local build command.

## Choose the smallest suitable packaging approach

Use **Inno Setup** for a straightforward setup executable unless the project has an established alternative or needs a specific deployment format. Keep an existing WiX/MSI or NSIS workflow when it fits. Use MSIX or a service installer only when the application's requirements justify it.

Separate build-time tools from end-user requirements. The packager belongs on the build machine, not the user's machine. Bundle the application's redistributable runtime files where appropriate; do not redesign the app or add a separate host application just to package it.

For Inno Setup, the typical compiler installation is:

```powershell
winget install --id JRSoftware.InnoSetup --exact --source winget --scope user
```

Check whether the compiler is already installed before downloading anything. Explain a necessary tool installation and honor the user's permission boundaries.

## Write the Inno Setup definition

Inno Setup compiles a text **`.iss` installer definition** into a setup executable. Create a project-owned file such as `installer/MyApp.iss`; the local builder passes it to `ISCC.exe`. The definition describes what the wizard installs and how it behaves. It does not replace the application's build.

### Learn the syntax from the selected compiler

Before writing directives or custom Pascal code:

1. Locate `ISCC.exe` and inspect the `Examples` directory and `ISetup.chm` help file beside it. These match the installed compiler. Use its help output for supported command-line options.
2. Start with the closest shipped example, not a large third-party installer:
   - `Example1.iss`: basic `[Setup]`, `[Files]`, and shortcut definitions.
   - `Example2.iss`: a direct Start Menu shortcut instead of a program-group page.
   - `ISPPExample1.iss`: preprocessor definitions and substitutions.
   - `CodePrepareToInstall.iss`: the pre-install event; borrow its event structure, not unnecessary prerequisite installers or reboot logic.
   - `UninstallCodeExample1.iss`: uninstall event handling.
3. If local examples are unavailable, use the [official example collection](https://github.com/jrsoftware/issrc/tree/main/Examples), selecting the version tag corresponding to the compiler.
4. Consult the relevant section reference below for each unfamiliar directive or flag. Online documentation may describe a newer compiler; verify availability against the installed help and an actual compilation. Locate renamed documentation pages through the official index rather than guessing syntax.

| Definition section | Purpose and syntax reference |
| --- | --- |
| [`[Setup]`](https://jrsoftware.org/ishelp/topic_setupsection.htm) | `Name=value` directives for identity, version, destination, privileges, and platform requirements. |
| [`[Files]`](https://jrsoftware.org/ishelp/topic_filessection.htm) | Semicolon-separated `Source: "..."; DestDir: "..."; Flags: ...` entries for the built payload. |
| `[Icons]` | Start Menu and startup shortcuts. See the shipped shortcut examples and the section reference in installed help. |
| [`[Tasks]`](https://jrsoftware.org/ishelp/topic_taskssection.htm) | User-selectable checkboxes, linked to entries with `Tasks:`. |
| [`[Run]`](https://jrsoftware.org/ishelp/topic_runsection.htm) | Launch-on-completion behavior. |
| `[InstallDelete]` | Narrowly targeted removal of obsolete files or deselected startup shortcuts; consult installed help. |
| [`[Code]` event functions](https://jrsoftware.org/ishelp/topic_scriptevents.htm) | Pascal scripting for behavior the declarative sections cannot provide. |

### Small syntax example

This example shows a single-executable, per-user installer. Replace the example app identity and filenames with the project's own values. Add its platform requirements, runtime files, and any startup or shutdown behavior established above.

```ini
; installer/MyApp.iss
; AppVersion and PayloadDir are supplied by the builder through /D.
[Setup]
AppId=ExampleCompany.MyApp
AppName=MyApp
AppVersion={#AppVersion}
DefaultDirName={localappdata}\Programs\MyApp
PrivilegesRequired=lowest
DisableProgramGroupPage=yes
OutputBaseFilename=MyApp-Setup-{#AppVersion}

[Files]
Source: "{#PayloadDir}\MyApp.exe"; DestDir: "{app}"

[Icons]
Name: "{autoprograms}\MyApp"; Filename: "{app}\MyApp.exe"

[Run]
Filename: "{app}\MyApp.exe"; Description: "Launch MyApp"; Flags: postinstall nowait skipifsilent
```

`{#AppVersion}` and `{#PayloadDir}` are **compile-time preprocessor substitutions**. `{app}`, `{localappdata}`, and `{autoprograms}` are **installation-time constants**. Keep those two kinds of values distinct.

For a builder that has already resolved the compiler, payload, and output paths, the corresponding invocation is:

```powershell
& $iscc "/DAppVersion=$version" "/DPayloadDir=$payloadDir" "/O$outputDir" "$repoRoot\installer\MyApp.iss"
if ($LASTEXITCODE -ne 0) { throw "Installer compilation failed." }
```

Check [compiler command-line options](https://jrsoftware.org/ishelp/topic_compilercmdline.htm) and the installed preprocessor example when adapting this invocation. Treat the sample as a syntax illustration, not a substitute for the application's file list or installer testing.

## Define the installer experience

Keep the wizard focused on install, optional startup, and launch on completion.

For a per-user Inno Setup installer:

- Set `PrivilegesRequired=lowest` and default to `{localappdata}\Programs\<AppName>`.
- Give `AppId` a stable identifier that stays the same across versions. Set the displayed version from the builder's version argument.
- Set the actual OS and architecture requirements. Use `x64os`, not `x64compatible`, when an x64 helper must run inside an x64 system process and ARM64 emulation is insufficient.
- Add a Start Menu entry and standard Windows Installed Apps uninstall registration.
- Put optional login startup in `{userstartup}`. Preserve the user's selection on upgrades with `UsePreviousTasks=yes`; explicitly remove the old shortcut if the user deselects startup.
- Offer **Launch application** on the completion page, checked by default. `postinstall nowait skipifsilent` is a useful default for the `[Run]` entry.
- Keep user settings outside the application directory. Create defaults only when absent, and preserve settings through upgrades and uninstall. Make settings deletion an explicit choice if supported.
- Package only the intended application files and required license notices. Never bundle local credentials, user config, logs, compiler output, or the repository itself.

Use the installer's native task, shortcut, file, and uninstall features before adding custom scripting. In particular, `checkedonce` means a task becomes unchecked on later installs; it is not a substitute for preserving startup preferences.

Check signing status and state it plainly. Unsigned installers can show Windows security warnings. Use the project's approved signing process when supplied; never misrepresent the publisher or bypass signing policy.

## Handle a running application safely

An upgrade must finish building and packaging before it asks the installed app to close. At installation time, close the existing app before replacing its files.

Prefer the installer's built-in application-close support when it works with the app. If a background app requires custom handling:

1. Identify the process or window through an established application-specific identity.
2. Verify that its executable belongs to the installation being updated.
3. Request the app's normal graceful shutdown and wait with a bounded timeout.
4. Abort with a useful message if the process cannot be verified or will not close.

Do not kill processes by a broad name match, restart Explorer, or force-unload libraries used by another process. Do not invent user-facing remote-control CLI commands solely to make the installer work.

With Inno Setup, `PrepareToInstall` can return an error before copying files, and `InitializeUninstall` can reject an unsafe uninstall. Use `SuppressibleMsgBox` for errors that should honor unattended-mode message suppression. Avoid making a silent run wait indefinitely for a hidden prompt.

Leave legitimately loaded helper files alone when Windows still owns them. Report any residual cache accurately rather than disrupting the user's desktop to remove it.

## Build locally with one command

Add a small builder, such as `scripts/build-installer.ps1`, and keep the installer definition in a dedicated directory. Adapt names and languages to the repository rather than imposing a framework.

The builder should:

1. Validate an explicit version and locate the existing application build tools and installer compiler. Give an actionable missing-dependency message; do not silently install toolchains.
2. Create a unique staging directory under ignored build output or the OS temp directory.
3. Invoke the existing application build and relevant checks. Check external-command exit codes explicitly, especially in Windows PowerShell 5.1.
4. Stage the finished executable, required runtime assets, and redistribution licenses. Include notices for compiled-in dependencies as well as shipped libraries.
5. Compile the setup executable with the requested version and staged payload.
6. Generate a SHA-256 sidecar for the completed installer, using the conventional `hash  filename` format.
7. Put the final installer and checksum in an ignored output directory only after build, checks, and packaging succeed.
8. Restore the working directory and environment, and clean staging files on success or failure.

A typical interface is:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-installer.ps1 -Version 1.2.3
```

Produce names such as `AppName-Setup-1.2.3-x64.exe` and the matching `.exe.sha256`. Resolve paths correctly when invoked outside the repository root and support spaces in paths.

Keep version checks grounded in the tool. Some Inno Setup `ISCC.exe` builds report a file version of `0.0.0.0`; that does not mean the compiler is obsolete. A preprocessor guard using `VER` and `EncodeVer` checks the compiler itself. Stream checksum calculation rather than loading a large installer into memory; .NET SHA-256 is available when a PowerShell checksum cmdlet is missing.

## Verify the actual installer

Run the setup program, not just a syntax check or a test that asserts installer source text.

Use a disposable Windows environment where available. Otherwise isolate the application directory, record existing app/config/startup state, and restore it afterward. An overridden install directory does not isolate user-wide shortcuts or uninstall registry keys, so account for those separately.

Exercise the relevant user-visible paths:

| Scenario | Expected result |
| --- | --- |
| Fresh interactive install | Wizard opens, the intended files install, and per-user registration is created without elevation. |
| Startup selection | Its default matches the intended experience; opt-out removes startup; upgrades preserve the choice. |
| Launch on completion | The installed app actually starts and reaches its normal usable state. |
| Existing running app | Upgrade closes only the matching installation and replaces it successfully. |
| Edited configuration | Settings survive upgrade and remain usable. |
| Uninstall | The app closes; installed files, shortcuts, and uninstall registration are removed; user settings follow the chosen preservation policy. |
| Failed build or packaging | The builder exits unsuccessfully and leaves an existing completed installer and checksum unchanged. |
| Silent operation, if supported | No unexpected prompt or automatic launch; errors produce a nonzero exit. |
| Wrong installation path | An unrelated running copy is left alone rather than killed. |

Verify checksums independently. Inspect the wizard's actual controls and layout. Prefer accessibility automation and window-specific captures over taking over the user's mouse. If a human is reviewing a demo, keep it available until they advance or dismiss it; do not assume they are continuously watching.

Use throwaway smoke scripts for one-off verification. Keep permanent tests only when they defend meaningful behavior such as upgrade preservation or failure ordering, not labels, filenames, or source-code wiring.

## Document the user path

Provide brief instructions for running setup, choosing startup options, launching the app, and uninstalling it. Keep installer-builder requirements separate from what an end user needs. Explain the experience without internal implementation notes or a development diary.

## Handoff

Report briefly:

- What was added and the local build command.
- Where the completed installer and checksum are located.
- Which install, upgrade, startup, launch, and uninstall scenarios actually passed.
- Signing status and any remaining user-visible limitation.

Stop with the verified installer and concise test results ready for the user's review.

## References

- [Inno Setup documentation](https://jrsoftware.org/ishelp/)
- [Per-user installation privileges](https://jrsoftware.org/ishelp/topic_setup_privilegesrequired.htm)
- [Tasks and startup choices](https://jrsoftware.org/ishelp/topic_taskssection.htm)
- [Launch on completion](https://jrsoftware.org/ishelp/topic_runsection.htm)
- [Installer and uninstaller lifecycle hooks](https://jrsoftware.org/ishelp/topic_scriptevents.htm)
