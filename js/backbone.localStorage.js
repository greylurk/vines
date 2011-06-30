// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.
// Generate four random hex digits.
function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
window.Store = function(name) {
    this.name = name;
    var store = localStorage.getItem(this.name);
    this.records = (store && store.split(",")) || [];
};

_.extend(Store.prototype, {

    // Save the current state of the **Store** to *localStorage*.
    save: function() {
        localStorage.setItem(this.name, this.records.join(","));
    },

    // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
    // have an id of it's own.
    create: function(model) {
        if (!model.id) model.set({id: guid()});
        localStorage.setItem(this.name + "-" + model.id, JSON.stringify(model));
        this.records.push(model.id.toString());
        this.save();
        return model;
    },

    // Update a model by replacing its copy in `this.data`.
    update: function(model) {
        localStorage.setItem(this.name + "-" + model.id, JSON.stringify(model));
        if (!_.include(this.records, model.id.toString())) this.records.push(model.id.toString());
        this.save();
        return model;
    },

    // Retrieve a model from `this.data` by id.
    find: function(model) {
        return JSON.parse(localStorage.getItem(this.name + "-" + model.id));
    },

    // Return the array of all models currently in storage.
    findAll: function() {
        return _.map(this.records,
        function(id) {
            return JSON.parse(localStorage.getItem(this.name + "-" + id))
        },
        this);
    },

    // Delete a model from `this.data`, returning it.
    destroy: function(model) {
        localStorage.removeItem(this.name + "-" + model.id);
        this.records = _.reject(this.records,
        function(record_id) {
            return record_id == model.id.toString();
        });
        this.save();
        return model;
    },

    // Clear **localStorage**
    clear: function() {
        //localStorage.clear(); //removes all storage
        localStorage.removeItem(this.name);
        _.each(this.records,$.proxy(function(todo) {
          localStorage.removeItem(this.name + "-" + todo.id);
        },this));
        this.records = [];
    },

    // Retrieve from the database into *localStorage*.
    loadFromDB: function(url, success, error) {
        Backbone.sync = Backbone.syncLocal;
        // setup response handlers
        var lfSuccess = $.proxy(function(records, asuccess, response){
          this.clear();
          var store = _.pluck(records, "id").join(",");
          localStorage.setItem(this.name, store);
          $(records).each($.proxy(function(index, item) {
              localStorage.setItem(this.name + "-" + item.id, JSON.stringify(item));
          },this));
          this.records = (store && store.split(",")) || [];
          success && success(records, asuccess, response);
        },this);
        var lfError = $.proxy(function(response, error, message) {
            error && error(response, error, message);
        },
        this);
        // Compile JSON-request options.
        var params = {
            url: url,
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            processData: false,
            success: lfSuccess,
            error: lfError
        };
        // Make the request.
        $.ajax(params);
    },
    
    // Saves all of it to the server
    saveToDB: function(url, success, error) {
      
      var records = this.findAll();
      var data = JSON.stringify(records);
      
      // setup response handlers
      var lfSuccess = $.proxy(function(records, asuccess, response){
        this.clear();
        // update todos to use new server provided ids
        $(records).each($.proxy(function(index, item){
          var todo = Todos.get(item.from_id);
          todo.set({
            id: item.id
          });
          this.update(todo);
          },this));
      },this);
      var lfError = $.proxy(function(response, error, message) {
        error && error(response, error, message);
      },
      this);
      
      // Compile JSON-request options.
      var params = {
          url: url,
          type: 'PUT',
          contentType: 'application/json',
          data: data,
          dataType: 'json',
          processData: false,
          success: lfSuccess,
          error: lfError
      };
      // Make the request.
      $.ajax(params);
    }

});

// Override `Backbone.sync` to use delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
Backbone.syncLocal = function(method, model, success, error) {

    var resp;
    var store = model.localStorage || model.collection.localStorage;

    switch (method) {
    case "read":
        resp = model.id ? store.find(model) : store.findAll();
        break;
    case "create":
        resp = store.create(model);
        break;
    case "update":
        resp = store.update(model);
        break;
    case "delete":
        resp = store.destroy(model);
        break;
    }

    if (resp) {
        success(resp);
    } else {
        error("Record not found");
    }
};
Backbone.origSync = Backbone.sync;

// To use **localStorage**
// Backbone.sync = Backbone.syncLocal;