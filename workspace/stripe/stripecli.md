
# Install the Stripe CLI

Install the Stripe CLI on macOS, Windows, or Linux.

The Stripe CLI lets you build, test, and manage your integration from the command line. You can use the Stripe CLI to:

- Register and get test API keys directly from the terminal, without signing up in a browser.
- Create, retrieve, update, or delete any of your Stripe resources in a sandbox.
- Stream real-time API requests and events happening in your account.
- Trigger events to test your webhooks integration.
  [Watch on YouTube](https://www.youtube.com/watch?v=iFwBGI-kqeE)
  For more details, see the [Stripe CLI reference](https://docs.stripe.com/cli.md).

## Install the Stripe CLI

From the command line, use an install script or download and extract a versioned archive file for your operating system to install the CLI.

#### npm

To install the Stripe CLI with [npm](https://www.npmjs.com/), run:

```bash
npm i -g @stripe/cli
```

#### homebrew

To install the Stripe CLI with [homebrew](https://brew.sh/), run:

```bash
brew install stripe
```

#### apt

The Debian build for the CLI is available on [JFrog](https://packages.stripe.dev), which isn’t a domain owned by Stripe. When you visit this URL, it redirects you to the Jfrog artifactory list.

To install the Stripe CLI on Debian and Ubuntu-based distributions:

1. Add Stripe CLI’s GPG key to the apt sources keyring:

   ```bash
   curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null
   ```
2. Add CLI’s apt repository to the apt sources list:

   ```bash
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   ```
3. Update the package list:

   ```bash
   sudo apt update
   ```
4. Install the CLI:

   ```bash
   sudo apt install stripe
   ```

#### yum

The RPM build for the CLI is available on [JFrog](https://packages.stripe.dev), which isn’t a domain owned by Stripe. When you visit this URL, it redirects you to the Jfrog artifactory list.

To install the Stripe CLI on RPM-based distributions:

1. Add CLI’s yum repository to the yum sources list:

   ```bash
   echo -e "[Stripe]\nname=stripe\nbaseurl=https://packages.stripe.dev/stripe-cli-rpm-local/\nenabled=1\ngpgcheck=0" >> /etc/yum.repos.d/stripe.repo
   ```
2. Install the CLI:

   ```bash
   sudo yum install stripe
   ```

#### Scoop

To install the Stripe CLI with [Scoop](https://scoop.sh/), run:

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
```

```bash
scoop install stripe
```

#### winget

To install the Stripe CLI with [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), run:

```bash
winget install Stripe.StripeCLI
```

#### macOS

To install the Stripe CLI on macOS without homebrew:

1. Download the latest `mac-os` tar.gz file of your cpu architecture type from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).
2. Unzip the file: `tar -xvf stripe_[X.X.X]_mac-os_[ARCH_TYPE].tar.gz`.

Optionally, you can install the binary in a location where you can execute it globally (for example, `/usr/local/bin`).

#### Linux

To install the Stripe CLI on Linux without a package manager:

1. Download the latest `linux` tar.gz file from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).
2. Unzip the file: `tar -xvf stripe_X.X.X_linux_x86_64.tar.gz`.
3. Move `./stripe` to your execution path.

#### Windows

To install the Stripe CLI on Windows without Scoop:

1. Download the latest `windows` zip file from [GitHub](https://github.com/stripe/stripe-cli/releases/latest).
2. Unzip the `stripe_X.X.X_windows_x86_64.zip` file.
3. Add the path to the unzipped `stripe.exe` file to your `Path` environment variable. To learn how to update environment variables, see the [Microsoft PowerShell documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables?view=powershell-7.3#saving-changes-to-environment-variables).

Windows anti-virus scanners occasionally flag the Stripe CLI as unsafe. This is very likely a false positive. For more information, see [Issue #692](https://github.com/stripe/stripe-cli/issues/692) in the GitHub repository.

#### Docker

The Stripe CLI is also available as a [Docker image](https://hub.docker.com/r/stripe/stripe-cli). To install the latest version, run:

```bash
docker run --rm -it stripe/stripe-cli:latest
```

## Get started without an account

The `sandbox create` command provisions a new sandbox with working test API keys, without requiring an account. This enables you, a coding agent, or an automated workflow to start building a Stripe integration immediately.

```bash
stripe sandbox create --email you@example.com
```

> Use `--from-git` instead of `--email <email>` to infer the email from your Git config. Agents and automated scripts should add `--non-interactive` to print output without waiting for input.

This returns a sandbox with working test API keys:

```bash
Setting up your sandbox... done.
{
  "secret_key": "rkcs_test_abc123",
  "publishable_key": "pk_test_def456",
  "claim_url": "https://dashboard.stripe.com/onboard_sandbox/0000000...",
  "account_id": "acct_ghi789",
  "expires_at": "2026-06-22"
}
```

Your temporary sandbox credentials are saved to your CLI profile so that other commands work without needing to log in.

Sandboxes expire after 7 days. You can convert a sandbox into a full Stripe account with the `sandbox claim` command.

```bash
stripe sandbox claim
```

If you’re already [logged in](https://docs.stripe.com/cli/login), `sandbox create` opens the sandbox management page in your Stripe Dashboard.

## Log in to the CLI

1. Log in and authenticate your Stripe user [account](https://docs.stripe.com/get-started/account/set-up.md) to generate a set of restricted keys. To learn more, see [Stripe CLI keys and permissions](https://docs.stripe.com/stripe-cli/keys.md).

   ```bash
     stripe login
   ```
2. Press **Enter** on your keyboard to complete the authentication process in your browser.

   ```bash
   Your pairing code is: enjoy-enough-outwit-win
   This pairing code verifies your authentication with Stripe.
   Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=THQdJfL3x12udFkNorJL8OF1iFlN8Az1 (^C to quit)
   ```

Optionally, if you don’t want to use a browser, use the `--interactive` flag to authenticate with an existing API secret key or restricted key. This is helpful when authenticating to the CLI without a browser, such as in a CI/CD pipeline.

```bash
stripe login --interactive
```

You can also use the `--api-key` flag to specify your API secret key inline each time you send a request.

```bash
stripe login --api-key <<YOUR_SECRET_KEY>>
```
