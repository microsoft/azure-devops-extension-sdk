import { channelManager } from "./XDM";

/**
 * Web SDK version number. Can be specified in an extension's set of demands like: vss-sdk-version/3.0
 */
export const sdkVersion = 4.0;

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
    Unknown = 0,
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
    /**
     * Distinguish between Azure DevOps Services (true) and Azure DevOps Server (false)
     */
    isHosted: boolean;
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

/**
 * Information about the current DevOps team
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

export interface GlobalizationContext {
    culture: string;
    /**
    * Gets the explicitly-set theme, or the empty string if a theme was not explicitly set. An explicitly-set theme is set either in the query string (?theme=[themename]) or in the user's profile. However, the default theme set in the profile is not considered to be an explicitly-set theme.
    */
    explicitTheme: string;
    theme: string;
    timeZoneId: string;
    timezoneOffset: number;
    typeAheadDisabled: boolean;
}

interface DaylightSavingsAdjustmentEntry {
    /**
    * Millisecond adjustment from UTC
    */
    offset: number;
    /**
    * Date that the offset adjustment starts
    */
    start: Date;
}

interface TimeZonesConfiguration {
    daylightSavingsAdjustments: DaylightSavingsAdjustmentEntry[];
}

/**
* Global context placed on each web page
*/
export interface IPageContext {
    /**
    * Globalization data for the current page based on the current user's settings
    */
    globalization: GlobalizationContext;
    /**
    * Contains global time zone configuration information (e.g. which dates DST changes)
    */
    timeZonesConfiguration: TimeZonesConfiguration;
    /**
    * The web context information for the given page request
    */
    webContext: IWebContext;
}

export interface ContextIdentifier {
    id: string;
    name: string;
}

/**
* Context information for all web access requests
*/
interface IWebContext {
    /**
    * Information about the project used in the current request (may be null)
    */
    project: ContextIdentifier;
    /**
    * Information about the team used in the current request (may be null)
    */
    team: ITeamContext;
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
        pageContext: IPageContext,
        user: IUserContext,
        host: IHostContext
    },
    initialConfig?: { [key: string]: any };
    themeData?: { [key: string]: string };
}

const hostControlId = "DevOps.HostControl";
const serviceManagerId = "DevOps.ServiceManager";
const parentChannel = channelManager.addChannel(window.parent);

let teamContext: ITeamContext | undefined;
let webContext: IWebContext | undefined;;
let hostPageContext: IPageContext | undefined;
let extensionContext: IExtensionContext | undefined;
let initialConfiguration: { [key: string]: any } | undefined;
let initialContributionId: string | undefined;
let userContext: IUserContext | undefined;
let hostContext: IHostContext | undefined;
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
            const context = handshakeData.context;
            hostPageContext = context.pageContext;
            webContext = hostPageContext ? hostPageContext.webContext : undefined;
            teamContext = webContext ? webContext.team : undefined;

            initialConfiguration = handshakeData.initialConfig || {};
            initialContributionId = handshakeData.contributionId;

            extensionContext = context.extension;
            userContext = context.user;
            hostContext = context.host;

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
* Get the context about the extension that owns the content that is being hosted
*/
export function getExtensionContext(): IExtensionContext {
    if (!extensionContext) {
        throw new Error(getWaitForReadyError("getExtensionContext"));
    }
    return extensionContext;
}

/**
* Gets information about the team that the page is targeting
*/
export function getTeamContext(): ITeamContext {
    if (!teamContext) {
        throw new Error(getWaitForReadyError("getTeamContext"));
    }
    return teamContext;
}

/**
* Get the context about the host page
*/
export function getPageContext(): IPageContext {
    if (!hostPageContext) {
        throw new Error(getWaitForReadyError("getPageContext"));
    }
    return hostPageContext;
}

