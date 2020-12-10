import { channelManager } from "./XDM";

/**
 * Web SDK version number. Can be specified in an extension's set of demands like: vss-sdk-version/3.0
 */
export const sdkVersion = 3.0;

const global = window as any;
if (global._AzureDevOpsSDKVersion) {
    console.error("The AzureDevOps SDK is already loaded. Only one version of this module can be loaded in a given document.");
}

global._AzureDevOpsSDKVersion = sdkVersion;

/**
 * Options for extension initialization -- passed to DevOps.init()
 */
export interface IExtensionInitOptions {

    /**
     * True (the default) indicates that the content of this extension is ready to be shown/used as soon as the
     * init handshake has completed. Otherwise (loaded: false), the extension must call DevOps.notifyLoadSucceeded()
     * once it has finished loading.
     */
    loaded?: boolean;

    /**
     * Extensions that show UI should specify this to true in order for the current user's theme
     * to be applied to this extension content. Defaults to true.
     */
    applyTheme?: boolean;
}

/**
 * Information about the current user
 */
export interface IUserContext {

    /**
     * Identity descriptor used to represent this user. In the format of {subject-type}.{base64-encoded-subject-id}
     */
    descriptor: string;

    /**
     * Unique id for the user
     */
    id: string;

    /**
     * Name of the user (email/login)
     */
    name: string;

    /**
     * The user's display name (First name / Last name)
     */
    displayName: string;

    /**
     * Url to the user's profile image
     */
    imageUrl: string;
}

/**
 * DevOps host level
 */
export enum HostType {

    /**
     * The Deployment host
     */
    Deployment = 1,

    /**
     * The Enterprise host
     */
    Enterprise = 2,

    /**
     * The organization host
     */
    Organization = 4
}

/**
 * Information about the current DevOps host (organization)
 */
export interface IHostContext {

    /**
     * Unique GUID for this host
     */
    id: string;

    /**
     * Name of the host (i.e. Organization name)
     */
    name: string;

    /**
     * Version of Azure DevOps used by the current host (organization)
     */
    serviceVersion: string;

    /**
     * DevOps host level
     */
    type: HostType;
}

/**
 * Information about the current DevOps teamz
 */
export interface ITeamContext {

    /**
     * Unique GUID for this team
     */
    id: string;

    /**
     * Name of team
     */
    name: string;
}

/**
 * Identifier for the current extension
 */
export interface IExtensionContext {

    /**
     * Full id of the extension <publisher>.<extension>
     */
    id: string;

    /**
     * Id of the publisher
     */
    publisherId: string;

    /**
     * Id of the extension (without the publisher prefix)
     */
    extensionId: string;

    /**
     * Version of the extension
     */
    version: string;
}

interface IExtensionHandshakeOptions extends IExtensionInitOptions {

    /**
     * Version number of this SDK
     */
    sdkVersion: number;
}

interface IExtensionHandshakeResult {
    contributionId: string;
    context: {
        extension: IExtensionContext,
        user: IUserContext,
        host: IHostContext
    },
    initialConfig?: { [key: string]: any };
    themeData?: { [ key: string]: string };
    pageContext?: {
        webContext?: {
            team?: ITeamContext;
        }
    }
}

const hostControlId = "DevOps.HostControl";
const serviceManagerId = "DevOps.ServiceManager";
const parentChannel = channelManager.addChannel(window.parent);

let extensionContext: IExtensionContext | undefined;
let initialConfiguration: { [key: string]: any } | undefined;
let initialContributionId: string | undefined;
let userContext: IUserContext | undefined;
let hostContext: IHostContext | undefined;
let teamContext: ITeamContext | undefined;
let themeElement: HTMLStyleElement;

let resolveReady: () => void;
const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
});

/**
 * Register a method so that the host frame can invoke events
 */
function dispatchEvent(eventName: string, params: any) {
    const global = window as any;

    let evt;
    if (typeof global.CustomEvent === "function") {
        evt = new global.CustomEvent(eventName, params);
    }
    else {
        params = params || { bubbles: false, cancelable: false };
        evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(eventName, params.bubbles, params.cancelable, params.detail);
    }

    window.dispatchEvent(evt);
}
parentChannel.getObjectRegistry().register("DevOps.SdkClient", {
    dispatchEvent: dispatchEvent
});

/**
 * Initiates the handshake with the host window.
 *
 * @param options - Initialization options for the extension.
 */
export function init(options?: IExtensionInitOptions): Promise<void> {

    return new Promise((resolve) => {

        const initOptions = { ...options, sdkVersion };

        parentChannel.invokeRemoteMethod<IExtensionHandshakeResult>("initialHandshake", hostControlId, [initOptions]).then((handshakeData) => {

            initialConfiguration = handshakeData.initialConfig || {};
            initialContributionId = handshakeData.contributionId;

            const context = handshakeData.context;
            extensionContext = context.extension;
            userContext = context.user;
            hostContext = context.host;
            teamContext = handshakeData.pageContext && handshakeData.pageContext && handshakeData.pageContext.webContext && handshakeData.pageContext.webContext.team;

            if (handshakeData.themeData) {
                applyTheme(handshakeData.themeData);

                window.addEventListener("themeChanged", (ev: any) => {
                    applyTheme(ev.detail.data);
                });
            }

            resolveReady();
            resolve();
        });
    });
}

