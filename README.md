# Azure DevOps Web Extension SDK

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
2. Add `import  * as SDK from "azure-devops-extension-sdk"` to your TypeScript code

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


## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
