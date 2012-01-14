
App.Collections.CharacterCollection = Backbone.Collection.extend({
    localStorage: new Store("Characters"),
    model: App.Models.Character
});

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