/**
* Get the context about the web
*/
export function getWebContext(): IWebContext {
    if (!webContext) {
        throw new Error(getWaitForReadyError("getWebContext"));
    }
    return webContext;
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
export function register<T extends Object>(instanceId: string, instance: T): void {
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

    const cssVariables: string[] = [];
    if (themeData) {
        for (const varName in themeData) {
            cssVariables.push("--" + varName + ": " + themeData[varName]);
        }
    }

    themeElement.innerText = ":root { " + cssVariables.join("; ") + " } body { color: var(--text-primary-color) }";

    dispatchEvent("themeApplied", { detail: themeData });
}

/**
 * Interface for the object passed to the host when user clicks on the Save button in the configuration pane
 */
export interface SaveStatus {
    /**
     * The custom settings to save
     */
    customSettings?: CustomSettings;
    /**
     * Indicates validity of the customSettings. If false, then user will be shown a generic error message and settings will not be saved.
     */
    isValid: boolean;
}

/**
 * Size of lightbox to draw widget in
 */
export interface Size {
    /**
     * width in pixels
     */
    width: number;
    /**
     * height in pixels
     */
    height: number;
}

/**
 * versioning for an artifact as described at: http://semver.org/, of the form major.minor.patch.
 */
export interface SemanticVersion {
    /**
     * Major version when you make incompatible API changes
     */
    major: number;
    /**
     * Minor version when you add functionality in a backwards-compatible manner
     */
    minor: number;
    /**
     * Patch version when you make backwards-compatible bug fixes
     */
    patch: number;
}

/**
 * settings of the widget that encapsulate their serialized data and version support.
 */
export interface CustomSettings {
    /**
     * the settings data serialized as a string.
     */
    data: string;
    /**
     * (Optional) version for the settings represented as a semantic version object.
     * If none is available, the version defaults to {major:1, minor:0, patch:0} or "1.0.0"
     */
    version?: SemanticVersion;
}

/**
 * data contract required for the widget to function in a webaccess area or page.
 */
export enum WidgetScope {
    Collection_User = 0,
    Project_Team = 1
}

export interface WidgetSize {
    /**
     * The Width of the widget, expressed in dashboard grid columns.
     */
    columnSpan: number;
    /**
     * The height of the widget, expressed in dashboard grid rows.
     */
    rowSpan: number;
}

/**
 * Lightbox configuration
 */
export interface LightboxOptions {
    /**
     * Height of desired lightbox, in pixels
     */
    height: number;
    /**
     * True to allow lightbox resizing, false to disallow lightbox resizing, defaults to false.
     */
    resizable: boolean;
    /**
     * Width of desired lightbox, in pixels
     */
    width: number;
}

/**
 * A description of widget state, satisfying requirements for rendering a widget (Does not contain grid centric information, or contribution metadata).
 */
export interface WidgetSettings {
    /**
     * size of the widget (in case of configuration, this maps to the size sub section in the general section of the configuration panel)
     */
    size: WidgetSize;
    /**
     * name of the widget (in case of configuration, this maps to the name sub section in the general section of the configuration panel)
     */
    name: string;
    /**
     * settings of the widget
     */
    customSettings: CustomSettings;
    /**
     * Lightbox options
     */
    lightboxOptions?: LightboxOptions;
}

/**
 * Used to differentiate between widget status helpers
 */
export enum WidgetStatusType {
    /**
     * The widget loaded successfully
     */
    Success = 0,
    /**
     * The widget failed to load
     */
    Failure = 1,
    /**
     * The widget needs to be configured
     */
    Unconfigured = 2
}

/**
 * The object encapsulating the result for an IWidget/IConfigurableWidget method call. This object is created using the WidgetStatusHelper library.
 */
export interface WidgetStatus {
    /**
     * the rendered state of the widget serialized to a string.
     */
    state?: string;
    /**
     * Used to determine which widget status helper was called
     */
    statusType?: WidgetStatusType;
}

export class WidgetStatusHelper {
    /**
     * method to encapsulate a successful result for a widget loading operation (load, reload, openLightbox etc)
     * @param state any state information to be passed to the initiator of the loading call.
     * @param title title for the lightbox of a widget when available.
     * @returns promise encapsulating the status of the widget loading operations.
     */
    static Success(state?: string): Promise<WidgetStatus> {
        return Promise.resolve({ state, statusType: WidgetStatusType.Success });
    }

    /**
     * method to encapsulate a failed result for a widget loading operation (load, reload, openLightbox etc)
     * @param message message to display as part within the widget error experience.
     * @param isUserVisible indicates whether the message should be displayed to the user or a generic error message displayed. Defaults to true.
     * @param isRichText indicates whether the message is an html that can be rendered as a rich experience. Defaults to false. Only trusted extensions are
     * allowed to set this to true. For any 3rd party widgets passing this value as true, it will be ignored.
     * @returns promise encapsulating the status of the widget loading operations.
     */
    static Failure(message: string, isUserVisible?: boolean, isRichText?: boolean): Promise<WidgetStatus> {
        isUserVisible = isUserVisible === undefined ? true : isUserVisible;
        isRichText = isRichText === undefined ? false : isRichText;
        return Promise.reject({ message, isRichText, isUserVisible });
    }

    /**
     * method to encapsulate a result for a widget loading operation that results in the widget being in an unconfigured state.
     * @returns promise encapsulating the status of the widget loading operations.
     */
    static Unconfigured(): Promise<WidgetStatus> {
        return Promise.resolve({ statusType: WidgetStatusType.Unconfigured });
    }
}

export class WidgetConfigurationSave {
    /**
     * method to encapsulate a valid state that is returned by the widget configuration
     * @param customSettings settings from the widget configuration to be returned as part of this state.
     * @returns promise encapsulating the state being returned.
     */
    static Valid(customSettings: CustomSettings): Promise<SaveStatus> {
        return Promise.resolve({ customSettings, isValid: true });
    }

    /**
     * method to encapsulate an invalid state that is returned by the widget configuration
     * @returns promise encapsulating the state being returned.
     */
    static Invalid(): Promise<SaveStatus> {
        return Promise.reject({ isValid: false });
    }
}

/**
 * Arguments associated with an event being passed by a widget or configurations.
 */
export interface EventArgs<T> {
    /**
     * Data relevant to the event.
     */
    data: T;
}

/**
 * Interface for the object passed to the widget configuration to communicate with its host.
 */
export interface IWidgetConfigurationContext {
    /**
     * The widget configuration calls this method when it wants to notify any of the WidgetEvents to the host
     * @param {string} type of event
     * @param {eventArgs} arguments associated with the event which comes from the widget configuration.
     * @returns a promise with the result of the notification. If arguments are malformed, the promise will be rejected. If multiple notifications are made for the same event
     * only the promise for the latest notification is resolved and the rest are treated as stale. The subscriber of the notification can send back information in a serialized form.
     */
    notify: <T>(event: string, eventArgs: EventArgs<T>) => Promise<NotifyResult>;
}

export class ConfigurationEvent {
    /**
     * Configuration has changed. When this event is notified, the preview is updated and Save button is enabled.
     *
     * The payload expected when notifying this event: { data: customSettings }
     *
     * {customSettings} is the serialized custom config settings pertaining to the widget.
     */
    static ConfigurationChange: string = "ms.vss-dashboards-web.configurationChange";
    /**
     * Configuration tries to execute API calls and fails. When this event is notified, the config does not render a view and we pass an error message to the configuration host.
     *
     * The payload expected when notifying this event: { data: string }
     *
     * {string} is the error message that is displayed at the top of the configuration.
     */
    static ConfigurationError: string = "ms.vss-dashboards-web.configurationError";
    /**
     * Widget configuration general settings changed. When this event is notified, the widget name or widget size is updated.
     *
     * The payload expected when notifying this event: { data: { IGeneralSettings } }
     *
     * {generalSettings} is the serialized object containing WidgetName and WidgetSize
     */
    static GeneralSettingsChanged: string = "ms.vss-dashboards-web.generalSettingsChanged";
    /**
     * @param payload the event arguments we pass when we want to notify the configuration.
     */
    static Args<T>(payload: T): EventArgs<T> {
        return { data: payload };
    }
}

/**
 * All widgets implement this interface
 */
export interface IWidget {
    /** widgets use the settings provided along with the any cached data they may have to paint an interactive state. No network calls should be made by the widget.
     *  @param {WidgetSettings} settings of the widget as available when the widget render is called by the host.
     *  @returns object wrapped in a promise that encapsulates the success of this operation.
     *          when this calls are completed and the experience is done loading.
     */
    preload: (widgetSettings: WidgetSettings) => Promise<WidgetStatus>;
    /**
     *  Widgets use the settings provided as well as server side calls to complete their rendering experience.
     *  In the future, widgets are expected to provide a loading experience while the calls are being waited to be completed.
     *  Until then, the widget host will provide the loading experience
     *  @param {WidgetSettings} settings of the widget as available when the widget render is called by the host.
     *  @returns object wrapped in a promise that encapsulates the success of this operation.
     *          when this calls are completed and the experience is done loading.
     */
    load: (widgetSettings: WidgetSettings) => Promise<WidgetStatus>;
    /**
     * Widgets manage any operations that are not necessary for initial load but are required for the full widget experience.
     */
    onDashboardLoaded?: () => void;
    /**
     * The framework calls this method to determine if the widget should be disabled for users with stakeholder license
     * @param {WidgetSettings} settings of the widget as available when the widget render is called by the host.
     * @returns A boolean wrapped in a promise that determines if the widget should be disabled for users with stakeholder license
     */
    disableWidgetForStakeholders?: (widgetSettings: WidgetSettings) => Promise<boolean>;
    /**
     *  Run widget in lightboxed mode
     *  @param {WidgetSettings} settings of the widget as available when the widget render is called by the host.
     *  @param {LightboxSize} size of the lightbox
     *  @returns object wrapped in a promise that encapsulates the success of this operation.
     *          when this calls are completed and the experience is done loading.
     */
    lightbox?: (widgetSettings: WidgetSettings, lightboxSize: Size) => Promise<WidgetStatus>;
    /**
     *  Listen to message from host
     * @param {string} type of event
     * @param {eventArgs} arguments associated with the event.
     */
    listen?: <T>(event: string, eventArgs: EventArgs<T>) => void;
}

/**
 * Configurable widgets implement this interface
 */
export interface IConfigurableWidget extends IWidget {
    /**
     *  When the configuration view is changed, the widget is expected to update its view.
     *  @param {WidgetSettings} the latest widget settings as available from the configuration view for the widget.
     *  @returns object wrapped in a promise that encapsulates the success of this operation.
     */
    reload: (newWidgetSettings: WidgetSettings) => Promise<WidgetStatus>;
}

/**
 * Widget authors implement this interface for their configuration.
 */
export interface IWidgetConfiguration {
    /**
     *  Called by the host to setup the widget configuration, which uses the settings shared with the widget to complete its rendering experience.
     *  @param {WidgetSettings} settings of the widget as shared with the configuration.
     *  @param {IWidgetConfigurationContext} widgetConfigurationContext provided by the host of the widget configuration to allow for communication.
     *  @returns object wrapped in a promise that encapsulates the success of this operation.
     *           If load fails, returns error message via WidgetStatusHelper.Failure(errorMessage).
     */
    load: (widgetSettings: WidgetSettings, widgetConfigurationContext: IWidgetConfigurationContext) => Promise<WidgetStatus>;
    /**
     * Called by the host when the user clicks on the Save button.
     * Widget author is expected to run validations if needed.
     * If ready to save, then use WidgetHelpers.WidgetConfigurationSave.Valid() to return the serialized custom settings of the widget from the configuraton.
     * If custom settings are not valid and so not ready to save, then  use WidgetHelpers.WidgetConfigurationSave.Invalid() to notify the host to stop save.
     * @returns object of type SaveStatus wrapped in a promise.
     */
    onSave: () => Promise<SaveStatus>;
    /**
     * (Optional) Called by the host when the configuration is ready to be saved (when the user clicks the save button on the configuration panel)
     */
    onSaveComplete?: () => void;
    /**
     *  Listen to message from host
     * @param {string} type of event
     * @param {eventArgs} arguments associated with the event.
     */
    listen?: <T>(event: string, eventArgs: EventArgs<T>) => void;
}

/**
 * The result of a notification being made by a widget configuration.
 */
export interface NotifyResult {
    /**
     * Gets a response from the subscriber of the notification, if they provide one as part of the schema for the event.
     * @returns A promise with the data representing the return payload serialized as a string.
     */
    getResponse(): Promise<string>;
}
