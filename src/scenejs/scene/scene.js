/**
 *@class Root node of a SceneJS scene graph.
 *
 * <p>This is entry and exit point for traversal of a scene graph, providing the means to inject data, pick 
 * {@link SceneJS.Geometry} and render frames either singularly or in a continuous loop.</p>
 * <p><b>Binding to a canvas</b></p>
 * <p>The Scene node can be configured with a <b>canvasId</b> property to specify the ID of a WebGL compatible Canvas
 * element for the scene to render to. When that is omitted, the node will look for one with the default ID of
 * "_scenejs-default-canvas".</p>
 * <p><b>Usage Example:</b></p><p>Below is a minimal scene graph. To render the scene, SceneJS will traverse its nodes
 * in depth-first order. Each node will set some scene state on entry, then un-set it again before exit. In this graph,
 * the {@link SceneJS.Scene} node binds to a WebGL Canvas element, a {@link SceneJS.LookAt} defines the viewoint,
 * a {@link SceneJS.Camera} defines the projection, a {@link SceneJS.Lights} defines a light source,
 * a {@link SceneJS.Material} defines the current material properties, {@link SceneJS.Rotate} nodes orient the modeling
 * coordinate space, then a {@link SceneJS.objects.Cube} defines our cube.</p>
 * <pre><code>
 *
 * var myScene = new SceneJS.Scene({
 *     canvasId: 'theCanvas'
 *   },
 *
 *   new SceneJS.LookAt({
 *       eye  : { x: -1.0, y: 0.0, z: 15 },
 *       look : { x: -1.0, y: 0, z: 0 },
 *       up   : { y: 1.0 }
 *     },
 *
 *     new SceneJS.Camera({
 *         optics: {
 *           type: "perspective",
 *           fovy   : 55.0,
 *           aspect : 1.0,
 *           near   : 0.10,
 *           far    : 1000.0
 *         }
 *       },
 *
 *       new SceneJS.Lights({
 *           sources: [
 *             {
 *               type:  "dir",
 *               color: { r: 1.0, g: 1.0, b: 1.0 },
 *               dir:   { x: 1.0, y: -1.0, z: 1.0 }
 *             },
 *             {
 *               type:  "dir",
 *               color: { r: 1.0, g: 1.0, b: 1.0 },
 *               dir:   { x: -1.0, y: -1.0, z: -3.0 }
 *             }
 *           ]
 *         },
 *
 *         new SceneJS.Material({
 *                  baseColor:      { r: 0.9, g: 0.2, b: 0.2 },
 *                  specularColor:  { r: 0.9, g: 0.9, b: 0.2 },
 *                  emit:           0.0,
 *                  specular:       0.9,
 *                  shine:          6.0
 *             },
 *
 *             new SceneJS.Rotate(
 *                 function(data) {
 *                    return {
 *                      angle: data.get('yaw'), y : 1.0
 *                   };
 *                 },
 *
 *                 new SceneJS.Rotate(
 *                     function(data) {
 *                       return {
 *                         angle: data.get('pitch'), x : 1.0
 *                       };
 *                     },
 *
 *                     new SceneJS.objects.Cube()
 *                   )
 *                )
 *              )
 *            )
 *          )
 *       )
 *     );
 *
 *   myScene.setData({ yaw: 315, pitch: 20 });
 *   myScene.render();
 * </pre></code>
 * <p>Take a closer look at those rotate nodes. See how they can optionally take a function which feeds them their
 * parameters? You can do that for any node to dynamically evaluate parameters for them at traversal-time. The functions
 * take an immutable data object, which is SceneJS's mechanism for passing variables down into scene graphs. Using the
 * yaw and pitch properties on that data object, our functions create configurations that specify rotations about
 * the X and Y axis. See also how we inject those angles when we render the scene.</p>
 * <h2>Rendering in a Loop</h2>
 * <p>If you wanted to animate the rotation within the scene example above, then instead of rendering just a single frame
 * you could start a rendering loop on the scene, as shown below:</p>
 * <pre><code>
 *    var yaw = 0.0;
 *    var pitch = 20.0
 *
 *    myScene.start({
 *
 *        // Idle function called before each render traversal
 *
 *        idleFunc: function(scene) {
 *             scene.setData({ yaw: yaw, pitch: 20 };
 *
 *             yaw += 2.0;
 *             if (yaw == 360) {
 *                 scene.stop();
 *             }
 *        },
 *
 *        fps: 20
 * });
 * </code></pre>
 * @extends SceneJS.Node
 */
