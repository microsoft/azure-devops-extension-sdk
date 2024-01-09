// These are present in https://github.com/microsoft/azure-devops-extension-api/blob/master/src/Dashboard/Dashboard.ts
// but can't be referenced from here because azure-devops-extension-api depends on this package.

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
