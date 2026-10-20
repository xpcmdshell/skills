# Example README templates

These are editorial outlines, not required schemas. Bracketed labels describe project-specific content to supply; they are not publishable placeholders. Omit sections that do not earn their space. A project's strongest demonstration determines the order.

## A. Library or SDK: show the API's payoff

```text
# Project name
[Optional compact badges]

[One sentence: what it does and the useful distinction.]
[Documentation link] · [Examples link]

[Focused code example demonstrating why the product is useful.]
[Its observed output, image, or a short explanation of the intended result.]

## Try it
[One recommended installation command.]
[How to run the example, with prerequisites if not already obvious.]

## What you can build
### [Distinctive capability expressed as an outcome]
[One or two sentences. A focused snippet or screenshot if it adds proof.]
[Link to the corresponding guide.]

### [Second capability, only if the first example doesn't cover it]
[Same idea, without forcing identical formatting.]

## Learn more
[Getting started] · [Examples] · [API reference]

## Contributing
[Short invitation and link.]

[License link or short license statement.]
```

A defining snippet can precede installation when readers need to see the API before deciding to try it. If the snippet needs significant setup, show a smaller conceptual preview and put the complete runnable example after installation. Label previews honestly.

### Concrete precedent: Rich

Rich's API can demonstrate its point in two lines:

```python
from rich import print

print("Hello, [bold magenta]World[/bold magenta]!")
```

A rendered terminal image makes the formatting visible; the selectable code makes it reproducible. Its README also provides `python -m rich` as a direct demonstration after installation. The useful pattern is **small API → visible result**, not “every library needs an enormous screenshot.”

Source: [Rich README](https://github.com/Textualize/rich/blob/main/README.md).

## B. CLI: show an input becoming a useful result

```text
# Project name
[Optional compact badges]

[What task the command performs and why this tool is distinctive.]
[Documentation link]

[Short terminal demonstration, or a legible screenshot when styling matters.]
[One-sentence context: what changed or what work disappeared.]

## Install and try
[Recommended install command.]
[A command using built-in data or a tiny fixture created in the instructions.]
[Recognizable expected result.]
[Link to other installation methods.]

## A few things it can do
[Two or three independent examples with descriptive headings.]
[Link each to detailed usage rather than listing every flag.]

## Documentation
[User guide] · [Configuration] · [Troubleshooting]

[Contribution and license links.]
```

Keep runnable shell input separate from long sample logs. A command that requires an unexplained local file is not a first-run example. Avoid benchmarking with invented numbers or presenting one microbenchmark as universal superiority.

### Concrete precedent: uv

The uv README pairs an ephemeral tool command with its visible output:

```bash
uvx pycowsay 'hello world!'
```

This demonstrates “run a packaged tool without managing an environment” in one action. Its opening performance chart is also relevant to its speed claim, with a workload caption and a benchmark link. Borrow the connection between claim and evidence; do not copy its broad feature catalogue into a narrow-purpose tool.

Source: [uv README](https://github.com/astral-sh/uv/blob/main/README.md).

## C. Visual application: make the experience legible

```text
[Project name or compact existing wordmark]
[Optional purposeful badges]

[Plain-language identity and benefit.]
[Try the live app] · [Documentation]

[One representative screenshot or short demo.]
[Caption explaining the task or result, not repeating “screenshot.”]

## Try it
[Live app if available and appropriate.]
[Minimal supported local path if local use is a principal audience need.]
[Clearly distinguish using the app from setting up a development checkout.]

## Why use it
[Selected capabilities tied to concrete tasks.]
[Additional visuals only when they demonstrate something new.]

## Learn more
[User guide] · [Self-hosting or integration guide, if relevant]

[Contribution, community, and license links.]
```

Do not force an installation ceremony when the product can be tried in a browser. Conversely, do not present a paid hosted service as the only first step for a project whose primary promise is local use. Make resource requirements or charges visible before starting downloads or services.

## D. Small utility: a complete README can be very short

```text
# Project name

[What it does and the situation it helps with.]

## Usage
[Install command.]
[One real example with its result.]

[One material limitation, if needed.]
[Links to further usage, contributing, and license.]
```

Do not manufacture a hero, feature grid, badges, architecture diagram, FAQ, or table of contents for a tool adequately explained by one example.

## Choosing and combining

- Library with visual output: A with a screenshot as evidence.
- CLI with a strong performance advantage: B with a captioned, reproducible benchmark near the opening.
- Developer platform: lead with one representative end-to-end task, not the internal component inventory. Expand into a few capability examples only after the first success is clear.
- Mixed library/application: identify the principal audience, then link the secondary path. Avoid interleaving two installation stories sentence by sentence.

These are patterns to reason from, not excuses to fill every heading. Review the completed page as a reader, not as a template-completion checklist.
