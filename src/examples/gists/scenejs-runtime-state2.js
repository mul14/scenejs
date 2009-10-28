var graph = SceneJs.graph(
           	SceneJs.node({

           	        preVisit: function(nodeContext) {

           	 		    // Parent node gets frontend context from node context

           	 		    // and sets something on it for child

           	          	    var graphContext = nodeContext.getGraphContext();
           	 		        graphContext.foo = 'Hi, child nodes!';

           	        },

           	        postVisit: function(nodeContext) {

           	 		    // Ordinarily each node should restore the frontend context
           	 		    // to its original state before it was modified on pre-visit

           	             var graphContext = nodeContext.getGraphContext();
           	 		    graphContext.foo = null;
           	        }
                },

                new SceneJs.node({
           	 		    preVisit: function(nodeContext) {

           		     		// Child node finds what parent set on frontend context

           	                var graphContext = nodeContext.getGraphContext();
           		     		alert('Message from parent: ' + graphContext.foo);
           	         	}
                    })
                 )
        );

// If not supplied, a default internal frontend runtime context is

// created that will not persist between traversals

graph.render();
