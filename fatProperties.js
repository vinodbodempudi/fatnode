var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

var fs = require('fs');
var AWS = require('aws-sdk'); 
AWS.config.loadFromPath('./config.json');

var log4js = require( "log4js" );
log4js.configure( "log4js.json" );
var logger = log4js.getLogger( "test-file-appender" );

FatProperties = function(host, port){
this.db = new Db('fatDB', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatProperties.prototype.getCollection=function(callback){
this.db.collection('properties', function(error, properties_collection){
	try{
   		if(error) callback(error);
   		else callback(null, properties_collection);
	} catch (ex) {
		callback(error);
	}
	});
};

FatProperties.prototype.getAgentBuilderCollection=function(callback){
this.db.collection('properties', function(error, agentBuilder_collection){
	try{
   		if(error) callback(error);
   		else callback(null, agentBuilder_collection);
	} catch (ex) {
		callback(error);
	}
	});
};

FatProperties.prototype.addProp = function(properties, callback) {
this.getCollection(function(error, properties_collection){
 if(error) callback(error);
  else{
    properties_collection.insert(properties.property, {safe:true}, function(error, properties){
	 try{
	 	if(error) throw (error);
	 	else{
	    	callback(null, properties);
	    }
	 } catch (ex) {
		callback(ex);
	}
});
}

});
};

FatProperties.prototype.addAgentBuilderDetails = function(user, callback) {
this.getAgentBuilderCollection(function(error, agentBuilder_collection){
 if(error) callback(error);
  else{
    agentBuilder_collection.insert(user, {safe:true}, function(error, user){
	 try{
	 	if(error) throw (error);
	 	else{
	    	callback(null, user);
	    }
	 } catch (ex) {
		callback(ex);
	}
});
}

});
};


FatProperties.prototype.getAllList = function(callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error);
  else{
    properties_collection.find().toArray(function(error, results){
	 if(error) callback(error);
	 else{
     callback(null, results);
	 }
	});
	}

});
};

FatProperties.prototype.getProperty = function(id, callback){
this.getCollection(function(error, properties_collection){
 if(error) callback(error);
  else{
     properties_collection.findOne({'_id': id}, function(error, result){
	 if(error) callback(error);
	 else{
     	callback(null, result);
	 }
	});
	}

});
};

FatProperties.prototype.list = function(city, locality, callback){
this.getCollection(function(error, properties_collection){
 if(error) callback(error);
  else{
    properties_collection.find({"user.city":city, "user.locality":locality},
    	{"details.mode":1 , "details.price.price":1, "details.monthlyRent":1, "createdDate":1, "details.title":1, "location.lat":1, "location.lng":1
    	,"details.bedRooms":1, "details.bathRooms":1, "details.area.builtUp.builtUp":1, "details.area.builtUp.builtUpInSqft":1, "details.area.builtUp.units":1
    	,"details.area.perUnitPrice":1, "details.area.priceUnit":1, "user.locality":1, "details.propertySubType":1, "urls.coverPhotoUrl.url":1}).toArray(function(error, properties){
		 if(error) callback(error);
		 else{
		 	callback(null, properties);
		 }
		});
	}

});
};
 
exports.FatProperties = FatProperties;
