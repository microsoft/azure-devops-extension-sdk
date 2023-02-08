# Azure DevOps Web Extension SDK

## Overview

This is a forked version of [Azure DevOps extensions SDK](https://github.com/microsoft/azure-devops-extension-sdk) which enables
importing this package as es-module for example in a vite project using svelte or any other js framework. This couldn't be done
up to this point as far as I know, because the original package is bundle only as AMD module package.
The source code is not modified, except some minor additions such as types. AMD bundle is still available in this package (hoping this "upgrade" gets merged into the original repository), but in case you need to use AMD, **I recommed using the original package**.</br>

Added features compared to the original package main branch:
- Option to import package as es-module
- Option to use it in the browser without requirejs
- Added missing types

My intent is not to maintain this separate fork in the long term, I just needed a relatively quick solution for my requirement to use this package
within the vite ecosystem. I hope this improvement gets merged into the main repository after which I'm gonna deprecate this package and eventually
delete it. But until then I'm willing to accept pull request/improvements and publishing them this way.

---

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

1. Add `azure-devops-extension-sdk-esm` to the list of dependencies in your package.json
2. Add `import * as SDK from "azure-devops-extension-sdk-esm"` to your TypeScript code

## Initialize the SDK

When you have rendered your extension content, call `SDK.init()`. Your extension content will not be displayed until you have notified the host frame that you are ready. There are two options for doing this:

1. Call `SDK.init()` with no `loaded` option
2. Call `SDK.init({ loaded: false })` to start initializing the SDK. Then call `SDK.notifyLoadSucceeded()` once you have finished your initial rendering. This allows you to make other SDK calls while your content is still loading (and hidden behind a spinner).

Example:

```typescript
import * as SDK from "azure-devops-extension-sdk-esm";

SDK.init();
```

## API
A full API reference of can be found [here](https://docs.microsoft.com/en-us/javascript/api/azure-devops-extension-sdk/).


## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
