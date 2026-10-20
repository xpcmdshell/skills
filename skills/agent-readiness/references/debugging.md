# Debugging from direct evidence

Prepare agents to inspect execution and state instead of guessing from final behavior. Bisection can narrow a failure, but should not replace available direct evidence.

## Assess

Choose a relevant failure and inspect its reproduction path, errors, logs, debugger access, and test artifacts. Determine whether diagnostics identify the operation and relevant state without exposing secrets.

Trace diagnostic signals to their consumers. A parser can generate useful warnings that application callers never expose. An empty result may conceal either no matches or failed processing; establish the intended contract before judging correctness.

Check whether another agent can use the evidence without the originating conversation: revision, inputs, environment, command, and diagnostic location should be discoverable where relevant.

## Recommend and improve

For opaque failures, propose a reusable reproduction fixture plus contextual errors or logging at the boundary where information is lost. Use existing debugger and logging facilities before adding infrastructure.

For example, an importer may need to distinguish rejected records from an empty source. A public-API integration check with representative inputs, a preserved parse error, and safe source identifiers can establish that distinction. Agree consumer-visible contract changes first.

Add concise, tested instructions for reproduction and inspecting relevant state. Where interrupted work matters, provide reproducible intermediate state. Keep diagnostics separate from machine-readable product output when that output is a public contract.

## Verify

Write the relevant integration check before changing behavior. Reproduce the failure safely and inspect the actual evidence. Confirm it reaches the caller and distinguishes the failure from nearby alternatives.

Execute the documented diagnostic path where possible. Missing access is an unknown, not evidence that a logging configuration works. Avoid diagnostic platforms or incident journals unrelated to the project's needs.
