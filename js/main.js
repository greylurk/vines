window.App = {
    Models: { },
    Collections: {},
    Views: {},
    Controllers: {}
};

App.Views.CharacterView = Backbone.View.extend({
    tagName: "li",
    template: _.template('<a href="details.html?id=<%=id%>" class="details-link"><%=name%></a><a href="#character-destroy?id=<%=id%>" class="destroy-link" data-split-icon="delete"></a>'),
    
    initialize: function( options ) {
        _.bindAll(this,'render');
        this.model.bind('change',this.render);
        this.model.view = this;
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
