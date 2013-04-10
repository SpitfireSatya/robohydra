/*global require, describe, it, expect*/

var buster = require("buster");
var RoboHydraSummoner = require('../lib/robohydrasummoner').RoboHydraSummoner;
var Request = require("robohydra").Request;

buster.spec.expose();

describe("RoboHydra picking system", function() {
    "use strict";

    it("detects multiple picking functions and fails to load", function() {
        expect(function() {
            new RoboHydraSummoner(
                [{name: 'simple-authenticator', config: {}},
                 {name: 'url-query-authenticator', config: {}}],
                {rootDir: __dirname + '/plugin-fs'}
            );
        }).toThrow('InvalidRoboHydraConfigurationException');
    });

    it("has a default picker function", function() {
        var summoner = new RoboHydraSummoner(
            [{name: 'simple', config: {}}],
            {rootDir: __dirname + '/plugin-fs'}
        );
        var seen = 'seen!';
        var hydra1 = summoner.summonRoboHydraForRequest(new Request({
            url: '/'
        }));
        hydra1.randomProperty = seen;
        var hydra2 = summoner.summonRoboHydraForRequest(new Request({
            url: '/?user=user2'
        }));
        expect(hydra2.randomProperty).toEqual(seen);
    });

    it("rejects pickers that are not functions", function() {
        expect(function() {
            var summoner = new RoboHydraSummoner(
                [{name: 'wrong-fixed-picker', config: {}}],
                {rootDir: __dirname + '/plugin-fs'}
            );
            summoner.summonRoboHydraForRequest(new Request({url: '/'}));
        }).toThrow('InvalidRoboHydraPluginException');
    });

    it("picks the right RoboHydra", function() {
        var summoner = new RoboHydraSummoner(
            [{name: 'right-robohydra-test', config: {}}],
            {rootDir: __dirname + '/plugin-fs'}
        );
        var hydra1 = summoner.summonRoboHydraForRequest(new Request({
            url: '/?user=user1'
        }));
        hydra1.randomProperty = 'user 1';
        hydra1.startTest('right-robohydra-test', 'robohydra1');
        var hydra2 = summoner.summonRoboHydraForRequest(new Request({
            url: '/?user=user2'
        }));
        expect(hydra2.randomProperty).not.toBeDefined();
        hydra2.randomProperty = 'user2';
        hydra2.startTest('right-robohydra-test', 'robohydra2');
        expect(hydra1.currentTest.test).toEqual('robohydra1');
        expect(hydra2.currentTest.test).toEqual('robohydra2');
    });

    // Hydras know their own name (through the module system?)
});

describe("Plugin loader", function() {
    "use strict";

    it("fails when loading non-existent plugins", function() {
        expect(function() {
            new RoboHydraSummoner(
                [{name: 'i-dont-exist', config: {}}],
                {rootDir: __dirname + '/plugin-fs'}
            );
        }).toThrow('RoboHydraPluginNotFoundException');
    });

    it("can load a simple plugin", function() {
        var configKeyValue = 'config value';
        var rootDir = __dirname + '/plugin-fs';
        var lair = new RoboHydraSummoner(
            [{name: 'simple', config: {configKey: configKeyValue}}],
            {rootDir: rootDir}
        );
        expect(lair.pluginInfoList[0].path).toEqual(
            rootDir + '/usr/share/robohydra/plugins/simple');
        expect(lair.pluginInfoList[0].config.configKey).toEqual(configKeyValue);
    });

    it("loads plugins in the right order of preference", function() {
        var rootDir = __dirname + '/plugin-fs';
        var lair = new RoboHydraSummoner(
            [{name: 'definedtwice', config: {}}],
            {rootDir: rootDir}
        );
        expect(lair.pluginInfoList[0].path).toEqual(
            rootDir + '/usr/local/share/robohydra/plugins/definedtwice');
    });

    it("can define own load path, and takes precedence", function() {
        var rootDir = __dirname + '/plugin-fs';
        var lair = new RoboHydraSummoner(
            [{name: 'definedtwice', config: {}}],
            {rootDir: rootDir,
             extraPluginLoadPaths: ['/opt/robohydra/plugins']}
        );
        expect(lair.pluginInfoList[0].path).toEqual(
            rootDir + '/opt/robohydra/plugins/definedtwice');
    });

    it("can define more than one load path, latest has precedence", function() {
        var rootDir = __dirname + '/plugin-fs';
        var lair = new RoboHydraSummoner(
            [{name: 'definedtwice', config: {}}],
            {rootDir: rootDir,
             extraPluginLoadPaths: ['/opt/robohydra/plugins',
                                    '/opt/project/robohydra-plugins']}
        );
        expect(lair.pluginInfoList[0].path).toEqual(
            rootDir + '/opt/project/robohydra-plugins/definedtwice');
    });

    it("can define more than one load path, first is still valid", function() {
        var rootDir = __dirname + '/plugin-fs';
        var lair = new RoboHydraSummoner(
            [{name: 'customloadpath', config: {}}],
            {rootDir: rootDir,
             extraPluginLoadPaths: ['/opt/robohydra/plugins',
                                    '/opt/project/robohydra-plugins']}
        );
        expect(lair.pluginInfoList[0].path).toEqual(
            rootDir + '/opt/robohydra/plugins/customloadpath');
    });
});