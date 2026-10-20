# README exemplars and tradeoffs

Research snapshot: 2026-09-07. These are living project links, not immutable specimens or a ranking. Popularity does not prove that a layout caused adoption. Borrow specific techniques; do not treat every choice in a successful repository as best practice.

README source was inspected for all seven projects. GitHub-rendered desktop views were additionally inspected for uv, Rich, and Excalidraw, and a 390px-wide view for Excalidraw. No light-theme rendering audit was performed. Other visual observations below refer to source structure or linked assets, not a complete rendered audit.

## uv: make the main claim visible

[README](https://github.com/astral-sh/uv/blob/main/README.md)

The opening places a small badge row and a direct product sentence above a benchmark chart. Its caption identifies the workload, and the speed claim links to benchmark details. Installation precedes a larger feature tour. Projects, scripts, tools, and Python management each get concrete command/output examples with links to the corresponding guide.

**Borrow:** claim → evidence → executable examples → deeper guide. The rendered chart is compact relative to the surrounding text; it is relevant evidence, not merely a banner.

**Adapt:** the numerous highlights, installation alternatives, and long feature tour reflect a broad tool suite. A focused library need not inherit that length. Never copy benchmark numbers or omit the conditions that give them meaning.

## Rich: show what the library produces

[README](https://github.com/Textualize/rich/blob/main/README.md)

A logo, identity statement, and terminal screenshot introduce the library. Installation is followed by `python -m rich`, then small API examples paired with output images. Much of the later feature catalogue uses collapsible sections and links to dedicated documentation.

**Borrow:** a direct demonstration command and code paired with its visible result. Terminal styling is a feature for which screenshots genuinely explain more than a prose list.

**Adapt:** the rendered opening also spends considerable space on branding and translation links. The large screenshot catalogue suits a rendering library but would burden a nonvisual SDK. Collapsibles can support optional detail; they should not become a disguised replacement for organized docs.

## FastAPI: let one example reveal several benefits

[README](https://github.com/fastapi/fastapi/blob/master/README.md)

A typed route example progresses through installation, starting the server, observing a JSON response, and opening generated interactive documentation. An expanded example introduces request-body validation. Documentation links appear near the opening and throughout the walkthrough.

**Borrow:** one coherent example can demonstrate ergonomics, execution, and generated tooling without separate abstract pitches for each subsystem.

**Adapt:** sponsor, testimonial, and related-product sections before installation interrupt the first-run path. Their presence in a popular project is not a reason to reproduce that ordering. Site-specific terminal markup may not provide the same experience on GitHub.

## Excalidraw: identity, direct trial, then product proof

[README](https://github.com/excalidraw/excalidraw/blob/master/README.md)

A theme-aware illustrated hero and navigation links lead to a clear identity statement and a product screenshot. The live editor is directly accessible. Later material distinguishes integrating the package from developing the repository.

**Borrow:** a real product image and immediate live-app link; explicitly separate user, integrator, and contributor paths. Branding can express the product's character without replacing its explanation.

**Adapt:** the narrow rendered view shows how badge rows wrap and a detailed screenshot shrinks. The screenshot still communicates the type of application, but its tiny labels cannot carry essential instructions. Social badges and sponsor material should be deliberate choices, not standard template components.

## Ollama: action without a badge wall

[README](https://github.com/ollama/ollama/blob/main/README.md)

The opening uses a small brand image, a short value statement, and platform installation paths rather than a badge row. CLI examples lead into API and language-library examples, with documentation handoffs.

**Borrow:** a page can be distinctive and approachable without ornamental status signals. Executable examples can carry the explanation when screenshots are not essential.

**Adapt:** model downloads have resource implications, and installation choices and ecosystem lists can grow large. Keep first-run prerequisites visible and route expansive integration catalogues to deeper documentation.

## bat: pair capabilities with concrete output

[README](https://github.com/sharkdp/bat/blob/master/README.md)

A logo, badges, a concise identity statement, and in-page navigation introduce a screenshot-led feature tour. Usage includes the small `bat README.md` example. Installation, integrations, customization, and troubleshooting make the rest of the document substantial.

**Borrow:** feature-specific visual proof and an understandable one-command example.

**Adapt:** the README also functions as a manual, with a large platform matrix and many operational recipes. That is not the landing-page scope preferred for this skill. External screenshot hosting adds maintenance risk; source image labels were inspected, but those screenshots were not visually verified in this research.

## ripgrep: establish behavior and support claims

[README](https://github.com/BurntSushi/ripgrep/blob/master/README.md)

The opening identifies recursive regex search and important default behavior, then provides documentation quick links, a screenshot, comparative benchmarks, and reasons to choose or not choose the tool. Installation covers many platforms and package managers.

**Borrow:** precise positioning, easy-to-find documentation, and contextual evidence instead of unsupported superlatives. A material limitation can help the right users choose the project.

**Adapt:** the benchmark tables and installation matrix delay a minimal first run. Put extensive comparisons, packaging branches, build steps, and implementation explanations in linked docs when the desired README is a landing page.

## Synthesis

There is no single “popular-project README style.” The useful commonality is a relationship between the promise and the proof. Visual products demonstrate appearance; APIs demonstrate a small useful program; CLIs demonstrate a command and its result. Good design makes that evidence legible and the next action obvious.

The skill's landing-page boundary is an explicit editorial choice, not a claim that every successful project already follows it. The references offer techniques and counterexamples, not authority for copying entire structures.
