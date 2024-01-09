import { LightboxOptions, SemanticVersion, WidgetSize } from "./Contracts";

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
