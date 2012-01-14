
App.Views.MainView = Backbone.View.extend({
    events: {
        "keypress .create-character": "createKeyPress",
        "click .create-button": "createClick"
    },
    
    initialize:function() {
        _.bindAll( this, "createKeyPress", "createClick", "addOne", "addAll" );
        this.model.bind('add',   this.addOne);
        this.model.bind('reset', this.addAll);
        this.listing = this.$('.listing');
        this.input   = this.$(".create-character");
    },
    
    render: function() {
        this.model.fetch();
        return this;
    },
    
    addOne: function( character ) {
        var view = new App.Views.CharacterView({model:character});
        this.listing.append(view.render().el);
        if( this.listing.data('listview') ) {
            this.listing.listview('refresh');
        }
    },
    
    addAll: function() {
        this.$(".listing").empty();
        this.model.each( this.addOne );
    },
    
    createKeyPress: function( e ) {
        if( e.keyCode != 13 ) return;
        this.create();
    },
    
    createClick: function( e ) {
        this.create();
    },
    
    create: function( e ) {
        this.model.create({
            name: this.input.val()
        });
        this.input.val("");
    }
});