# Azure DevOps Web Extension SDK

## Report issues
Report issues or make suggestions via the Developer Community portal:

https://developercommunity.visualstudio.com/AzureDevOps

## Release Notes
New major version, v`4.*.*` provides multiple module support to the SDK.

### Details

- **ES Module Support**: SDK now supports ES (ECMAScript) modules in addition to the existing AMD (Asynchronous Module Definition) modules. You can now import SDK using the ES module syntax, which provides performance improvements and reduces the application size.

- **Backward Compatibility for AMD Modules**: Existing support for AMD modules remains intact. If your project is using AMD modules, you can continue to use them as before without any changes.

### How to Use

If you're using AMD modules, you can continue to import SDK using the `require` function:

```javascript
require(['azure-devops-extension-sdk'], function(SDK) {
  // Use the module here
});
```

For ES modules, you can import our modules using the `import` statement:

```javascript
import * as SDK from 'azure-devops-extension-sdk';
// Use the module here
```

## Get started with a new extension

See the [Develop a web extension for Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?view=vsts) documentation for instructions on getting started with a new extension. You can also refer to the [azure-devops-extension-sample](https://github.com/Microsoft/azure-devops-extension-sample) repository as a working reference.

## Overview

Client SDK for developing [Azure DevOps extensions](https://docs.microsoft.com/en-us/azure/devops/extend/overview).

The client SDK enables web extensions to communicate to the host frame. It can be used to:

- Notify the host that the extension is loaded or has errors
- Get basic contextual information about the current page (current user, host and extension information)
- Get theme information
- Obtain an authorization token to use in REST calls back to Azure DevOps
- Get remote services offered by the host frame

A full API reference of can be found [here](https://docs.microsoft.com/en-us/javascript/api/azure-devops-extension-sdk/).

## Get started with a new extension

See the [Develop a web extension for Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?view=vsts) documentation for instructions on getting started with a new extension. You can also refer to the [azure-devops-extension-sample](https://github.com/Microsoft/azure-devops-extension-sample) repository as a working reference.

## Import the SDK within your extension project

1. Add `azure-devops-extension-sdk` to the list of dependencies in your package.json
2. Add `import * as SDK from "azure-devops-extension-sdk"` to your TypeScript code

## Initialize the SDK

When you have rendered your extension content, call `SDK.init()`. Your extension content will not be displayed until you have notified the host frame that you are ready. There are two options for doing this:

1. Call `SDK.init()` with no `loaded` option
2. Call `SDK.init({ loaded: false })` to start initializing the SDK. Then call `SDK.notifyLoadSucceeded()` once you have finished your initial rendering. This allows you to make other SDK calls while your content is still loading (and hidden behind a spinner).

Example:

```typescript
import * as SDK from "azure-devops-extension-sdk";

SDK.init();
```

## API
A full API reference of can be found [here](https://docs.microsoft.com/en-us/javascript/api/azure-devops-extension-sdk/).

## Nested App Authentication (NAA)

Extensions that need to authenticate with Microsoft Entra ID can use the NAA bridge to acquire tokens via MSAL.js v5+. The bridge lets your extension use `createNestablePublicClientApplication` from `@azure/msal-browser` — the Azure DevOps host frame handles the actual authentication flow on your behalf, avoiding cross-origin iframe limitations.

### Prerequisites

1. Register a **SPA** app in the [Azure Portal](https://portal.azure.com)
2. Add the redirect URI: `https://dev.azure.com/_public/_MsalPopup`
3. Configure API permissions for the scopes you need

### Usage

```typescript
import * as SDK from "azure-devops-extension-sdk";
import { createNestablePublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

await SDK.init();
await SDK.enableNestedAppAuth();

const pca = await createNestablePublicClientApplication({
    auth: { clientId: "your-entra-client-id" },
});

// The NAA bridge provides SSO hints, so acquireTokenSilent will succeed
// when the user has already authenticated in the host frame.
try {
    const result = await pca.acquireTokenSilent({
        scopes: ["https://graph.microsoft.com/.default"],
    });
} catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
        const result = await pca.acquireTokenPopup({
            scopes: ["https://graph.microsoft.com/.default"],
        });
    } else {
        throw err;
    }
}
```

> **Note:** Call `enableNestedAppAuth()` *before* `createNestablePublicClientApplication()`. Do not set `redirectUri` in your MSAL config — the bridge provides it automatically. `enableNestedAppAuth()` will throw if the host does not support NAA.

### Consent

On first use, `acquireTokenSilent` will fail with `consent_required` because the user hasn't consented to your app yet. The `InteractionRequiredAuthError` catch block handles this automatically by opening `acquireTokenPopup`, which shows the Entra consent prompt.

After consent, subsequent `acquireTokenSilent` calls succeed without interaction.

To proactively trigger consent (e.g., on a "Connect" button), use `prompt: "consent"`:

```typescript
await pca.acquireTokenPopup({
    scopes: ["https://graph.microsoft.com/.default"],
    prompt: "consent"
});
```

If your app requires admin-level permissions, a tenant admin must grant consent in the Azure Portal (App Registration → API Permissions → "Grant admin consent").

### Cleanup

Call `disableNestedAppAuth()` when your extension no longer needs NAA (e.g., during teardown or in tests). After this call, the bridge remains as a stub that returns a clear `BridgeDisabled` error for any subsequent MSAL token requests — no popup will open and no `interaction_in_progress` lock will occur.

```typescript
SDK.disableNestedAppAuth();
```

To re-enable, call `enableNestedAppAuth()` again.


## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
