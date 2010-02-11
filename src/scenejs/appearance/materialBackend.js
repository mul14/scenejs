/**
 * Backend for a material node, feeds given material properties into the active shader and retains them.
 */
SceneJs.backends.installBackend(
        new (function() {

            this.type = 'material';

            var ctx;

            this.install = function(_ctx) {
                ctx = _ctx;

                ctx.material = (function() {

                    var material;
                    var loaded = false;

                    ctx.events.onEvent("scene-activated", function() {
                        material = {  // Default to some colour so we'll see at least something while debugging a scene
                            ambient:  { r: .3, g : .3, b : .3 },
                            diffuse:  { r: 1, g : 1, b : 1 },
                            specular: { r: 1, g : 1, b : 1 },
                            shininess:{ r: 0, g : 0, b : 1 }
                        };
                        loaded = false;
                    });

                    /** When a program is deactivated we may need to re-load into the previously active program
                     */
                    ctx.events.onEvent("program-deactivated", function() {
                        loaded = false;
                    });

                    /**
                     * When geometry is about to render we load our material if not loaded already
                     */
                    ctx.events.onEvent("geo-drawing", function() {
                        if (!loaded) {
                            ctx.programs.setVar('scene_Material', material);
                            loaded = true;
                        }
                    });

                    return {

                        setMaterial : function(m) {
                            material = m;
                            loaded = false;
                        },

                        getMaterial : function() {
                            return material;
                        }
                    };
                })();

            };

            this.setMaterial = function(material) {
                ctx.material.setMaterial(material);
            };

            this.getMaterial = function() {
                return ctx.material.getMaterial();
            };

        })());