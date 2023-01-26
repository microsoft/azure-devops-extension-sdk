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

/**
* Model that can be used to customize the values sent to AppInsights via "trackPage"
*/
export interface AppInsightsCustomTrackPageData {
    alias: string;
    metrics: {
        [key: string]: any;
    };
    pageName: string;
    properties: {
        [key: string]: string;
    };
}

/**
* Model used to configure how TFS reports usage data to Application Insights
*/
export interface AppInsightsConfiguration {
    /**
    * If true, automatically call "trackPage" when the page is loaded
    */
    autoTrackPage: boolean;
    /**
    * Optional data used to override the default values sent to trackPage
    */
    customTrackPageData: AppInsightsCustomTrackPageData;
    /**
    * Set to false if app insights reporting is not enabled/configured
    */
    enabled: boolean;
    /**
    * The url from which to retrieve app insights scripts
    */
    insightsScriptUrl: string;
    /**
    * The instrumentation key used to track this deployment's usage
    */
    instrumentationKey: string;
    /**
    * If true, include collection, project, and team info in the track-page urls
    */
    trackProjectInfo: boolean;
}

/**
* Reference to a javascript file to include on a page
*/
export interface JavascriptFileReference {
    /**
    * Condition to check in the case that Url lives on a CDN. The fallback script will be included if this check fails.
    */
    fallbackCondition: string;
    /**
    * Fallback url to use in case Url lives on a CDN
    */
    fallbackUrl: string;
    /**
    * Id of the reference (JQuery, JQueryUI, MicrosoftAjax, etc.)
    */
    identifier: string;
    /**
    * Is this a core javascript file that needs to be included in all child extension frames
    */
    isCoreModule: boolean;
    /**
    * Url of the javascript reference
    */
    url: string;
}

/**
* Reference to a CSS file to include on a page
*/
export interface StylesheetReference {
    /**
    * Url of the high-contrast version of the CSS file
    */
    highContrastUrl: string;
    /**
    * Is this a core stylesheet that needs to be included in child frames
    */
    isCoreStylesheet: boolean;
    /**
    * Url of the CSS file
    */
    url: string;
}

/**
* Contains lists of script and css references that need to be included on the page in order for the controls used by the page to work.
*/
export interface CoreReferencesContext {
    /**
    * Core 3rd party javascript bundle reference
    */
    coreScriptsBundle: JavascriptFileReference;
    /**
    * Core VSS javascript bundle reference for extension frames
    */
    extensionCoreReferences: JavascriptFileReference;
    /**
    * Core javascript files referenced on a page
    */
    scripts: JavascriptFileReference[];
    /**
    * Core CSS files referenced on a page
    */
    stylesheets: StylesheetReference[];
}

export interface DiagnosticsContext {
    /**
    * Id of the current activity
    */
    activityId: string;
    allowStatsCollection: boolean;
    /**
    * Whether or not to enable static content bundling. This is on by default but the value can be overridden with a TFS-BUNDLING cookie or registry entry.
    */
    bundlingEnabled: boolean;
    /**
    * True if the CDN feature flag is enabled.
    */
    cdnAvailable: boolean;
    /**
    * True if the CDN feature flag is enabled and the user has not disabled CDN with a cookie.
    */
    cdnEnabled: boolean;
    clientLogLevel: number;
    debugMode: boolean;
    /**
    * Whether or not to diagnose the bundles.
    */
    diagnoseBundles: boolean;
    inExtensionFallbackMode: boolean;
    isDevFabric: boolean;
    serviceVersion: string;
    sessionId: string;
    tracePointCollectionEnabled: boolean;
    tracePointProfileEnd: string;
    tracePointProfileStart: string;
    /**
    * Denotes the version of the web platform consumed by this service. Of the form M###.
    */
    webPlatformVersion: string;
}

