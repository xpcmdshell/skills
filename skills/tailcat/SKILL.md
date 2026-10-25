---
name: tailcat
description: "Explains Tailcat CLI usage: share an app or port, open forwarded apps in a browser, transfer files, use SSH or restricted commands, and reach remote TCP/UDP services. Use for Tailcat commands, private ngrok-like sharing, connection tokens, and choosing the simplest workflow."
---

# Tailcat CLI usage

Choose the simplest recipe for the user's goal.

- **Server:** prints a `tc...` address (`TOKEN`).
- **Client:** connects using that token.
- Either machine can belong to you or someone else. Both sides must stay running; share tokens privately.

When checking feature availability or syntax:
1. Check `tailcat version` on both peers.
2. Read `tailcat readme` and the relevant `tailcat COMMAND --help` for the installed version.
3. If needed, consult the matching release's upstream documentation, such as the [v0.7.0 README](https://github.com/tailscale/tailcat/blob/v0.7.0/README.md) or [source](https://github.com/tailscale/tailcat/tree/v0.7.0/cmd/tailcat). The `main` branch can describe unreleased features.

Don't guess from an abbreviated example.

## Share an app or port
The app is already listening on the server’s port 3000:
```sh
# Server: serve the app and share the printed token.
tailcat serve --key=new 3000
# Client: choose a free local port and open the app in a browser.
tailcat forward --open-browser TOKEN 0:3000
```
- Tailcat opens `http://127.0.0.1:PORT/` when the local listener is ready and keeps forwarding until interrupted.
- Omit `--open-browser` for headless use. Open the printed listener address manually when needed.
- `--open-browser` requires exactly one port mapping. `tailcat browse TOKEN` is shorthand for `tailcat forward --open-browser TOKEN 0:80`, specifically for remote port 80.
- This is private ngrok-like sharing: the client needs Tailcat, not just a browser. It does not create a public HTTPS URL.
- Ctrl-C stops sharing/forwarding.

Port choices:
| Client command | Address on client | Destination on server |
|---|---|---|
| `tailcat forward TOKEN 0:3000` | Automatically chosen free port | Port 3000 |
| `tailcat forward TOKEN 3000` | `localhost:3000` | Port 3000 |
| `tailcat forward TOKEN 8080:3000` | `localhost:8080` | Port 3000 |

- **Remote port:** required; `forward TOKEN` alone isn't enough.
- **Multiple services:** server `tailcat serve 8080,3306`; client `tailcat forward TOKEN 18080:8080 3306`.
- **Port ranges:** serving accepts `8000-8999` or `all`; prefer only the ports needed.
- **Listener interface:** defaults to `127.0.0.1`. Use `tailcat forward --bind=0.0.0.0 TOKEN 8080:3000` only to let other machines access the client's listener.
- **Diagnostics:** `tailcat --verbose forward TOKEN 0:3000`.

## Send bytes or files
| Goal | Server command | Client command |
|---|---|---|
| Send text or a byte stream | `tailcat` | `printf 'hello\n' \| tailcat TOKEN` |
| Receive files into a drop box | `tailcat recv ~/inbox` | `tailcat cp report.pdf TOKEN:` |
| Offer current directory read-only | `tailcat serve files` | `tailcat ls -l TOKEN`, then `tailcat cp TOKEN:report.pdf .` |
| Allow uploads and downloads | `tailcat serve --files=/srv/share:rw files` | `tailcat cp -r photos TOKEN:photos` |

