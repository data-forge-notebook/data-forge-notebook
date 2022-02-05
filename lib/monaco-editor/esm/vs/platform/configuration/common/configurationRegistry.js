/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as nls from '../../../nls.js';
import { Emitter } from '../../../base/common/event.js';
import { Registry } from '../../registry/common/platform.js';
import * as types from '../../../base/common/types.js';
import { Extensions as JSONExtensions } from '../../jsonschemas/common/jsonContributionRegistry.js';
import { values } from '../../../base/common/map.js';
export const Extensions = {
    Configuration: 'base.contributions.configuration'
};
export const allSettings = { properties: {}, patternProperties: {} };
export const applicationSettings = { properties: {}, patternProperties: {} };
export const machineSettings = { properties: {}, patternProperties: {} };
export const machineOverridableSettings = { properties: {}, patternProperties: {} };
export const windowSettings = { properties: {}, patternProperties: {} };
export const resourceSettings = { properties: {}, patternProperties: {} };
export const resourceLanguageSettingsSchemaId = 'vscode://schemas/settings/resourceLanguage';
const contributionRegistry = Registry.as(JSONExtensions.JSONContribution);
class ConfigurationRegistry {
    constructor() {
        this.overrideIdentifiers = new Set();
        this._onDidSchemaChange = new Emitter();
        this._onDidUpdateConfiguration = new Emitter();
        this.defaultOverridesConfigurationNode = {
            id: 'defaultOverrides',
            title: nls.localize('defaultConfigurations.title', "Default Configuration Overrides"),
            properties: {}
        };
        this.configurationContributors = [this.defaultOverridesConfigurationNode];
        this.resourceLanguageSettingsSchema = { properties: {}, patternProperties: {}, additionalProperties: false, errorMessage: 'Unknown editor configuration setting', allowTrailingCommas: true, allowComments: true };
        this.configurationProperties = {};
        this.excludedConfigurationProperties = {};
        contributionRegistry.registerSchema(resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
    }
    registerConfiguration(configuration, validate = true) {
        this.registerConfigurations([configuration], validate);
    }
    registerConfigurations(configurations, validate = true) {
        const properties = [];
        configurations.forEach(configuration => {
            properties.push(...this.validateAndRegisterProperties(configuration, validate)); // fills in defaults
            this.configurationContributors.push(configuration);
            this.registerJSONConfiguration(configuration);
        });
        contributionRegistry.registerSchema(resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
        this._onDidSchemaChange.fire();
        this._onDidUpdateConfiguration.fire(properties);
    }
    registerOverrideIdentifiers(overrideIdentifiers) {
        for (const overrideIdentifier of overrideIdentifiers) {
            this.overrideIdentifiers.add(overrideIdentifier);
        }
        this.updateOverridePropertyPatternKey();
    }
    validateAndRegisterProperties(configuration, validate = true, scope = 3 /* WINDOW */) {
        scope = types.isUndefinedOrNull(configuration.scope) ? scope : configuration.scope;
        let propertyKeys = [];
        let properties = configuration.properties;
        if (properties) {
            for (let key in properties) {
                if (validate && validateProperty(key)) {
                    delete properties[key];
                    continue;
                }
                // fill in default values
                let property = properties[key];
                let defaultValue = property.default;
                if (types.isUndefined(defaultValue)) {
                    property.default = getDefaultValue(property.type);
                }
                if (OVERRIDE_PROPERTY_PATTERN.test(key)) {
                    property.scope = undefined; // No scope for overridable properties `[${identifier}]`
                }
                else {
                    property.scope = types.isUndefinedOrNull(property.scope) ? scope : property.scope;
                }
                // Add to properties maps
                // Property is included by default if 'included' is unspecified
                if (properties[key].hasOwnProperty('included') && !properties[key].included) {
                    this.excludedConfigurationProperties[key] = properties[key];
                    delete properties[key];
                    continue;
                }
                else {
                    this.configurationProperties[key] = properties[key];
                }
                if (!properties[key].deprecationMessage && properties[key].markdownDeprecationMessage) {
                    // If not set, default deprecationMessage to the markdown source
                    properties[key].deprecationMessage = properties[key].markdownDeprecationMessage;
                }
                propertyKeys.push(key);
            }
        }
        let subNodes = configuration.allOf;
        if (subNodes) {
            for (let node of subNodes) {
                propertyKeys.push(...this.validateAndRegisterProperties(node, validate, scope));
            }
        }
        return propertyKeys;
    }
    getConfigurationProperties() {
        return this.configurationProperties;
    }
    registerJSONConfiguration(configuration) {
        const register = (configuration) => {
            let properties = configuration.properties;
            if (properties) {
                for (const key in properties) {
                    allSettings.properties[key] = properties[key];
                    switch (properties[key].scope) {
                        case 1 /* APPLICATION */:
                            applicationSettings.properties[key] = properties[key];
                            break;
                        case 2 /* MACHINE */:
                            machineSettings.properties[key] = properties[key];
                            break;
                        case 6 /* MACHINE_OVERRIDABLE */:
                            machineOverridableSettings.properties[key] = properties[key];
                            break;
                        case 3 /* WINDOW */:
                            windowSettings.properties[key] = properties[key];
                            break;
                        case 4 /* RESOURCE */:
                            resourceSettings.properties[key] = properties[key];
                            break;
                        case 5 /* LANGUAGE_OVERRIDABLE */:
                            resourceSettings.properties[key] = properties[key];
                            this.resourceLanguageSettingsSchema.properties[key] = properties[key];
                            break;
                    }
                }
            }
            let subNodes = configuration.allOf;
            if (subNodes) {
                subNodes.forEach(register);
            }
        };
        register(configuration);
    }
    updateOverridePropertyPatternKey() {
        var _a;
        for (const overrideIdentifier of values(this.overrideIdentifiers)) {
            const overrideIdentifierProperty = `[${overrideIdentifier}]`;
            const resourceLanguagePropertiesSchema = {
                type: 'object',
                description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                $ref: resourceLanguageSettingsSchemaId,
                default: (_a = this.defaultOverridesConfigurationNode.properties[overrideIdentifierProperty]) === null || _a === void 0 ? void 0 : _a.default
            };
            allSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            applicationSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            machineSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            machineOverridableSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            windowSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            resourceSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
        }
        this._onDidSchemaChange.fire();
    }
}
const OVERRIDE_PROPERTY = '\\[.*\\]$';
export const OVERRIDE_PROPERTY_PATTERN = new RegExp(OVERRIDE_PROPERTY);
export function getDefaultValue(type) {
    const t = Array.isArray(type) ? type[0] : type;
    switch (t) {
        case 'boolean':
            return false;
        case 'integer':
        case 'number':
            return 0;
        case 'string':
            return '';
        case 'array':
            return [];
        case 'object':
            return {};
        default:
            return null;
    }
}
const configurationRegistry = new ConfigurationRegistry();
Registry.add(Extensions.Configuration, configurationRegistry);
export function validateProperty(property) {
    if (OVERRIDE_PROPERTY_PATTERN.test(property)) {
        return nls.localize('config.property.languageDefault', "Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.", property);
    }
    if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
        return nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", property);
    }
    return null;
}
