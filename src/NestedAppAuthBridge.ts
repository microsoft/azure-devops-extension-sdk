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

    const bridge: any = {
        // Store listeners array as a property so teardownNestedAppAuthBridge
        // can dispatch poisoned responses through the same listeners.
        _naaListeners: listeners,
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

    (window as any).nestedAppAuthBridge = bridge;
}

/**
 * Tears down the NAA bridge by replacing the `postMessage` function on the
 * existing `window.nestedAppAuthBridge` with a poisoned version. We mutate
 * in-place (rather than replacing the whole object) because existing MSAL PCA
 * instances have already registered their listener via `addEventListener` on
 * this object — replacing the object would orphan those listeners and cause
 * MSAL to hang waiting for a response that never arrives.
 */
export function teardownNestedAppAuthBridge(): void {
    const bridge = (window as any).nestedAppAuthBridge;
    if (!bridge) {
        return;
    }

    // Replace postMessage with a poisoned version that responds with errors.
    // We keep addEventListener/removeEventListener intact so MSAL's existing
    // listeners remain registered on the same _naaListeners array.
    bridge.postMessage = function (requestJson: string): void {
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
            // Use setTimeout so the response is delivered asynchronously,
            // matching the real bridge's behavior.
            setTimeout(() => {
                // Dispatch to all listeners currently registered on this bridge
                // object. We trigger a synthetic MessageEvent-like call by
                // invoking the listener with the response string directly.
                // MSAL's BridgeProxy listener accepts both string and {data: string}.
                const event = { data: responseJson };
                if (typeof bridge._naaListeners !== "undefined") {
                    for (const listener of bridge._naaListeners) {
                        try { listener(event); } catch { /* ignore */ }
                    }
                }
            }, 0);
        } catch {
            // If we can't parse the request, nothing we can do
        }
    };
}
