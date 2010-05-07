/**
 * Backend module that provides single point through which exceptions may be raised
 *
 * @private
 */
var SceneJS_errorModule = new (function() {

    SceneJS_eventModule.onEvent(
            SceneJS_eventModule.SCENE_ACTIVATED,
            function() {
                var time = (new Date()).getTime();
                SceneJS_eventModule.fireEvent(SceneJS_eventModule.TIME_UPDATED, time);
            });

    // @private
    this.fatalError = function(e) {
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.ERROR, {
            exception: e,
            fatal: true
        });
        throw e;
    };

    // @private
    this.error = function(e) {
        SceneJS_eventModule.fireEvent(SceneJS_eventModule.ERROR, {
            exception: e,
            fatal: false
        });
    };
})();