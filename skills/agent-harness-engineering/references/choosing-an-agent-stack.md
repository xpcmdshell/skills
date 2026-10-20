# Choose an agent stack

Resources for connecting real models and using existing agent SDKs, harnesses, and inference services.

**The user's requirements dictate the choice.** Ask the user about requirements and preferences that are not already established. Use these resources to inform that discussion, not to impose a default stack.

## Build a real integration

- Building an agent includes choosing an SDK or harness and connecting a model through a provider or gateway.
- Establish the user's model access and credential setup; do not silently replace missing access with canned responses or simulated tools.
- A provider SDK connects to inference. An agent harness supplies the loop and surrounding capabilities. They are different parts of the stack.

## Framework shortlist

| Framework | SDK languages |
| --- | --- |
| [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview) | Python; [TypeScript / JavaScript](https://docs.langchain.com/oss/javascript/deepagents/overview) |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | Python; [TypeScript / JavaScript](https://docs.langchain.com/oss/javascript/langgraph/overview) |
| [Pi SDK](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md) | TypeScript / JavaScript (Node.js or Bun) |
| [GitHub Copilot SDK](https://github.com/github/copilot-sdk) | TypeScript / JavaScript, Python, Go, .NET (C#), Java, Rust |
| [Pydantic AI](https://pydantic.dev/docs/ai/overview/) | Python |
| [Agno](https://docs.agno.com/sdk/introduction) | Python |
| [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) | TypeScript / JavaScript |
| [Mastra](https://mastra.ai/docs/agents/overview) | TypeScript / JavaScript |
| [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/overview) | .NET (C#), Python; [Go (public preview)](https://github.com/microsoft/agent-framework-go) |

- Languages refer to official agent SDKs, not remote-service clients or third-party ports. Features can differ between bindings.
- LangGraph is the more workflow-oriented option alongside Deep Agents.
- A custom harness is the last option when unusual or stringent requirements exceed existing frameworks and their extension points.

## Notable capabilities

- Most frameworks share the basic agent loop and tool calling. The distinctions below highlight less universal capabilities.
- These are selected examples, not an exhaustive support matrix.

### Programmatic tool calling

- Pi and Deep Agents offer QuickJS-based JavaScript tool orchestration. Pydantic AI offers Monty-backed Python code mode.
- See [code-mode integrations](code-mode.md#framework-and-harness-integrations) for optional packages, setup, and integration-specific limitations.

### Durable execution

- LangGraph, including its use beneath Deep Agents, supports checkpoint-based recovery with a configured checkpointer.
- Pydantic AI offers [multiple durable-runtime integrations](https://pydantic.dev/docs/ai/capabilities/durable_execution/overview), rather than requiring one execution backend.
- Microsoft Agent Framework's [Durable Extension](https://learn.microsoft.com/en-us/agent-framework/hosting/azure-functions) adds execution on Durable Task infrastructure.
- Vercel AI SDK agents can use [Workflow SDK](https://workflow-sdk.dev/docs/ai) for workflow-backed execution.
- Pi has [pi-durable](https://github.com/earendil-works/pi/tree/main/packages/durable); its APIs are experimental.
- See [durable execution](durable-execution.md) for the pattern and differences between recovery mechanisms.

### Embedding an existing CLI runtime

- Pi and GitHub Copilot SDK expose existing CLI agent runtimes, not only primitives for assembling a loop.
- Pi supports in-process TypeScript and [subprocess integration](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/cli-integration.md). Copilot provides bindings across several languages.

## Model choice

- Model choice is up to the user.
- Simple tasks can sometimes use Flash-tier models. More complex tasks may need a higher-capability model.
- Some models perform unusually well for their price in particular domains; a general tier ranking does not capture this.
- [GLM-5.3-Flash](https://huggingface.co/zai-org/GLM-5.3-Flash) and [MiMo-V2.6-Flash](https://mimo.mi.com/models/en-US/mimo-v2.6-flash) are examples to consider for code-security review, including vulnerability discovery.
- These are task-specific leads, not a universal model ranking.

## Inference providers and gateways

| Access path | Examples and meaningful differences |
| --- | --- |
| Direct model developer | [OpenAI](https://platform.openai.com/docs/quickstart), [Anthropic](https://platform.claude.com/docs/en/api/overview), [Google Gemini](https://ai.google.dev/gemini-api/docs/quickstart), and [Z.ai](https://docs.z.ai/guides/overview/quick-start): first-party access to their own model families and native features. |
| Multi-model inference host | [Fireworks serverless](https://docs.fireworks.ai/serverless/overview) and [Baseten Model APIs](https://docs.baseten.co/inference/model-apis/overview): hosted access to models developed elsewhere. |
| Hosted routing gateway | [OpenRouter](https://openrouter.ai/docs/quickstart) and [OrcaRouter](https://docs.orcarouter.ai/introduction): access multiple upstream providers through one integration, with routing and fallback controls. |
| Cloud model platform | Microsoft Foundry on Azure, Vertex AI on Google Cloud, and Amazon Bedrock on AWS; links below. |
| Adapter or self-hosted gateway | [LiteLLM](https://docs.litellm.ai/docs): an in-process Python adapter and a separately deployable proxy for routing and access controls. |

- These categories overlap. One vendor can offer hosting, routing, and direct model access.
- For example, [Fireworks FireRouter](https://docs.fireworks.ai/nexus/firerouter) combines Fireworks-hosted models with upstream models using supplied provider credentials.

### Cloud model platforms and dedicated deployments

| Cloud | Managed model access |
| --- | --- |
| Microsoft Azure | [Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview): catalog access to models from Microsoft and other developers, with model-dependent deployment options. |
| Google Cloud | [Vertex AI / Model Garden](https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models): Google and partner models, with managed API access or model deployment depending on the offering. |
| Amazon Web Services | [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html): managed access to foundation models from Amazon and other developers. |

- Custom or dedicated model hosting is also available through [Baseten deployments](https://docs.baseten.co/inference/overview), [SageMaker AI](https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model.html), and applicable Vertex AI and Foundry deployments.
- These services include both managed model APIs and deployments with configurable serving infrastructure.

### Subscription and pay-as-you-go access

- Some harnesses connect to provider subscriptions through supported login or coding-plan integrations. Others use metered API access.
- [Pi's provider guidance](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md) documents login, API keys, and provider-specific setup.
- [Z.ai's Coding Plan](https://docs.z.ai/devpack/faq) provides subscription access for supported tools through endpoints distinct from its standard API.
- Subscription access depends on the provider and integration; a consumer subscription does not automatically include general API usage.
- Multi-model hosts and routing gateways generally offer pay-as-you-go inference.
- [OpenRouter billing](https://openrouter.ai/docs/faq) uses credits for metered inference. [OrcaRouter](https://docs.orcarouter.ai/operations/billing-and-usage) separates usage charges from optional platform subscriptions.
