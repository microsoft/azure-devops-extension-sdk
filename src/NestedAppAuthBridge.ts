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
            "Nested App Authentication is not available. " +
            "Ensure the host has NAA support enabled. " +
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
