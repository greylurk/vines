$(function() {    
    /*
     * Override Backbone.sync to save to HTML5 WebSQL database instead of a 
     * remote server.
     */ 
    Backbone.sync = Backbone.syncLocal;    

    App.Controller = new App.Controllers.IndexController({
        /* Inject Models */
        characters: new App.Collections.CharacterCollection()
        
    });
    
    Backbone.history.start();  
});

App.Controllers.IndexController = Backbone.Router.extend( {    
	initialize: function( options ) {
		this.Characters = options.characters || new App.Collections.CharacterCollection();
		this.detailView = new App.Views.DetailView({el:$("#character-details")[0]});

		_.each( this.events, _.bind(function( eventName, fName ) {
		    this.bind( eventName, this[fName] );
		},this) );

		return this;
	},


    routes: {
        "?id=:id": "details",
    },
    
    details: function( id ) {
        var character = new App.Models.Character({id:id});
        character.collection = this.Characters;
        character.fetch({
            success: _.bind(function(model,response){
                this.detailView.model = model;
                this.detailView.render();
            },this)
        });
        this.detailView.model = character;
        this.detailView.render();
    },
    
    destroy: function( id ) {
        var character = new App.Models.Character({id:id});
        character.collection = this.Characters;
        character.destroy();
		this.mainView.render();
    }

});