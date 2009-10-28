var SceneJs = {version: '1.0'};

(function() {

    /** Public utility functions
     */
    SceneJs.utils = {

        degToRad : function(degrees) {
            return degrees * Math.PI / 180.0;
        },

        apply : function(o, c, defaults) {
            if (defaults) {
                // no "this" reference for friendly out of scope calls
                SceneJs.apply(o, defaults);
            }
            if (o && c && typeof c == 'object') {
                for (var p in c) {
                    o[p] = c[p];
                }
            }
            return o;
        },

        /** Adds nodes of c to o where not existing in o, returns o
         *
         * @param o
         * @param c
         */
        applyIf : function(o, c) {
            if (o && c) {
                for (var p in c) {
                    if (typeof o[p] == "undefined") {
                        o[p] = c[p];
                    }
                }
            }
            return o;
        },

        namespace : function() {
            var a = arguments, o = null, i, j, d, rt;
            for (i = 0; i < a.length; ++i) {
                d = a[i].split(".");
                rt = d[0];
                eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
                for (j = 1; j < d.length; ++j) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            }
        }


    };

    /**
     * Private framework utility functions
     */
    SceneJs.private = {

        backend : new (function() {
            var backends = {};
            var ctx;
            this.installBackend = function(backend) {
                backends[backend.type] = backend;
                backend.install(ctx);
            };
            this.getBackend = function(type) {
                var backend = backends[type];
                if (!backend) {
                    throw 'No backend installed of type \'' + type + '\'';
                }
                return backend;
            };
        })(),

        newScope : function(_parent) {
            var parent = _parent;
            var data = {};

            return {
                put : function(key, value) {
                    data[key] = value;
                },

                get : function(key) {
                    var value = data[key];
                    if (value) {
                        return value;
                    }
                    if (!parent) {
                        return null;
                    }
                    return parent.get(key);
                }
            };
        },

        getNodeConfig : function(args) {
            if (args.length == 0) {
                throw 'Invalid node parameters: should be a configuration followed by zero or more child nodes';
            }
            var result = { };
            var a0 = args[0];
            if (a0 instanceof Function) {
                result.getParams = a0;
                result.cachable = false; // Configs generated by function - probably variable
            } else {
                result.getParams = function() {
                    return a0;
                };
                result.cachable = true;  // Config object - may be constant - node may override if config has function
            }
            result.children = [];
            for (var i = 1; i < args.length; i++) {
                result.children.push(args[i]);
            }
            return result;
        },

        extend : function(func, args, overrides, scope) {
            var cfg = this.getNodeConfig(args);
            return func.apply(this, [SceneJs.applyIf(overrides, cfg.getParams(scope)), cfg.children || []]).call;
        },

        visitChildren : function(config, scope) {
            if (config.children) {
                for (var i = 0; i < config.children.length; i++) {
                    config.children[i].call(this, scope);      // SceneJs.private.newScope(scope)
                }
            }
        }
    };


})();

// in intellij using keyword "namespace" causes parsing errors
SceneJs.utils.ns = SceneJs.utils.namespace;
SceneJs.utils.ns("SceneJs");