/**
* Register a callback that gets called once the initial setup/handshake has completed.
* If the initial setup is already completed, the callback is invoked at the end of the current call stack.
*/
export async function ready(): Promise<void> {
    return readyPromise;
}

/**
* Notifies the host that the extension successfully loaded (stop showing the loading indicator)
*/
export function notifyLoadSucceeded(): Promise<void> {
    return parentChannel.invokeRemoteMethod("notifyLoadSucceeded", hostControlId);
}

/**
* Notifies the host that the extension failed to load
*/
export function notifyLoadFailed(e: Error | string): Promise<void> {
    return parentChannel.invokeRemoteMethod("notifyLoadFailed", hostControlId, [e]);
}

function getWaitForReadyError(method: string): string {
    return `Attempted to call ${method}() before init() was complete. Wait for init to complete or place within a ready() callback.`;
}

/**
* Get the configuration data passed in the initial handshake from the parent frame
*/
export function getConfiguration(): { [key: string]: any } {
    if (!initialConfiguration) {
        throw new Error(getWaitForReadyError("getConfiguration"));
    }
    return initialConfiguration;
}

/**
* Gets the information about the contribution that first caused this extension to load.
*/
export function getContributionId(): string {
    if (!initialContributionId) {
        throw new Error(getWaitForReadyError("getContributionId"));
    }
    return initialContributionId;
}

/**
* Gets information about the current user
*/
export function getUser(): IUserContext {
    if (!userContext) {
        throw new Error(getWaitForReadyError("getUser"));
    }
    return userContext;
}

/**
* Gets information about the host (i.e. an Azure DevOps organization) that the page is targeting
*/
export function getHost(): IHostContext {
    if (!hostContext) {
        throw new Error(getWaitForReadyError("getHost"));
    }
    return hostContext;
}

/**
* Gets information about the team that the page is targeting
*/
export function getTeam(): ITeamContext {
    if (!teamContext) {
        throw new Error(getWaitForReadyError("getTeam"));
    }
    return teamContext;
}


/**
* Get the context about the extension that owns the content that is being hosted
*/
export function getExtensionContext(): IExtensionContext {
    if (!extensionContext) {
        throw new Error(getWaitForReadyError("getExtensionContext"));
    }
    return extensionContext;
}

/**
* Get the contribution with the given contribution id. The returned contribution has a method to get a registered object within that contribution.
*
* @param contributionId - Id of the contribution to get
*/
export async function getService<T>(contributionId: string): Promise<T> {
    return ready().then(() => {
        return parentChannel.invokeRemoteMethod<T>("getService", serviceManagerId, [contributionId]);
    });
}

/**
* Register an object (instance or factory method) that this extension exposes to the host frame.
*
* @param instanceId - unique id of the registered object
* @param instance - Either: (1) an object instance, or (2) a function that takes optional context data and returns an object instance.
*/
export function register<T = any>(instanceId: string, instance: T): void {
    parentChannel.getObjectRegistry().register(instanceId, instance);
}

/**
* Removes an object that this extension exposed to the host frame.
*
* @param instanceId - unique id of the registered object
*/
export function unregister(instanceId: string): void {
    parentChannel.getObjectRegistry().unregister(instanceId);
}

/**
* Fetch an access token which will allow calls to be made to other DevOps services
*/
export async function getAccessToken(): Promise<string> {
    return parentChannel.invokeRemoteMethod<{ token: string }>("getAccessToken", hostControlId).then((tokenObj) => { return tokenObj.token; });
}

/**
* Fetch an token which can be used to identify the current user
*/
export async function getAppToken(): Promise<string> {
    return parentChannel.invokeRemoteMethod<{ token: string }>("getAppToken", hostControlId).then((tokenObj) => { return tokenObj.token; });
}

/**
* Requests the parent window to resize the container for this extension based on the current extension size.
*
* @param width - Optional width, defaults to scrollWidth
* @param height - Optional height, defaults to scrollHeight
*/
export function resize(width?: number, height?: number): void {
    const body = document.body;
    if (body) {
        const newWidth = typeof width === "number" ? width : (body ? body.scrollWidth : undefined);
        const newHeight = typeof height === "number" ? height : (body ? body.scrollHeight : undefined);
        
        parentChannel.invokeRemoteMethod("resize", hostControlId, [newWidth, newHeight]);
    }
}

/**
 * Applies theme variables to the current document
 */
export function applyTheme(themeData: { [varName: string]: string }): void {

    if (!themeElement) {
        themeElement = document.createElement("style");
        themeElement.type = "text/css";
        document.head!.appendChild(themeElement);
    }

    const cssVariables = [];
    if (themeData) {
        for (const varName in themeData) {
            cssVariables.push("--" + varName + ": " + themeData[varName]);
        }
    }

    themeElement.innerText = ":root { " + cssVariables.join("; ") + " } body { color: var(--text-primary-color) }";

    dispatchEvent("themeApplied", { detail: themeData });
}