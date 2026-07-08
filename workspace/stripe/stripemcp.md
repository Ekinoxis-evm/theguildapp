
# Model Context Protocol (MCP)

Let your AI agents interact with the Stripe API by using our MCP server.

The Stripe Model Context Protocol (MCP) server provides a set of tools that AI agents can use to interact with the Stripe API and search our knowledge base (including documentation and support articles).

## Connect to Stripe’s MCP server

#### Cursor

[Install in Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=stripe&config=eyJ1cmwiOiJodHRwczovL21jcC5zdHJpcGUuY29tIn0%3D)

To open Cursor and automatically add the Stripe MCP, click install. Alternatively, add the following to your `~/.cursor/mcp.json` file. To learn more, see the Cursor [documentation](https://docs.cursor.com/context/model-context-protocol).

```json
{
  "mcpServers": {"stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

#### Claude Code

To add MCP to Claude code, run the following command. To learn more, see the Claude Code [documentation](https://docs.anthropic.com/en/docs/claude-code/mcp#configure-mcp-servers).

```bash
claude mcp add --transport http stripe https://mcp.stripe.com/
```

After adding the server to Claude, you must authenticate with Stripe.

```bash
claude /mcp
```

#### ChatGPT

You can enable MCP servers on ChatGPT if you have a Pro, Plus, Business, Enterprise or Education account. Follow the [OpenAI documentation](https://platform.openai.com/docs/guides/developer-mode) for instructions. Use the following parameters when setting up your custom connector:

- The server url is `https://mcp.stripe.com`.
- Use “OAuth” as the connection mechanism.

Stripe’s MCP server also works with OpenAI’s response API, when building [autonomous agents](https://docs.stripe.com/mcp.md#agents).

#### Other

### VS Code

[Install in VS Code](https://vscode.dev/redirect/mcp/install?name=stripe&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.stripe.com%22%7D)

To open VS Code and automatically add the Stripe MCP, click install. Alternatively, add the following to your `.vscode/mcp.json` file in your workspace. To learn more, see the VS Code [documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers).

```json
{
  "servers": {"stripe": {
      "type": "http",
      "url": "https://mcp.stripe.com"
    }
  }
}
```

### Custom

MCP is an open protocol supported by many clients. Your specific client documentation can advise you how to connect. Use the server url `https://mcp.stripe.com` and “OAuth” as the connection mechanism if possible. If your MCP client doesn’t support OAuth, you can pass in a [restricted API key](https://docs.stripe.com/keys.md#create-restricted-api-key) in the `Authorization` header as a Bearer token. For example, a client might accept the following header property:

```json
{
  "stripe": {
    "url": "https://mcp.stripe.com",
    "headers": {
      "Authorization": "Bearer <<YOUR_SECRET_KEY>>"
    }
  }
}
```

After installing, you can manage MCP client sessions in your Dashboard settings.

### Manage MCP client sessions

The Stripe MCP server uses OAuth to connect MCP clients according to the [MCP spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization#2-1-1-oauth-grant-types). OAuth is more secure than using your secret key because it allows more granular permissions and user based authorization. When you add the Stripe MCP to a client, the MCP client opens an OAuth consent form which allows you to authorize the client to access your Stripe data.

To view authorized OAuth client sessions navigate to your [user settings](https://dashboard.stripe.com/settings/user) in the Stripe Dashboard. If you’ve authorized an MCP client, it’ll show under **OAuth sessions**. To revoke OAuth access for a specific MCP client session:

1. Scroll to the OAuth sessions section in your [user settings](https://dashboard.stripe.com/settings/user).
2. Find the client sessions in the list, and click the overflow menu.
3. Select **Revoke access**.

### Manage MCP access

Administrators can [enable MCP access](https://dashboard.stripe.com/settings/mcp) in the Dashboard. Access is managed separately between sandbox and live mode environments.

### Building autonomous agents

If you’re building agentic software, you can pass a Stripe API key as a bearer token to the MCP remote server. We strongly recommend using [restricted API keys](https://docs.stripe.com/keys/restricted-api-keys.md) to limit your agent’s access to exactly the functionality it requires. For example, you can use this authorization method with [OpenAI’s Responses API](https://platform.openai.com/docs/guides/tools-remote-mcp#authentication).

Don’t embed restricted or secret API keys in code. Instead, provide API keys to your agent through a secrets vault or environment variable. To learn how to manage keys safely, see [best practices for managing secret API keys](https://docs.stripe.com/keys-best-practices.md).

```bash
curl https://mcp.stripe.com/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -d '{
      "jsonrpc": "2.0",
      "method": "tools/call",
      "params": {
        "name": "create_customer",
        "arguments": {"name": "Jenny Rosen", "email": "jenny.rosen@example.com" }
      },
      "id": 1
  }'
```

## Tools

The server exposes the following [MCP tools](https://modelcontextprotocol.io/docs/concepts/tools). We recommend enabling human confirmation of tools and exercising caution when using the Stripe MCP with other servers to avoid prompt injection attacks. If you have feedback or want to see more tools, email us at [mcp@stripe.com](mailto:mcp@stripe.com).

| Resource                          | Tool                                                                                                                                         | Description                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **API tools**               | `stripe_api_search`                                                                                                                        | Search for Stripe API methods by keyword                            |
| `stripe_api_details`            | Get detailed parameter information for a specific Stripe API method.                                                                         |                                                                     |
| `stripe_api_read`               | Read data with any Stripe API`GET` method                                                                                                  |                                                                     |
| `stripe_api_write`              | Write data with any Stripe API`POST`, `PATCH`, `PUT` and `DELETE` method                                                             |                                                                     |
| **Account**                 | `get_stripe_account_info`                                                                                                                  | [Retrieve account](https://docs.stripe.com/api/accounts/retrieve.md) |
| **Refund**                  | `create_refund`                                                                                                                            | [Create refund](https://docs.stripe.com/api/refunds/create.md)       |
| **Others**                  | `search_stripe_resources`                                                                                                                  | [Search Stripe resources](https://docs.stripe.com/search.md)         |
| `fetch_stripe_resources`        | Fetch Stripe object                                                                                                                          |                                                                     |
| `search_stripe_documentation`   | Search the Stripe documentation for the given question and language                                                                          |                                                                     |
| `stripe_implementation_planner` | Guides the user through Stripe products to help users accept payments, sell products online, set up billing, or build any Stripe integration |                                                                     |
| `send_stripe_mcp_feedback`      | Submit feedback from user or agent about Stripe’s MCP server tools                                                                          |                                                                     |
| `stripe_report`                 | Search, retrieve and create reports and report runs                                                                                          |                                                                     |

The Stripe MCP server exposes multiple APIs that you can call with the `stripe_api_read` and `stripe_api_write` tools. This access makes much of the API available through MCP without increasing the context window unnecessarily.

### Supported API methods

- [List all customers](https://docs.stripe.com/api/customers/list.md)
- [Retrieve a customer](https://docs.stripe.com/api/customers/retrieve.md)
- [Create a customer](https://docs.stripe.com/api/customers/create.md)
- [List all charges](https://docs.stripe.com/api/charges/list.md)
- [Retrieve a charge](https://docs.stripe.com/api/charges/retrieve.md)
- [List all refunds](https://docs.stripe.com/api/refunds/list.md)
- [Create refund](https://docs.stripe.com/api/refunds/create.md)
- [List all PaymentIntents](https://docs.stripe.com/api/payment_intents/list.md)
- [Retrieve a PaymentIntent](https://docs.stripe.com/api/payment_intents/retrieve.md)
- [List all Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/list.md)
- [Retrieve a Checkout Session](https://docs.stripe.com/api/checkout/sessions/retrieve.md)
- [List all invoices](https://docs.stripe.com/api/invoices/list.md)
- [Retrieve an invoice](https://docs.stripe.com/api/invoices/retrieve.md)
- [Create an invoice](https://docs.stripe.com/api/invoices/create.md)
- [Finalize an invoice](https://docs.stripe.com/api/invoices/finalize.md)
- [Create an invoice item](https://docs.stripe.com/api/invoiceitems/create.md)
- [List subscriptions](https://docs.stripe.com/api/subscriptions/list.md)
- [Retrieve a subscription](https://docs.stripe.com/api/subscriptions/retrieve.md)
- [Update a subscription](https://docs.stripe.com/api/subscriptions/update.md)
- [Cancel a subscription](https://docs.stripe.com/api/subscriptions/cancel.md)
- [List all coupons](https://docs.stripe.com/api/coupons/list.md)
- [Retrieve a coupon](https://docs.stripe.com/api/coupons/retrieve.md)
- [Create a coupon](https://docs.stripe.com/api/coupons/create.md)
- [Update a coupon](https://docs.stripe.com/api/coupons/update.md)
- [Delete a coupon](https://docs.stripe.com/api/coupons/delete.md)
- [List all promotion codes](https://docs.stripe.com/api/promotion_codes/list.md)
- [Create a promotion code](https://docs.stripe.com/api/promotion_codes/create.md)
- [List all products](https://docs.stripe.com/api/products/list.md)
- [Create a product](https://docs.stripe.com/api/products/create.md)
- [Update a product](https://docs.stripe.com/api/products/update.md)
- [List all prices](https://docs.stripe.com/api/prices/list.md)
- [Retrieve a price](https://docs.stripe.com/api/prices/retrieve.md)
- [Create a price](https://docs.stripe.com/api/prices/create.md)
- [Update a price](https://docs.stripe.com/api/prices/update.md)
- [List all payment links](https://docs.stripe.com/api/payment_links/list.md)
- [Retrieve payment link](https://docs.stripe.com/api/payment_links/retrieve.md)
- [Retrieve a payment link’s line items](https://docs.stripe.com/api/payment_links/line_items.md)
- [Create a payment link](https://docs.stripe.com/api/payment_links/create.md)
- [Update a payment link](https://docs.stripe.com/api/payment_links/update.md)
- [List all disputes](https://docs.stripe.com/api/disputes/list.md)
- [Update a dispute](https://docs.stripe.com/api/disputes/update.md)
- [List portal configurations](https://docs.stripe.com/api/billing_portal/configurations/list.md)
- [Retrieve balance](https://docs.stripe.com/api/balance/retrieve.md)

## Support for connected accounts

Connect platforms can make MCP calls as their connected accounts. However, you can’t use OAuth. Instead, use [restricted access keys](https://docs.stripe.com/keys/restricted-api-keys.md#create-a-restricted-api-key) with the appropriate Connect permissions.

To make an MCP call as a connected account, pass the `Stripe-Account` header. This is useful when you provide an agent that allows your connected accounts to make MCP calls through your platform.

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com",
      "headers": {
         "Authorization": "Bearer rk_.....",
         "Stripe-Account": "acct_xxxxxxxxx"
      }
    }
  }
}
```

## Agentic finance with Treasury

You can extend the Stripe MCP server with Treasury tools that let your AI agent move money, pay bills, and create and manage cards.

### Interested in agentic finance with Treasury?

Enter your email to request access.

```bash
curl https://docs.stripe.com/preview/register \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Referer: https://docs.stripe.com/mcp" \
  -d '{"email": "EMAIL", "preview": "agentic_treasury_preview"}'
```

## See also

- [Build on Stripe with AI](https://docs.stripe.com/agents.md)
- [Stripe skills](https://docs.stripe.com/skills.md)
