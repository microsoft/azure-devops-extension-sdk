/**
 * From /Tfs/WebPlatform/Client/TFS/Dashboards/WidgetConfigHelpers.ts
 */

export class ConfigurationEvent {
    /**
     * Configuration has changed. When this event is notified, the preview is updated and Save button is enabled.
     *
     * The payload expected when notifying this event: { data: customSettings }
     *
     * {customSettings} is the serialized custom config settings pertaining to the widget.
     */
    public static ConfigurationChange: string = "ms.vss-dashboards-web.configurationChange";

    /**
     * Configuration tries to execute API calls and fails. When this event is notified, the config does not render a view and we pass an error message to the configuration host.
     *
     * The payload expected when notifying this event: { data: string }
     *
     * {string} is the error message that is displayed at the top of the configuration.
     */
    public static ConfigurationError: string = "ms.vss-dashboards-web.configurationError";

    /**
     * Widget configuration general settings changed. When this event is notified, the widget name or widget size is updated.
     *
     * The payload expected when notifying this event: { data: { IGeneralSettings } }
     *
     * {generalSettings} is the serialized object containing WidgetName and WidgetSize
     */
    public static GeneralSettingsChanged: string = "ms.vss-dashboards-web.generalSettingsChanged";
}
