window.WebSQL = function( name ) {
    this.db = openDatabase( name, "1.0", "Backbone.js WebSQL storage", 20 * 1024 * 1024 );
    this.db.transaction(function( tx ) {
        tx.executeSql(
            "CREATE TABLE IF NOT EXISTS models ( id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT )",[]
        );
    });
};

_.extend(WebSQL.prototype, {
    
    // First insert a null row, to get an ID, then assign the ID to the model
    // and update the JSON string representing the model into the database
    create: function( model ) {
        this.db.transaction( function(tx) {
            tx.executeSql( "INSERT INTO models ( data ) values ( null )",[],function(tx,rs) {
                console.info("Got new id:" + rs.insertId);
                model.set({id: rs.insertId});
                tx.executeSql("UPDATE models SET data=? WHERE id=?",[JSON.stringify(model),model.id]);
            }, function(tx,err) {
                console.error(err);
            });
        });
        return model;
    },
    
    // Read a single item 
    find: function( model, success, error ) {
        var result;
        this.db.readTransaction( function(tx) {
            tx.executeSql("SELECT data FROM models WHERE id=?",[model.id],function(tx,rs){
                result = rs.rows.item(0).data;
                success( JSON.parse(result) );
            }, function( tx, err ) {
                error( JSON.stringify(err) );
            });
        });
    },
    
    findAll: function( success, error ) {
        var result;
        this.db.readTransaction(function(tx) {
            tx.executeSql("SELECT * FROM models",[],function( tx, rs ) {
                result = _.map(rs.rows,function(row){
                    return JSON.parse(row.data);
                });
                success( result );
            }, function( tx, err ) {
                error( JSON.stringify(err ) );
            });
        });
    },
    
    update: function( model ) {
        this.db.transaction( function(tx) {
            tx.executeSql("UPDATE models SET data=? WHERE id=?",[JSON.stringify(model),model.id]);
        });
        return model;
    },
    
    destroy: function( model ) {
        this.db.transaction( function(tx) {
            tx.executeSql("UPDATE models SET data=? WHERE id=?",[JSON.stringify(model),model.id]);
        });
    }
});

Backbone.syncWebSQL = function(method, model, success, error) {
    var resp;
    var store = model.webSQL || model.collection.webSQL;

    switch (method) {
    case "read":
        if( model.id ) {
            store.find(model, success );
        } else {
            store.findAll( success );
        }
        return;
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

Backbone._webSQL_origSync = Backbone.sync;
