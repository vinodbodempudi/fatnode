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
this.db = new Db('fatproperties', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatProperties.prototype.getCollection=function(callback){
this.db.collection('properties', function(error, properties_collection){
	try{
   		if(error) 
   			throw (error);
   		else callback(null, properties_collection);
	} catch (ex) {
		callback(error);
	}
	});
};

FatProperties.prototype.getAgentBuilderCollection=function(callback){
this.db.collection('properties', function(error, agentBuilder_collection){
	try{
   		if(error) 
   			throw (error);
   		else callback(null, agentBuilder_collection);
	} catch (ex) {
		callback(error);
	}
	});
};

FatProperties.prototype.addProp = function(properties, callback) {
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
    properties_collection.insert(properties.property, {safe:true}, function(error, properties){
	 try{
	 	if(error){
	    	console.log(error);
			throw (error);
	 	}
	 	else{
	    	console.log(properties);
	    	callback(null, properties);
	    }
	 } catch (ex) {
		logger.error(ex);
		callback(ex);
	}
});
}

});
};

FatProperties.prototype.addAgentBuilderDetails = function(user, callback) {
this.getAgentBuilderCollection(function(error, agentBuilder_collection){
  if(error) callback(error)
  else{
    agentBuilder_collection.insert(user, {safe:true}, function(error, user){
	 try{
	 	if(error){
	    	console.log(error);
			throw (error);
	 	}
	 	else{
	    	console.log(user);
	    	callback(null, user);
	    }
	 } catch (ex) {
		logger.error(ex);
		callback(ex);
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

FatProperties.prototype.getProperty = function(id, callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
     properties_collection.findOne({'_id': id}, function(error, result){
	 if(error) callback(error)
	 else{
     console.log(result);
     callback(null, result)
	 }
	});
	}

});
};

FatProperties.prototype.list = function(city, locality, callback){
this.getCollection(function(error, properties_collection){
  if(error) callback(error)
  else{
    properties_collection.find({"user.city":city, "user.locality":locality})
    	.toArray(function(error, properties_results){
		 if(error) callback(error);
		 else{
			var optimizingResults = new Array();
			for (var i = 0; i < properties_results.length; i++) {
				var newOptimizedProperty = new Object();
				newOptimizedProperty._id = properties_results[i]._id;
				newOptimizedProperty.mode = properties_results[i].details.mode;
				if(properties_results[i].details.price) {
					newOptimizedProperty.price = properties_results[i].details.price.price;
				} else {
					newOptimizedProperty.price = properties_results[i].details.monthlyRent;
				}
				newOptimizedProperty.createdDate = properties_results[i].createdDate;
				newOptimizedProperty.title = properties_results[i].details.title;
				if (properties_results[i].location) {
					newOptimizedProperty.lat = properties_results[i].location.lat;
					newOptimizedProperty.lng = properties_results[i].location.lng;
				}
				
				if (properties_results[i].urls && properties_results[i].urls.propertyUrls) {
					var propertyImage;
					for (var k = 0; k < properties_results[i].urls.propertyUrls.length; k++) {
						propertyImage = properties_results[i].urls.propertyUrls[k];
						if(propertyImage && propertyImage.coverPhoto) {
							newOptimizedProperty.coverPhotoUrl = propertyImage.url;
							break;
						}
					}
				}
				
				newOptimizedProperty.bedRooms = properties_results[i].details.bedRooms;
				newOptimizedProperty.bathRooms = properties_results[i].details.bathRooms;
				newOptimizedProperty.builtUpSize = properties_results[i].details.area.builtUp.builtUp;
				newOptimizedProperty.builtUpInSqft = properties_results[i].details.area.builtUp.builtUpInSqft;
				newOptimizedProperty.builtUpUnits = properties_results[i].details.area.builtUp.units;
				newOptimizedProperty.perUnitPrice = properties_results[i].details.area.perUnitPrice;
				newOptimizedProperty.priceUnit = properties_results[i].details.area.priceUnit;
				newOptimizedProperty.locality = properties_results[i].user.locality;
				newOptimizedProperty._type = properties_results[i].details['type'];
				newOptimizedProperty.propertySubType = properties_results[i].details.propertySubType;
				optimizingResults[i] = newOptimizedProperty;
			};
		 console.log(properties_results[0]);
		 callback(null, optimizingResults);
		 }
		});
	}

});
};

 
exports.FatProperties = FatProperties;