export interface FeatureAvailabilityContext {
    featureStates: {
        [key: string]: boolean;
    };
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

/**
* Model representing a hub in VSTS pages' navigation menu
*/
export interface Hub {
    ariaLabel: string;
    builtIn: boolean;
    groupId: string;
    hidden: boolean;
    icon: string;
    id: string;
    isSelected: boolean;
    name: string;
    order: any;
    supportsXHRNavigate: boolean;
    uri: string;
}

/**
* Model representing a hub group in VSTS pages' navigation menu
*/
export interface HubGroup {
    builtIn: boolean;
    hasHubs: boolean;
    hidden: boolean;
    icon: string;
    id: string;
    name: string;
    nonCollapsible: boolean;
    order: any;
    uri: string;
}

export interface PinningPreferences {
    pinnedHubGroupIds: string[];
    pinnedHubs: {
        [key: string]: string[];
    };
    unpinnedHubGroupIds: string[];
    unpinnedHubs: {
        [key: string]: string[];
    };
}

/**
* Context information containing the relevant hubs and hub groups for a given context
*/
export interface HubsContext {
    allHubs: Hub[];
    hubGroups: HubGroup[];
    hubGroupsCollectionContributionId: string;
    hubs: Hub[];
    pinningPreferences: PinningPreferences;
    selectedHubGroupId: string;
    selectedHubId: string;
    selectedNavigationIds: string[];
}

/**
* Flags to show which tokens of the navigation context are present in the current request URL. The request url's context part are formed like http://server:port[/{collection}[/{project}[/{team}]]][/_admin]/_{controller}/{action} The tokens {collection}, {project} and {team} are navigation level tokens whereas _admin segment is a switch to show admin areas of the site.
*/
declare enum NavigationContextLevels {
    None = 0,
    /**
    * Root level in Azure.
    */
    Deployment = 1,
    /**
    * Root level in on premises. Neither of {collection}, {project} and {team} tokens have information
    */
    Application = 2,
    /**
    * Flag to show {collection} token has information.
    */
    Collection = 4,
    /**
    * Flag to show {project} token has information.
    */
    Project = 8,
    /**
    * Flag to show {team} token has information.
    */
    Team = 16,
    /**
    * Sugar for all application levels.
    */
    ApplicationAll = 30,
    /**
    * Sugar for all levels
    */
    All = 31,
}

/**
* Structure to specify current navigation context of the executing request. The navigation context content's are generally obtained from the request URL. Some context specifiers such as "Account" can be implicit and might come from current IVssServiceHost.
*/
interface NavigationContext {
    /**
    * A token to show which area the request has been targeted to. By default there are two areas "Admin" and "Api". They can be specified in the URL as _admin and _api respectively.
    */
    area: string;
    /**
    * Command name for the current request's route. Used in telemetry and reporting.
    */
    commandName: string;
    /**
    * Current action route value
    */
    currentAction: string;
    /**
    * Current controller route value
    */
    currentController: string;
    /**
    * Current parameters route value (the path after the controller and action in the url)
    */
    currentParameters: string;
    /**
    * The id of the matched route
    */
    routeId: string;
    /**
    * The templates for the matched route
    */
    routeTemplates: string[];
    /**
    * The set of route values for this request
    */
    routeValues: { [key: string]: string; };
    /**
    * Flag to show top most navigation context. For example the URL http://server:port/collection/project/_controller/action sets the Project bit while the URL http://server:port/collection/project/_admin/_controller/action sets also sets the area property to Admin.
    */
    topMostLevel: NavigationContextLevels;
}

/**
* Holds a lookup of urls for different services (at different host levels)
*/
interface ServiceLocations {
    locations: { [key: string]: { [key: number]: string; }; };
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
* MVC api configuration
*/
interface ConfigurationContextApis {
    /**
    * Specifies the path prefix for the area
    */
    areaPrefix: string;
    /**
    * Specifies the path prefix for the controller
    */
    controllerPrefix: string;
    /**
    * Api-version for legacy rpc-style web access api controllers See WebApiVersionClient for the version coming from the client/browser.  The return value is a positive whole number >= 1.
    */
    webApiVersion: string;
}

interface TfsMailSettings {
    enabled: boolean;
}

/**
* Paths to server resources
*/
export interface ConfigurationContextPaths {
    /**
    * Path (no CDN) to versioned static content
    */
    cdnFallbackStaticRootTfs: string;
    /**
    * Relative path to the _content path of the web application
    */
    resourcesPath: string;
    /**
    * Relative path to the root of the web application
    */
    rootPath: string;
    /**
    * Absolute path to build static content URLs from. May be relative or fully-qualified.
    */
    staticContentRootPath: string;
    /**
    * Static content version stamp
    */
    staticContentVersion: string;
    /**
    * Relative path to unversioned 3rd party static content
    */
    staticRoot3rdParty: string;
    /**
    * Relative path to versioned static content
    */
    staticRootTfs: string;
}

/**
* Web Access configuration data. This information is used to process requests on the server.  This data is also placed in a json island on each page in order for JavaScript to know key configuration data required to things like construct proper urls
*/
interface ConfigurationContext {
    /**
    * MVC api configuration
    */
    api: ConfigurationContextApis;
    /**
    * Optional name of the client (e.g. TEE) hosting the page
    */
    clientHost: string;
    isHosted: boolean;
    /**
    * Current mail settings for TFS
    */
    mailSettings: TfsMailSettings;
    /**
    * Server resource paths
    */
    paths: ConfigurationContextPaths;
    /**
    * Indicates what URL format to use.
    */
    useCodexDomainUrls: boolean;
}

/**
* Global context placed on each VSSF web page (through json island data) which gives enough information for core TypeScript modules/controls on the page to operate
*/
export interface IPageContext {
    /**
    * Configuration for reporting telemetry/usage data to App Insights
    */
    appInsightsConfiguration: AppInsightsConfiguration;
    /**
    * Core javascript and css references
    */
    coreReferences: CoreReferencesContext;
    /**
    * Specifies the prefixes for CSS modules that should map to the current service. e.g. "VSS/LoaderPlugins/Css!EMS:ExtensionManagement" would map to ExtensionManagement.css under the themed content path of this service if "EMS" is in the CSSModulePrefixes list.
    */
    cssModulePrefixes: string[];
    /**
    * Diagnostic related information for the current page
    */
    diagnostics: DiagnosticsContext;
    /**
    * Feature flag states to include by default in page data (avoids AJAX lookup)
    */
    featureAvailability: FeatureAvailabilityContext;
    /**
    * Globalization data for the current page based on the current user's settings
    */
    globalization: GlobalizationContext;
    /**
    * Cached set of hubs and hub groups for the given request/navigation-context
    */
    hubsContext: HubsContext;