SceneJS.Scene = function() {
    SceneJS.Node.apply(this, arguments);
    this._nodeType = "scene";
    if (!this._fixedParams) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException
                        ("Dynamic configuration of SceneJS.scene node is not supported"));
    }
    this._params = this._getParams();
    this._data = {};
    this._configs = {};
    if (this._params.canvasId) {
        this._canvasId = document.getElementById(this._params.canvasId) ? this._params.canvasId : SceneJS.Scene.DEFAULT_CANVAS_ID;
    } else {
        this._canvasId = SceneJS.Scene.DEFAULT_CANVAS_ID;
    }
};

SceneJS._inherit(SceneJS.Scene, SceneJS.Node);

/** ID of canvas SceneJS looks for when {@link SceneJS.Scene} node does not supply one
 */
SceneJS.Scene.DEFAULT_CANVAS_ID = "_scenejs-default-canvas";

/** ID ("_scenejs-default-logging") of default element to which {@link SceneJS.Scene} node will log to, if found.
 */
SceneJS.Scene.DEFAULT_LOGGING_ELEMENT_ID = "_scenejs-default-logging";

/** Returns the ID of the canvas element that this scene is to bind to. When no canvasId was configured, it will be the
 * the default ID of "_scenejs-default-canvas".
 */
SceneJS.Scene.prototype.getCanvasId = function() {
    return this._canvasId;
};

/**
 * Starts the scene rendering repeatedly in a loop. After this {@link #isRunning} will return true, and you can then stop it again
 * with {@link #stop}. You can specify an idleFunc that will be called within each iteration before the scene graph is
 * traversed for the next frame. You can also specify the desired number of frames per second to render, which SceneJS
 * will attempt to achieve.
 *
 * To render just one frame at a time, use {@link #render}.
 *
 * <p><b>Usage Example: Basic Loop</b></p><p>Here we are rendering a scene in a loop, at each frame feeding some data into it
 * (see main {@link SceneJS.Scene} comment for more info on that), then stopping the loop after ten frames are rendered:</p>
 *
 * <pre><code>
 * var n = 0;
 * myScene.start({
 *     idleFunc: function(scene) {
 *
 *         scene.setData({ someData: 5, moreData: 10 };
 *
 *         n++;
 *         if (n == 100) {
 *             scene.stop();
 *         }
 *     },
 *     fps: 20
 * });
 * </code></pre>
 *
 *
 * <p><b>Usage Example: Picking</b></p><p>The snippet below shows how to do picking via the idle function, where we
 * retain the mouse click event in some variables which are collected when the idleFunc is next called. The idleFunc
 * then puts the scene into picking mode for the next traversal. Then any {@link SceneJS.Geometry} intersecting the
 * canvas-space coordinates during that traversal will fire a "picked" event to be observed by "picked" listeners at
 * higher nodes (see examples, wiki etc. for the finer details of picking). After the traversal, the scene will be back
 * "rendering" mode again.</p>
 *
 * <pre><code>
 * var clicked = false;
 * var clickX, clickY;
 *
 * canvas.addEventListener('mousedown',
 *     function (event) {
 *         clicked = true;
 *         clickX = event.clientX;
 *         clickY = event.clientY;
 * }, false);
 *
 * myScene.start({
 *     idleFunc: function(scene) {
 *         if (clicked) {
 *             scene.pick(clickX, clickY);
 *             clicked = false;
 *         }
 *     }
 * });
 * </code></pre>
 * @param cfg
 */
SceneJS.Scene.prototype.start = function(cfg) {
    if (!this._running) {
        this._running = true;
        var self = this;
        var fnName = "__scenejs_renderScene" + this._sceneId;
        window[fnName] = function() {
            if (cfg.idleFunc) {
                cfg.idleFunc(self);
            }
            if (self._running) { // idleFunc may have stopped render loop
                self.render();
            }
        };
        this._pInterval = setInterval("window['" + fnName + "']()", 1000.0 / (cfg.fps || 10));
    }
};

/** Returns true if the scene is currently rendering repeatedly in a loop after being started with {@link #start}.
 */
SceneJS.Scene.prototype.isRunning = function() {
    return this._running;
};

/**
 * Sets a map of values to set on the global scene data scope when the scene is next rendered.
 * This data will then be available to any configuration callbacks that are used to configure nodes. The map is the same
 * as that configured on a {@link SceneJS.WithData} and works the same way.
 * @param {object} values Values for the global scene data scope, same format as that given to {@link SceneJS.WithData}
 */
SceneJS.Scene.prototype.setData = function(values) {
    this._data = values || {};
    return this;
};

/**
 * Returns any data values map previously set with {@link #setData} since the last call to {@link #render}.
 *
 * @returns {Object} The data values map
 */
SceneJS.Scene.prototype.getData = function() {
    return this._configs;
};

/**
 * Sets a map of values to set on target nodes in the scene graph when the scene is next rendered. The map is the same as that
 * configured on a {@link SceneJS.WithConfigs} and works the same way.
 * @param {object} values Map of values, same format as that given to {@link SceneJS.WithConfigs}
 */
