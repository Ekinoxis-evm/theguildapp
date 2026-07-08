
# Agent skills

Install instructions that help AI agents create more accurate Stripe integrations.

[Agent skills](https://agentskills.io/home) are instructions that agents can use to build faster and more accurately. Stripe offers a collection of skills that help your agents use the latest best practices when building with Stripe.

## Agent plugins (Recommended)

If you use one of these popular agent harnesses, we recommend installing the official Stripe plugins, which include additional agent tools and update automatically.

### Claude Code

Run this command in your project:

```bash
claude plugin install stripe@claude-plugins-official
```

### Codex

Run this command in your project:

```bash
codex plugin add stripe@openai-curated
```

### Cursor

Run this command in your project:

```bash
/add-plugin stripe
```

You can also install through the [Cursor marketplace](https://cursor.com/marketplace/stripe).

## Manual installation

> Manually installed skills don’t auto-update. Run `npx skills update -y` to get the latest versions.

Run this command in your project:

```bash
npx skills add https://docs.stripe.com
```

## Skills index

The index of Stripe skills is available at [https://docs.stripe.com/.well-known/skills/index.json](https://docs.stripe.com/.well-known/skills/index.json.md).

## See also

- [Stripe MCP](https://docs.stripe.com/mcp.md)
- [Stripe CLI](https://docs.stripe.com/stripe-cli.md)
