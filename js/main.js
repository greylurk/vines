window.App = {
    Models: { },
    Collections: {},
    Views: {},
    Controllers: {}
};

App.Models.Character = Backbone.Model.extend({
    ATTRIBUTES: [ 'Intelligence','Wits','Composure','Strength','Dexterity','Stamina','Presence','Manipuation','Resolve'],
    SKILLS: [
        'Academics','Computer','Crafts','Investigation','Medicine','Occult','Politics','Science',
        'Athletics','Brawl','Drive','Firearms','Larceny','Stealth','Survival','Weaponry',
        'Animal Ken','Empathy','Expression','Intimidation','Persuasion','Socialize','Streetwise','Subterfuge'],
    EMPTY: "No Name",
    
    camelize: function(str)  { 
        return str.replace(/-+(.)?/g, function(match, chr){ 
            return chr ? chr.toUpperCase() : '' ;
        });
    },
    
    initialize: function() {
        if( !this.get("name")) {
            this.set({"name": this.EMPTY});
        }
    },
    
    rollSkill: function( attr, skill ) {
        var attrVal = this.get(this.camelize(attr));
        var skillVal = this.get(this.camelize(skill));
        return Math.random() * 10 + 1 + attrVal + skillVal ;
    }
});

App.Collections.CharacterCollection = Backbone.Collection.extend({
    localStorage: new Store("NonPlayerCharacters"),
    model: App.Models.Character
});

App.Views.CharacterView = Backbone.View.extend({
    tagName: "li",
    template: _.template('<a href="#character-details&id=<%=id%>" class="details-link"><%=name%></a><a href="#character-destroy&id=<%=id%>" class="destroy-link" data-split-icon="delete"></a>'),
    events: {
        "click .details-link": "details",
        "click .destroy-link": "destroy"
    },
    
    initialize: function( options ) {
        _.bindAll(this,'render',"details","destroy");
        this.model.bind('change',this.render);
        this.model.view = this;
    },
    
    details: function() {
        App.Controller.trigger("character-details", {id:this.model.id});
    },
    
    destroy: function() {
        App.Controller.trigger("character-destroy", {id:this.model.id});
    },
    
    render: function() {
        $(this.el)
            .html(this.template( this.model.toJSON()))
            .attr({
                id: "Character-"+this.model.id
                
            });
        return this;
    }
    
});

App.Views.StatPanel = Backbone.View.extend({
    className: "stat",
    template: _.template("<label for='<%=varName%>'><%=label%><input name='<%=varName%>' type='number' min='1' max='5' class='stat-field' value='<%=value%>' /></label>"),
    
    events: {
        'change .stat-field': "saveValue"
    },

    initialize: function( options ) {
        this._options = options;
        _.bindAll(this, "updateValue");
        this.model.bind('change', this.updateValue);
    },
    
    render: function() {
        $(this.el).html(this.template({
            varName: this._options.varName, 
            label: this._options.label, 
            value: this.model.get(this._options.varName)
        }));
        return this;
    },
    saveValue: function() {
        var values = {};
        values[this._options.varName] = this.$(".stat-field").val();
        this.model.set(values );
        this.model.save();
    },
    updateValue: function() {
        var value = this.model.get(this._options.varName);
        this.$(".stat-field").val( value );
    }
});

App.Views.SkillPanel = App.Views.StatPanel.extend({  className: "skill" });
App.Views.AttributePanel = App.Views.StatPanel.extend({  className: "attribute" });

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

App.Views.DetailView = Backbone.View.extend({
    tagName: "div",
    
    render: function() {
        var attributePanel = this.$(".attribute-panel").empty();
        var skillPanel = this.$(".skill-panel").empty();
        var model = this.model;
        _.each( this.model.ATTRIBUTES, function( item ) {
            attributePanel.append( new App.Views.AttributePanel({
                model:model,
                label:item,
                varName: model.camelize(item)
            }).render().el);
        });
        _.each( this.model.SKILLS, function( item, index, list ) {
            var skillView = new App.Views.SkillPanel({
                model: model,
                label: item,
                varName: model.camelize(item)
            });
            skillPanel.append(skillView.render().el);
        });
        return this;
    }
});

App.Controllers.AppController = Backbone.Router.extend( {    
	initialize: function( options ) {
		this.Characters = options.characters || new App.Collections.CharacterCollection();
		this.mainView = new App.Views.MainView({
		    el: $("#character-listing")[0],
		    model: this.Characters
		}).render();
		this.detailView = new App.Views.DetailView({el:$("#character-details")[0]});

		_.each( this.events, _.bind(function( eventName, fName ) {
		    this.bind( eventName, this[fName] );
		},this) );

		return this;
	},


    routes: {
        "#": "main",
        "#character-details?id=:id": "details",
        "#character-destroy?id=:id": "destroy"
    },
    
    main: function() {
        this.mainView.render();
    },
    
    details: function( id ) {
		debugger;
        var character = new App.Models.Character({id:id});
        character.collection = this.Characters;
        character.fetch({
            success: _.bind(function(model,response){
                this.detailView.model = model;
                this.detailView.render();
            },this)
        });
    },
    
    destroy: function( id ) {
        var character = new App.Models.Character({id:id});
        character.collection = this.Characters;
        character.destroy();
    }

});

$(function() {    
    
        
    /*
     * Override Backbone.sync to save to HTML5 WebSQL database instead of a 
     * remote server.
     */ 
    Backbone.sync = Backbone.syncLocal;    

    App.Controller = new App.Controllers.AppController({
        /* Inject Models */
        characters: new App.Collections.CharacterCollection(),
        
    });
    
});
