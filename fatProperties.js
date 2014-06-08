var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

FatProperties = function(host, port){
this.db = new Db('fatproperties', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatProperties.prototype.getCollection=function(callback){
this.db.collection('properties', function(error, properties_collection){
   if(error) callback(error);
   else callback(null, properties_collection);
	});
};

FatProperties.prototype.addProp = function(properties, callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
    properties_collection.insert(properties, {safe:true}, function(error, properties){
	 if(error){
	    console.log(error);
		callback(error);
	 }
	 else{
	    console.log(properties);
		callback(null, properties);
	 }
	});
}

});
};

FatProperties.prototype.getAllList = function(callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
    properties_collection.find().toArray(function(error, results){
	 if(error) callback(error)
	 else{
     console.log(results[0]);
     callback(null, results)
	 }
	});
	}

});
};

FatProperties.prototype.list = function(city, locality, callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
    properties_collection.find({"user.city":city, "user.locality":locality}).toArray(function(error, properties_results){
	 if(error) callback(error);
	 else{
     console.log(properties_results[0]);
     callback(null, properties_results);
	 }
	});
	}

});
};

 
exports.FatProperties = FatProperties;