SceneJS.Scene.prototype.setConfigs = function(values) {
    this._configs = values || {};
    return this;
};

/**
 * Returns the config values map that was last set with {@link #setConfigs}.
 *
 * @returns {Object} The config values map
 */
SceneJS.Scene.prototype.getConfigs = function() {
    return this._configs;
};

/**
 * Immediately renders one frame of the scene, applying any config and data scope values given to {@link #setData} and
 * {#link #setConfigs}, retaining those values in the scene afterwards. Has no effect if the scene has been
 * {@link #start}ed and is currently rendering in a loop.
 */
SceneJS.Scene.prototype.render = function() {
    if (!this._running) {
        this._render();
    }
};

/** @private
 */
SceneJS.Scene.prototype._render = function() {
    if (!this._sceneId) {
        this._sceneId = SceneJS._sceneModule.createScene(this, this._getParams());
    }
    SceneJS._sceneModule.activateScene(this._sceneId);
    var traversalContext = {};
    this._renderNodes(traversalContext, new SceneJS.Data(null, false, this._data));
    SceneJS._sceneModule.deactivateScene();
};

/**
 * Picks whatever {@link SceneJS.Geometry} will be rendered at the given canvas coordinates. When this is called within
 * the idle function of a currently running render loop (ie. started with {@link #start) then pick will be performed on
 * the next render. When called on a non-running scene, the pick is performed immediately.
 * When a node is picked (hit), then all nodes on the traversal path to that node that have "picked" listeners will
 * receive a "picked" event as they are rendered (see examples and wiki for more info).
 *
 * @param canvasX Canvas X-coordinate
 * @param canvasY Canvas Y-coordinate
 */
SceneJS.Scene.prototype.pick = function(canvasX, canvasY) {
    if (!this._sceneId) {
        throw new SceneJS.errors.InvalidSceneGraphException
                ("Attempted pick on Scene that has been destroyed or not yet rendered");
    }
    SceneJS._pickModule.pick(canvasX, canvasY); // Enter pick mode
    if (!this._running) {
        this._render(); // Pick-mode traversal - get picked element and fire events
        this._render(); // Render-mode traversal - process events with listeners while drawing
    }
};

/**
 * Returns count of active processes. A non-zero count indicates that the scene should be rendered
 * at least one more time to allow asynchronous processes to complete - since processes are
 * queried like this between renders (ie. in the idle period), to avoid confusion processes are killed
 * during renders, not between, in order to ensure that this count doesnt change unexpectedly and create
 * a race condition.
 */
SceneJS.Scene.prototype.getNumProcesses = function() {
    return (this._sceneId) ? SceneJS._processModule.getNumProcesses(this._sceneId) : 0;
};

/** Destroys this scene. You should destroy
 * a scene as soon as you are no longer using it, to ensure that SceneJS does not retain
 * resources for it (eg. shaders, VBOs etc) that are no longer in use. A destroyed scene
 * becomes un-destroyed as soon as you render it again. If the scene is currently rendering in a loop (after a call
 * to {@link #start}) then the loop is stopped.
 */
SceneJS.Scene.prototype.destroy = function() {
    if (this._sceneId) {
        this.stop();
        SceneJS._sceneModule.destroyScene(this._sceneId); // Last one fires RESET command
        this._sceneId = null;
    }
};

/** Returns true if scene active, ie. not destroyed. A destroyed scene becomes active again
 * when you render it.
 */
SceneJS.Scene.prototype.isActive = function() {
    return (this._sceneId != null);
};

/** Stops current render loop that was started with {@link #start}. After this, {@link #isRunning} will return false.
 */
SceneJS.Scene.prototype.stop = function() {
    if (this._running) {
        this._running = false;
        window["__scenejs_renderScene" + this._sceneId] = null;
        window.clearInterval(this._pInterval);
    }
};

/** Factory function that returns a new {@link SceneJS.Scene} instance
 * @param {Arguments} args Variable arguments that are passed to the SceneJS.Scene constructor
 * @returns {SceneJS.Scene}
 */
SceneJS.scene = function() {
    var n = new SceneJS.Scene();
    SceneJS.Scene.prototype.constructor.apply(n, arguments);
    return n;
};

/** Total SceneJS reset - destroys all scenes and cached resources.
 */
SceneJS.reset = function() {
    var scenes = SceneJS._sceneModule.getAllScenes();
    var temp = [];
    for (var i = 0; i < scenes.length; i++) {
        temp.push(scenes[i]);
    }
    while (temp.length > 0) {

        /* Destroy each scene individually so it they can mark itself as destroyed.
         * A RESET command will be fired after the last one is destroyed.
         */
        temp.pop().destroy();
    }
};

