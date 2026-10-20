# Authoritative contracts and discoverable change impact

## Inspect

Distinguish three sources of truth:

- **Intent:** what users and maintainers want.
- **Contract:** what supported consumers are promised.
- **Observation:** what implementation and tests currently do.

They can disagree. Existing behavior is not automatically a requirement; a new preference does not silently erase an existing supported contract. Identify the authority and ask the user to resolve consequential conflicts.

For capabilities relevant to intended work, locate:

- Public interfaces and known consumers, including downstream uses outside the checkout when discoverable.
- Persisted formats, configuration contracts, generated artifacts, and their actual source of truth.
- Supported environments and dependency constraints.
- Compatibility and migration expectations, if those changes are intended.
- Verification that distinguishes expected behavior from whatever the current implementation happens to return.

Use code references, manifests, schemas, generated-code headers, existing docs, and ecosystem tooling. Do not require a manually maintained inventory when relationships are already discoverable. Unknown external consumers remain a stated limitation.

## Remediate after approval

- Establish concise product and contract guidance where important expectations are missing.
- Document who owns consequential decisions and which contract changes require discussion.
- Expose supported interfaces and hide implementation coordination where needed; use the [architecture guide](architecture.md).
- Add meaningful integration checks against authoritative fixtures, expected outcomes, or supported consumer environments.
- Document generation commands instead of teaching agents to edit generated output manually.
- Define migration/compatibility expectations only when relevant and agreed. Do not add legacy support to hedge against unspecified consumers.

For example, suppose a library promises a documented file format. A writer-reader round trip can pass when both implementations make the same mistake. An independently produced fixture provides evidence about that format contract. This principle does not require external fixtures for every internal operation.

## Concrete outputs by gap

| Demonstrated gap | Approved implementation |
| --- | --- |
| Supported environments unclear | Agree the supported set; record it in existing project metadata/guidance and wire relevant integration checks into the existing matrix |
| Persisted format expectations implicit | Document the supported contract; add independent representative fixtures and public-API read/write checks |
| Generated output edited manually | Add/document the authoritative generator command and check regeneration through normal validation |
| Compatibility policy absent for planned API changes | Agree which consumers and transitions are supported; document that decision and verify those actual boundaries |

Inspect existing facilities before adding parallel files or commands. A policy still awaiting a user decision cannot be replaced with guessed compatibility code.

## Verify preparation

- Trace a representative proposed change from its public contract to discoverable consumers and relevant checks.
- Confirm that an unfamiliar contributor can find the authoritative expectation without reconstructing development history.
- Execute the approved contract checks and identify untested consumer environments. Feature work affecting a supported runtime remains subject to that contract even when releases are outside scope. Changing the supported range requires an explicit decision, not omission from assessment.
- Confirm docs identify unresolved expectations rather than presenting guesses as policy.

The assessment prepares impact analysis for later changes. It does not perform speculative upgrades, migrations, or broad compatibility rewrites.