- **Lifetime:** plain `tailcat` accepts one connection and exits; `recv` stays available.
- **Drop box:** clients cannot list, download, or overwrite existing files.
- **Directories:** use `cp -r`. A receiving drop box needs `tailcat recv --accept-dirs ~/inbox` to accept directory trees. This permits directory creation and stat operations, revealing whether some names exist. Transfers aren't compressed.
- **File modes:** `:ro` (default), `:rw`, `:wo` (flat write-only), `:wo+` (recursive write-only).
- **Client dependency:** `cp` uses the system `scp`. Tailcat selects SFTP automatically with OpenSSH 8.7–8.9, which otherwise default to legacy SCP.
- **Raw TCP:** `tailcat TOKEN 8080` pipes stdin/stdout rather than creating a local listener.
- **Browser transfers:** the experimental [browser demo](https://tailscale.github.io/tailcat/) exchanges text/files with CLI peers; it is not a browser gateway to the served app.

## Get a shell or run a remote command
```sh
# Server: expose an existing SSH daemon, retaining its authentication.
tailcat serve 22
# Client:
tailcat ssh TOKEN
tailcat ssh TOKEN uname -a
```
| Client option | Command |
|---|---|
| Username | `tailcat ssh user@TOKEN` |
| Alternate SSH port | `tailcat ssh -p 2222 TOKEN` |

Without an existing daemon, run built-in SSH on the server with authorized keys:
```sh
tailcat serve --ssh-authorized-keys=~/.ssh/authorized_keys ssh
# Or authorize a GitHub account and a local public-key file:
tailcat serve --ssh-authorized-keys=bradfitz@github,./contractor.pub ssh
```
- GitHub keys are fetched at startup.
- Built-in authenticated SSH requires authorized keys; it does not support restrictions such as `command=` or `from=`.
- For deliberately disposable **unauthenticated SSH**, server: `tailcat serve --key=new no-auth-ssh`; client: `tailcat ssh TOKEN`. Anyone with the token can connect unless restricted by `--allow`.
- Built-in SSH supports SFTP unless a forced command is configured.

To offer one operation instead of a shell, set a server-side forced command:
```sh
# Server: every authenticated SSH session runs this command.
tailcat serve --ssh-authorized-keys=alice@github ssh -- ./deploy.sh
# Client:
tailcat ssh TOKEN
```
- Both `ssh` and `no-auth-ssh` accept a command after `--`. It replaces the shell and any client-selected command.
- A client can request a PTY. Its requested command, if any, is passed in `SSH_ORIGINAL_COMMAND`, not executed automatically.
- The command runs with the server process's privileges. Choose a command that exposes only the intended operation.

## Run a command for each connection
For a program that reads stdin and writes stdout, use the `exec` service:
```sh
# Server: run the supplied executable separately for each connection.
tailcat serve --key=new exec -- ./handler
# Client: send input and read the program's output.
printf 'hello\n' | tailcat TOKEN
```
- `./handler` is the executable you provide on the server. Connections to ports not otherwise served start a new process.
- The connection supplies stdin/stdout; stderr goes to the server's stderr.
- Both `exec` and SSH forced commands receive `TAILCAT_PEER_KEY` and `TAILCAT_REMOTE_ADDR`. The key uses the `nodekey:...` format accepted by `--allow`.
- Use `--allow` to restrict callers. Knowing an unrestricted server's token is enough to invoke its command.

## Reach remote services through SOCKS or an exit node
| Client goal | Command |
|---|---|
| Run a proxy-aware command | `tailcat socks TOKEN curl http://server.tailcat:8081/` |
| Run a standalone SOCKS proxy | `tailcat socks TOKEN` (`--listen` selects its listener) |
| Use the token as a hostname | `tailcat socks curl http://TOKEN:8081/` |

Token hostnames are unsuitable for browsers because browsers lowercase them.
To reach other hosts accessible from the server:
```sh
# Server:
tailcat serve exit-node
# Client: choose the access method needed.
tailcat socks TOKEN curl https://internal.example/
tailcat forward TOKEN 0:192.168.1.10:3000
tailcat ssh -p 192.168.1.10:22 TOKEN
```
- **Mapping:** `LOCAL_PORT:REMOTE_IP:REMOTE_PORT`; use `8080:192.168.1.10:3000` for a fixed local port.
- **UDP:** `socks` supports SOCKS5 UDP ASSOCIATE, and exit-node servers forward UDP as well as TCP. The application must support UDP ASSOCIATE; setting `all_proxy` alone does not tunnel arbitrary UDP traffic. `tailcat forward` creates TCP listeners only.
- **Scope:** exit-node mode grants broader network access than serving a single local port.

## Repeat access with saved identities
```sh
# Client: share the printed public key with the server operator.
tailcat genkey --client --key=client-default
# Server: save a stable identity and allow that client.
tailcat genkey --key=default --fixed-region
tailcat serve --allow=nodekey:CLIENT_PUBLIC_KEY 3000
```
- **Automatic identities:** server loads `default`; client loads `client-default`.
- **Temporary sharing:** `--key=new` avoids reusing a saved default.
- **Persistent access:** saved tokens remain reusable; use `--allow` for persistent or sensitive services.

| Key operation | Command or flag |
|---|---|
| List saved keys | `tailcat genkey --list` |
| Show effective client public key | `tailcat printpub` |
| Select a named key | `--key=NAME` |
| Delete an identity deliberately | `tailcat genkey --delete --key=NAME` |

For access by DNS name:
1. Publish a TXT record containing `tailcat=TOKEN`.
2. Substitute the DNS name for `TOKEN`, e.g. `tailcat ssh my-server.example.com`.

Use a fixed region for a published address and an allowlist because DNS exposes the token. `--region=list` lists regions; `--region=NAME` selects one.

For DNS-named SSH destinations, Tailcat first tries connecting with a fresh client identity and no SSH credentials. If the server accepts that login, Tailcat refuses to connect. Fix server authentication with `--allow` or `--ssh-authorized-keys` rather than bypassing the probe with `--skip-dns-safety-check`.

## Diagnose, automate, or customize
- `tailcat ping TOKEN` shows relay versus direct connectivity. `tailcat ping --until-direct --timeout=30s TOKEN` waits for a direct path. Both paths are encrypted; public relays are rate-limited and best-effort.
- `tailcat parse TOKEN` inspects an address; `tailcat resolve TOKEN` embeds relay details to avoid a client relay-map lookup. `tailcat serve --full-address 3000` prints that form directly. Treat address output as secret.
- For automation, server `--json` emits the address as JSON. `TAILCAT_ADDR_FILE=/path` writes it to a file; `TAILCAT_ADDR_FILE=tcp:host:port` sends it to a listener.
- For your own relay, follow the [DERP setup docs](https://github.com/tailscale/tailscale/tree/main/cmd/derper#derp), then generate an identity with `tailcat genkey --key=default --region=derp.example.com`. For a relay fleet, set `--derpmap-url=URL` or its default environment variable `TAILCAT_DERPMAP_URL` on both sides.
- For platform setup, consult the [installation guide](https://github.com/tailscale/tailcat/blob/v0.7.0/INSTALL.md). On Android, use the Linux binary for the device's architecture under Termux or `adb shell`; it uses Android's DNS resolver and certificate store.
- If an older peer cannot use a PSK-bearing token, consult the README's `--psk=false` compatibility option. It weakens protection; don't use it by default.

## Embed in your own program
For custom TCP/UDP clients or servers, use the Go package [`github.com/tailscale/tailcat`](https://pkg.go.dev/github.com/tailscale/tailcat).
