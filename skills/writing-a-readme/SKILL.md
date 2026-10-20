---
name: writing-a-readme
description: Use when creating a project README or revising an existing one.
---

# Writing a README

## Purpose

Help a newcomer understand what the project is, why it is useful to them, what using it looks like, and how to reach a first success. Then give them a clear path to learn more.

The README is not a compressed manual. Optimize for comprehension and informed action, not the amount of information included or an arbitrary word count. Beauty comes from hierarchy, proportion, concrete evidence, and restraint—not decorative scaffolding.

## Start with the project, not a template

Before writing:

1. Read the existing README, package/install metadata, a representative working example, and documentation navigation. Preserve the author's voice and useful material.
2. Identify the intended reader, their problem, the project's distinctive benefit, and its simplest meaningful result. Ground claims in code, documentation, or observed behavior.
3. Choose the evidence that makes the benefit apparent: executable code for an API, input/output for a CLI, a screenshot for an interface, a measured chart for a performance claim.
4. Inventory existing assets and documentation destinations. Reuse them where suitable. Do not invent badges, screenshots, links, benchmarks, or shipped capabilities. Clearly distinguish illustrative material from shipped functionality or observed evidence.
5. Sketch the reader journey and identify material to move before editing. If the project or audience is genuinely ambiguous, ask a focused question.

Use [templates.md](templates.md) as adaptable outlines, not mandatory section lists. Consult [references.md](references.md) for concrete precedents and their tradeoffs.

## Reader journey

The usual progression is:

**Identity and value → concrete proof → first success → selected capabilities → deeper documentation.**

Order is flexible. A visual application may lead with a live demo; a library may show its defining snippet before installation. Installation should not be buried beneath an exhaustive feature catalogue. Returning readers should be able to find the documentation link near the opening.

### Identity and value

Use the project name and a direct sentence describing what it does. Add the distinguishing benefit or relevant audience if that clarifies the choice. Do not require the reader to know internal architecture first.

Position the project accurately. Choose language that gives the intended reader the right mental model, rather than a catchy description that implies a different product.

Prefer concrete subjects and verbs over claims such as “powerful,” “seamless,” “revolutionary,” or “production-ready.” Technical terms are welcome when they communicate something specific; unexplained project-specific terminology is not.

### Proof before inventory

Show the core benefit rather than listing every subsystem. A useful feature demonstration has a clear punchline: one capability, a small example or image, and the visible result or consequence.

Prefer a few distinctive capabilities to a complete catalogue. Each subsection should answer “why would I use this?” rather than merely announce that an API exists. Do not force a Features section when the first example already makes the case.

Choose demonstrations that make the project’s value apparent to its intended reader. Show a representative task and the benefit the project brings to it. Complexity is not the goal: include enough context to make the benefit visible, and remove detail that distracts from it.

Distinguish demonstration from onboarding. A demonstration helps readers understand the value; a first-run exercise helps them experience it. One example can do both, but need not. Illustrative scenarios are acceptable when clearly identified; instructions presented as runnable must work as written. Never present hypothetical results as observed evidence.

### First success

Give one recommended path from a clean, supported environment to a meaningful result. Include necessary setup and show what success looks like. Use working install commands, complete imports, and real entrypoints. Separate copyable commands from illustrative output when mixing them would make copying error-prone.

Avoid presenting every setup choice before the reader reaches a first success. Include additional paths only when essential to the primary audience; link the rest to installation documentation.

State prerequisites that affect the reader's actions. Do not repeat package metadata that the recommended installer already handles unless it prevents a likely misunderstanding. Describe ordinary constraints neutrally. Give risks prominence proportional to their consequences and relevance to the reader’s next action. Preserve information needed for an informed choice without repeating defensive disclaimers.

### Deeper learning

Offer a small set of descriptive links: Getting started, Examples, Configuration, API reference, Contributing, or equivalent destinations that actually exist. Keep advanced configuration, flag matrices, policy mechanics, deployment instructions, exhaustive lifecycle rules, and troubleshooting in organized docs.

When moving useful content, preserve it in an appropriate real destination and update links. Do not delete it merely to make the README shorter. If docs do not yet exist, propose or create scoped documentation when authorized—never link to imaginary pages. Avoid teaching the same contract independently in multiple places.

