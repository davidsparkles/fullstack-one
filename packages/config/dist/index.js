"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const di_1 = require("@fullstack-one/di");
const path = require("path");
const _ = require("lodash");
const crypto_1 = require("crypto");
const boot_loader_1 = require("@fullstack-one/boot-loader");
let Config = class Config {
    constructor(bootLoader) {
        this.ENVIRONMENT = {
            frameworkVersion: null,
            NODE_ENV: process.env.NODE_ENV,
            name: null,
            version: null,
            path: null,
            port: null,
            namespace: null,
            // unique instance ID (6 char)
            nodeId: null
        };
        this.configModules = [];
        this.projectConfig = {};
        this.config = {};
        // start with empty objects in DI
        di_1.Container.set('CONFIG', {});
        di_1.Container.set('ENVIRONMENT', {});
        // load project config
        const projectConfigFolderPath = path.dirname(require.main.filename) + '/config';
        this.projectConfig = this.requireConfigFiles(projectConfigFolderPath);
    }
    // load config based on ENV
    registerConfig(moduleName, moduleConfigPath) {
        // check if path was already included
        if (this.configModules.find(configModule => configModule.name === moduleName) == null) {
            const configModule = {
                name: moduleName,
                path: moduleConfigPath
            };
            this.configModules.push(configModule);
            // apply config to global config object
            return this.applyConfig(moduleName, moduleConfigPath);
        }
    }
    requireConfigFiles(moduleConfigPath) {
        // config files
        const mainConfigPath = `${moduleConfigPath}/default.js`;
        const envConfigPath = `${moduleConfigPath}/${this.ENVIRONMENT.NODE_ENV}.js`;
        // require config files
        let config = null;
        // require default config - fail if not found
        try {
            config = require(mainConfigPath);
        }
        catch (err) {
            process.stderr.write('config.default.loading.error.not.found: ' + mainConfigPath + '\n');
            process.exit();
        }
        // try to load env config – ignore if not found
        try {
            config = _.merge(config, require(envConfigPath));
        }
        catch (err) {
            // ignore if not found
        }
        return config;
    }
    // apply config to the global config object and return entire config
    applyConfig(moduleName, moduleConfigPath) {
        const moduleConfig = this.requireConfigFiles(moduleConfigPath);
        // everything seems to be fine so far -> merge with the global settings object
        this.config = _.merge(this.config, { [moduleName]: moduleConfig });
        // ALWAYS merge with project config file at the END
        this.config = _.merge(this.config, this.projectConfig);
        // copy and override config with ENVs (dot = nested object separator)
        Object.keys(process.env).map((envName) => {
            // parse 'true' and 'false' to booleans
            const envValue = (process.env[envName].toLocaleLowerCase() === 'true') ? true :
                (process.env[envName].toLocaleLowerCase() === 'false') ? false :
                    process.env[envName];
            // if name includes a dot it means its a nested object
            if (envName.includes('.')) {
                const envNameAsArray = envName.split('.');
                envNameAsArray.reduce((obj, key, index) => {
                    // assign value in last iteration round
                    if (index + 1 < envNameAsArray.length) {
                        obj[key] = obj[key] || {};
                    }
                    else {
                        obj[key] = envValue;
                    }
                    return obj[key];
                }, this.config);
            }
            else {
                this.config[envName] = envValue;
            }
        });
        // LAST STEP: check config for undefined settings
        let foundMissingConfig = false;
        this.deepMapHelper(this.config, (key, val, nestedPath) => {
            if (val == null) {
                process.stderr.write(`config.not.set: ${nestedPath}` + '\n');
                foundMissingConfig = true;
            }
        });
        // missing config found?
        if (!!foundMissingConfig) {
            process.exit();
        }
        // put config into DI
        di_1.Container.set('CONFIG', this.config);
        // update ENVIRONMENT
        this.setEnvironment();
        return this.config;
    }
    // set ENVIRONMENT values and wait for packages to fill out placeholder when loaded (core & server)
    setEnvironment() {
        // load project package.js
        const projectPath = path.dirname(require.main.filename);
        const PROJECT_PACKAGE = require(projectPath + '/package.json');
        // each package in the mono repo has the same version
        const MODULE_PACKAGE = require('../package.json');
        // update ENV
        this.ENVIRONMENT.frameworkVersion = MODULE_PACKAGE.version;
        this.ENVIRONMENT.NODE_ENV = process.env.NODE_ENV;
        this.ENVIRONMENT.name = PROJECT_PACKAGE.name;
        this.ENVIRONMENT.version = PROJECT_PACKAGE.version;
        this.ENVIRONMENT.path = projectPath;
        // unique instance ID (6 char)
        this.ENVIRONMENT.nodeId = crypto_1.randomBytes(20).toString('hex').substr(5, 6);
        // wait until core config is set
        if (this.config.core != null) {
            this.ENVIRONMENT.namespace = this.config.core.namespace;
        }
        // wait until server config is set
        if (this.config.server != null) {
            this.ENVIRONMENT.port = this.config.server.port;
        }
        // put config into DI
        di_1.Container.set('ENVIRONMENT', this.ENVIRONMENT);
    }
    getConfig(moduleName) {
        const config = di_1.Container.get('CONFIG');
        if (moduleName == null) {
            // return copy instead of a ref
            return Object.assign({}, config);
        }
        else {
            // return copy instead of a ref
            return Object.assign({}, config[moduleName]);
        }
    }
    /* HELPER */
    deepMapHelper(obj, callback, nestedPath = '') {
        Object.entries(obj).map((entry) => {
            const newPath = nestedPath + entry[0] + '.';
            (typeof entry[1] === 'object' && entry[1] != null) ?
                this.deepMapHelper(entry[1], callback, newPath) :
                callback(entry[0], entry[1], newPath.slice(0, -1)); // remove last dot on last round
        });
    }
};
Config = __decorate([
    di_1.Service(),
    __param(0, di_1.Inject(type => boot_loader_1.BootLoader)),
    __metadata("design:paramtypes", [Object])
], Config);
exports.Config = Config;