    /**
    * Current navigation context.
    */
    navigation: NavigationContext;
    /**
    * The service instance type id for the VSTS service serving this page
    */
    serviceInstanceId: string;
    serviceLocations: ServiceLocations;
    /**
    * Contains global time zone configuration information (e.g. which dates DST changes)
    */
    timeZonesConfiguration: TimeZonesConfiguration;
    /**
    * Web Access configuration
    */
    webAccessConfiguration: ConfigurationContext;
    /**
    * The web context information for the given page request
    */
    webContext: IWebContext;
}

export enum ContextHostType {
    Unknown = 0,
    /**
    * The Deployment Host
    */
    Deployment = 1,
    /**
    * A legacy name for the Organization host. Use ContextHostType.Organization instead.
    */
    Application = 2,
    /**
    * The Organization host
    */
    Organization = 2,
    /**
    * The Project Collection
    */
    ProjectCollection = 4
}

export interface ExtendedHostContext {
    authority: string;
    hostType: ContextHostType;
    id: string;
    isAADAccount: boolean;
    name: string;
    relativeUri: string;
    scheme: string;
    uri: string;
}

export interface ContextIdentifier {
    id: string;
    name: string;
}

export interface UserContext {
    id: string;
    limitedAccess: boolean;
    name: string;
    subjectId: string;
    subjectType: string;
    uniqueName: string;
}

/**
* Context information for all web access requests
*/
interface IWebContext {
    account: IHostContext;
    /**
    * Information about the Collection used in the current request (may be null)
    */
    collection: IHostContext;
    /**
    * Information about the current request context's host
    */
    host: ExtendedHostContext;
    /**
    * Information about the project used in the current request (may be null)
    */
    project: ContextIdentifier;
    /**
    * Information about the team used in the current request (may be null)
    */
    team: ITeamContext;
    /**
    * Information about the current user
    */
    user: UserContext;
}

interface IExtensionHandshakeOptions extends IExtensionInitOptions {

    /**
     * Version number of this SDK
     */
    sdkVersion: number;
}

interface IExtensionHandshakeResult {
    pageContext: IPageContext;
    contributionId: string;
    context: {
        extension: IExtensionContext,
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
            hostPageContext = handshakeData.pageContext;
            webContext = hostPageContext.webContext;
            teamContext = webContext.team;

            initialConfiguration = handshakeData.initialConfig || {};
            initialContributionId = handshakeData.contributionId;

            const context = handshakeData.context;
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