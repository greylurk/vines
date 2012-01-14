
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

App.Views.SkillPanel = App.Views.StatPanel.extend({});
App.Views.AttributePanel = App.Views.StatPanel.extend({});


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