## Writing and organization

- Give each section a purpose and each paragraph one subject. Arrange related ideas in a sequence the reader can follow; do not group facts merely because they were implemented together.
- Use headings readers can scan for outcomes or familiar concepts. Avoid implementation-oriented headings unless the architecture itself is the selling point.
- Keep paragraphs short enough to scan, but do not turn connected explanations into choppy fragments.
- Use lists for parallel benefits or steps; tables for genuinely comparable choices, not for wrapping prose or code into narrow columns.
- Keep terminology and example names consistent. Explain abstractions through an example before relying on their names.
- Bold sparingly to establish hierarchy. Avoid bolding every bullet label, excessive callouts, repeated horizontal rules, and emoji as a compulsory heading system.
- Describe the current product rather than narrating its implementation history. Put migration details in migration documentation.
- Calibrate explanation to the intended audience. Use familiar concepts directly, explain unfamiliar ones when needed, and avoid restating what the audience already understands.
- Write with calm confidence. State what the product does and the relevant tradeoff directly; remove nervous qualifiers, repetitive negations, and defensive asides. Confidence must come from accurate claims, not from hiding limitations.
- Preserve personality. Clarity does not require generic marketing copy or the same headings in every project.

## Visual design

### Opening composition

Aim for a compact opening containing identity, value, optional trust signals, and useful links. Keep the explanatory copy and main body left-aligned for scanning. A centered logo or short link row is optional, not a default requirement.

Badges should answer real questions: release/package version, build health, license, compatibility, or a maintained community destination. Use a small, purposeful set with working links. Stars, download counters, social badges, and sponsorship are optional signals, not evidence of correctness. Do not stack badge walls ahead of the explanation.

A hero image should earn its space. Prefer a legible product screenshot, terminal result, diagram, or benchmark demonstrating the core value. A large logo or decorative banner is not a substitute for showing the product. A plain text-and-code opening is often the right design for an API library.

### Assets and readability

- Crop screenshots to the relevant result; remove unrelated browser or desktop chrome. Keep enough context to explain what is being shown.
- Check text legibility at rendered README width, not only in the full-resolution source image. Avoid tall screenshots that delay the next useful action without adding information.
- Provide descriptive alt text and an adjacent caption when needed. Essential information must also exist as selectable text; do not publish runnable code only as an image.
- Check light and dark backgrounds. Use an appropriate background or theme-specific assets when a transparent graphic loses contrast.
- Prefer a still image to animation unless motion demonstrates the feature. Keep animations focused and non-flashing, and provide a still or textual equivalent.
- Use ordinary Markdown first. Add small amounts of GitHub-supported HTML only when needed, such as theme-aware pictures or controlled image sizing. Avoid fragile layout tables and custom styling that GitHub strips.
- Give visuals consistent sizing and breathing room. Do not alternate alignment or decorative treatments without a reason.

## Review and verification

Review the rendered README, not just its Markdown. Check the actual GitHub presentation when available, or state the limitations of the preview. Inspect a narrow viewport and both themes when assets or layout make those relevant. Check heading hierarchy, broken images, alt text, badge wrapping, code overflow, table width, and the distance between the explanation and first useful action.

For a new or changed runnable quickstart, exercise that path in an isolated environment when safe and authorized. Record the actual result. Never invent successful output. For prose-only changes, review text and links without running unrelated behavioral tests or builds.

Use this final checklist:

- Can a newcomer explain what the project does and why they might want it?
- Does the first proof demonstrate the stated benefit?
- Is there one obvious way to try it, with a recognizable success result?
- Are prerequisites and material risks visible at the right point?
- Does each section address one reader need without abrupt topic changes?
- Are all badges, images, claims, commands, and links grounded and useful, and are hypothetical examples clearly distinguished from runnable ones?
- Does the pitch establish an accurate mental model, and do the demonstrations make the benefit apparent?
- Is the tone confident and direct, with proportionate risk communication and no remedial explanation of familiar concepts?
- Does the page remain readable without images and on a narrow display?
- Can interested readers find deeper guidance without the landing page becoming that guidance?

Deliver the revised README or requested draft, explain only consequential editorial choices, identify relocated material, and report precisely what was verified. A research or template request is not authorization to rewrite the user's project.
