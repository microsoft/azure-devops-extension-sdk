/**
 * Nested App Authentication (NAA) bridge shim for Azure DevOps extensions.
 *
 * This module provides the client-side bridge that connects MSAL's
 * `createNestablePublicClientApplication` (which expects `window.nestedAppAuthBridge`)
 * to the Azure DevOps host frame's NAA handler (exposed via XDM as `DevOps.NestedAppAuth`).
 *
 * The host-side handler accepts a `processRequest(requestJson)` call and returns
 * a response JSON string. This shim translates between MSAL's event-based
 * `postMessage`/`addEventListener` API and the XDM request-response model.
 */

import { IXDMChannel } from "./XDM";

/**
 * The interface that the host exposes over XDM under "DevOps.NestedAppAuth".
 */
interface INestedAppAuthHost {
    processRequest(requestJson: string): Promise<string>;
}

type MessageListener = (response: string | { data: string }) => void;

const nestedAppAuthHostId = "DevOps.NestedAppAuth";

/**
 * Attempts to initialize the NAA bridge by obtaining a proxy to the host's
 * NestedAppAuth handler and wiring it to `window.nestedAppAuthBridge`.
 *
 * This is called automatically after the SDK handshake completes. If the host
 * does not expose the NAA endpoint (e.g., feature flag is off), initialization
 * is silently skipped.
 *
 * @param parentChannel - The XDM channel to the host frame
 */
export async function initializeNestedAppAuthBridge(parentChannel: IXDMChannel): Promise<void> {
    // Verify the host exposes the NAA endpoint by calling processRequest with
    // a ping. We use invokeRemoteMethod directly instead of getRemoteObjectProxy
    // because the host-side XDM serializer does not proxy functions.
    try {
        await parentChannel.invokeRemoteMethod<string>("processRequest", nestedAppAuthHostId, [
            JSON.stringify({ messageType: "NestedAppAuthRequest", method: "Ping", requestId: "naa-init-ping" })
        ]);
    } catch (err: any) {
        throw new Error(
            "Nested App Authentication is not available in this Azure DevOps environment yet. " +
            `Details: ${err?.message || err}`
        );
    }

    const listeners: MessageListener[] = [];

    (window as any).nestedAppAuthBridge = {
        addEventListener(type: string, listener: MessageListener): void {
            if (type === "message") {
                listeners.push(listener);
            }
        },
        removeEventListener(type: string, listener: MessageListener): void {
            if (type === "message") {
                const index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
            }
        },
        postMessage(requestJson: string): void {
            parentChannel.invokeRemoteMethod<string>("processRequest", nestedAppAuthHostId, [requestJson]).then(
                    (responseJson: string) => {
                        for (const listener of listeners) {
                            try {
                                listener(responseJson);
                            } catch {
                                // Listener errors should not break the bridge
                            }
                        }
                    },
                    (error: any) => {
                        // If the host call fails, try to extract the requestId
                        // and send an error response so MSAL doesn't hang.
                        try {
                            const request = JSON.parse(requestJson);
                            const errorResponse = JSON.stringify({
                                messageType: "NestedAppAuthResponse",
                                requestId: request.requestId,
                                success: false,
                                error: {
                                    status: "BridgeError",
                                    code: "XDMError",
                                    description: error?.message || "An error occurred communicating with the host"
                                }
                            });
                            for (const listener of listeners) {
                                try {
                                    listener(errorResponse);
                                } catch {
                                    // Ignore listener errors
                                }
                            }
                        } catch {
                            // If we can't even parse the request, there's nothing we can do
                        }
                    }
                );
            }
        };
}

/**
 * Tears down the NAA bridge by replacing `window.nestedAppAuthBridge` with a
 * poisoned stub whose methods throw clear errors. This ensures that:
 * - Existing MSAL PCA instances get an explicit error on their next token call
 *   (MSAL reads `window.nestedAppAuthBridge.postMessage` on every request).
 * - New `createNestablePublicClientApplication` calls fail during bridge init
 *   instead of silently falling back to the standard (broken) popup flow.
 */
export function teardownNestedAppAuthBridge(): void {
    const listeners: Array<(response: string | { data: string }) => void> = [];

    (window as any).nestedAppAuthBridge = {
        postMessage(requestJson: string): void {
            // Respond asynchronously through the registered listener so MSAL's
            // BridgeProxy promise resolves/rejects cleanly.
            try {
                const request = JSON.parse(requestJson);
                let response: object;

                if (request.method === "GetInitContext") {
                    // Let init succeed so MSAL creates a NestedAppAuth PCA
                    // instead of falling back to the standard (broken) popup flow.
                    response = {
                        messageType: "NestedAppAuthResponse",
                        requestId: request.requestId,
                        success: true,
                        initContext: {
                            sdkName: "azure-devops-extension-sdk",
                            sdkVersion: "disabled"
                        }
                    };
                } else {
                    // All actual token requests get a clear error.
                    response = {
                        messageType: "NestedAppAuthResponse",
                        requestId: request.requestId,
                        success: false,
                        error: {
                            status: "Disabled",
                            code: "BridgeDisabled",
                            description: "Nested App Authentication bridge has been disabled. Call enableNestedAppAuth() to re-enable."
                        }
                    };
                }

                const responseJson = JSON.stringify(response);
                setTimeout(() => {
                    for (const listener of listeners) {
                        try { listener(responseJson); } catch { /* ignore */ }
                    }
                }, 0);
            } catch {
                // If we can't parse the request, nothing we can do
            }
        },
        addEventListener(_type: string, listener: (response: string | { data: string }) => void): void {
            listeners.push(listener);
        },
        removeEventListener(_type: string, listener: (response: string | { data: string }) => void): void {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        }
    };
}
