window.App = {
    Models: { },
    Collections: {},
    Views: {},
    Controllers: {}
}

App.Models.NPC = Backbone.Model.extend({
    ATTRIBUTES: [ 'Intelligence','Wits','Composure','Strength','Dexterity','Stamina','Presence','Manipuation','Composure'],
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

App.Collections.NPCCollection = Backbone.Collection.extend({
    localStorage: new Store("NonPlayerCharacters"),
    model: App.Models.NPC
});

App.Views.NPCView = Backbone.View.extend({
    tagName: "li",
    className: "npc",
    template: _.template('<div id="npc-link-template"><span class="npc-link"></span><span class="npc-destroy"></span></div>'),
    events: {
        "click .npc-link"    : "showDetail",
        "click .npc-destroy" : "destroy"
    },
    
    initialize: function( options ) {
        _.bindAll(this,'render');
        this.model.bind('change',this.render);
        this.model.view = this;
    },
    
    render: function() {
        $(this.el).html(this.template( this.model.toJSON()));
        $(this.el).attr("id","npc-"+this.model.id);
        this.setContent();
        return this;
    },
    
    setContent: function() {
        this.$(".npc-link").html(this.model.get("name"));
    },
    
    showDetail: function() {
        window.location.hash='npc/'+this.model.id;
    },
    
    destroy: function() {
        this.model.destroy();
        $(this.el).remove();
    }
});

App.Views.StatPanel = Backbone.View.extend({
    initialize: function( options ) {
        this._options = options;
        _.bindAll(this, "updateValue");
        this.model.bind('change', this.updateValue);
    },
    
    events: {
        'change .stat-field': "saveValue"
    },
    
    className: "skill",
    template: _.template("<label for='<%=varName%>'><%=label%><input name='<%=varName%>' type='number' min='1' max='5' class='stat-field' value='<%=value%>' /></label>"),
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
    },
    updateValue: function() {
        var value = this.model.get(this._options.varName);
        this.$(".stat-field").val( value );
    }
});

App.Views.SkillPanel = App.Views.StatPanel.extend({});
App.Views.AttributePanel = App.Views.StatPanel.extend({});
        
App.Views.NavBarView = Backbone.View.extend({
    initialize: function( options ) {
    },
    
    events: {
        "click #nav-back-button": "back"        
    },
    
    back: function() {
        history.go(-1);
    },
    
    render: function() {
        return this;
    },
    
    setTitle: function( title ) {
        this.$(".title").html(title);
    },
    
    showBackButton: function( hash ) {
        this.$(".back-button").show();
    },
    
    hideBackButton: function() {
        this.$(".back-button").hide();
    }
});

App.Views.MainView = Backbone.View.extend({
    events: {
        "keypress .create-npc": "create"        
    },
    
    render: function() {
        this.input = this.$(".create-npc");
        this.model.fetch();
        return this;
    },
    
    initialize:function() {
        $(this.el).html( _.template($("#main-view").html())(this.model.attributes) );
        _.bindAll( this, "addOne", "addAll");
        this.model.bind('add',     this.addOne);
        this.model.bind('refresh', this.addAll);
    },
    
    
    addOne: function( npc ) {
        var view = new App.Views.NPCView({model:npc});
        this.$(".npc-list").append(view.render().el);
    },
    
    addAll: function() {
        this.$(".npc-list").empty();
        this.model.each( this.addOne );
    },
    
    create:function( e ) {
        if (e.keyCode != 13) return;
        var $input = this.$(".create-npc");
        this.model.create({
            name: $input.val()
        });
        $input.val("");
    },
    
    getTitle: function() {
        return "Characters";
    },
    
    isMainView: function() {
        return true;
    }
});

App.Views.DetailView = Backbone.View.extend({
    initialize: function( options ) {
        _.bindAll(this, "update");
        this.model.bind("change", this.update);
    },

    render: function() {
        $(this.el).html( _.template($("#detail-view").html())(this.model.attributes) );
        var attributePanel = this.$(".attribute-panel");
        var skillPanel = this.$(".skill-panel");
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
    },
    
    update: function() {
        
    },
    
    getTitle: function() {
        return "Details for " + this.model.get("name");
    },
    
    isMainView: function() {
        return false;
    }
});

App.Controllers.AppController = Backbone.Controller.extend({
    _currentView: null,

    initialize: function( options ) {
        this.NPCs = options.npcs || new App.Collections.NPCCollection();
        this.navBar = options.navBar || new App.Views.NavBarView();
        this.mainView = new App.Views.MainView({model:this.NPCs});
    },
    
    setTitle: function( title ) {
        this.navBar.setTitle( title );
    },
    
    showBackButton: function() {
        this.navBar.showBackButton();
    },
    
    hideBackButton: function() {
        this.navBar.hideBackButton();
    },
    
    routes: {
        "":     "main",
        "npc/:id":  "details"
    },
    
    main: function() {
        this.showView( this.mainView );
    },
    
    details: function( id ) {
        var npc = new App.Models.NPC({id:id});
        npc.collection = this.NPCs;
        npc.fetch();
        this.showView( new App.Views.DetailView({model:npc}) );
    },

    updateTitle: function() {
        this.setTitle(this._currentView.getTitle());
    },
    
    showView: function( view ) {
        this._currentView = view;
        this.setTitle( view.getTitle() );
        this[(view.isMainView()?"hide":"show")+"BackButton"]();
        if( view.model ) {
                view.model.bind("change", _.bind(this.updateTitle, this ) );
        }
        $("#main")
            .empty()
            .append( view.render().el );
    }
});

$(function() {    
    
        
    /*
     * Override Backbone.sync to save to HTML5 WebSQL database instead of a 
     * remote server.
     */ 
    Backbone.sync = Backbone.syncLocal;    

    var controller = new App.Controllers.AppController({
        /* Inject Models */
        npcs: new App.Collections.NPCCollection(),
        
        /* Inject Views */
        navBar: new App.Views.NavBarView({el:$("#nav-bar").get(0)})
        
    });
    
    Backbone.history.start();
});