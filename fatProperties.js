var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

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

FatProperties.prototype.addProp = function(property, callback) {
this.getCollection(function(error, properties_collection){
 if(error) callback(error);
  else{
  
	if(property._id) {
		property._id = ObjectID(property._id);
	}
	
    properties_collection.save(property,  {safe:true}, function(error, properties){
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

FatProperties.prototype.updateProperty = function(request, callback) {
	this.getCollection(function(error, properties_collection){
	 if(error) callback(error);
	  else{
		properties_collection.update({_id:ObjectID(request._id)}, {$set: request.update}, function(error, properties){
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

FatProperties.prototype.getMyProperties = function(userId, email, callback){
this.getCollection(function(error, properties_collection){
	if(error) {
		callback(error);
	} else {
		properties_collection.find({'active': { $ne: 'D'}, $or:[{"user._id":userId}, {"user.email":email}, {"user.primaryEmail":email}]},
			{"active":1, "totalViews":1, "details.mode":1 , "details.price.price":1, "details.monthlyRent":1, "createdDate":1, "lastUpdatedDate":1, "details.title":1, "location.lat":1, "location.lng":1
			,"details.bedRooms":1, "details.bathRooms":1, "details.area.builtUp.builtUp":1, "details.area.builtUp.builtUpInSqft":1, "details.area.builtUp.units":1, "details.area.plotOrLand.plotOrLand":1, 
			"details.area.plotOrLand.units":1 ,"details.area.plotOrLand.plotOrLandInSqft":1, "details.area.perUnitPrice":1, "details.area.priceUnit":1, "details.area.perUnitUnits":1, "user.locality":1, "details.propertySubType":1, "urls.coverPhotoUrl.url":1}).toArray(function(error, properties){
			
			 if(error) callback(error);
			 else{
				callback(null, properties);
			 }
		});
	}

});
};

FatProperties.prototype.getPropertiesCount = function(city, callback){
    this.getCollection(function(error, properties_collection){
            if(error) {
                 callback(error);
            }
            else{
			
				properties_collection.find({"user.city":city, "active": { $ne: 'D'}}).toArray(function (e, properties) {
				  var property, totalRentProps=0, totalPlotOrLandProps=0, totalSellProps=0;
				  console.log("properties.length : " + properties.length)
				  for(var i=0; i < properties.length; i++) {
					property = properties[i];
					
					if(property.details.mode === 'Rent') {
						++totalRentProps;
						continue;
					}
					
					if(property.details.propertySubType === 'Land/Plot') {
						++totalPlotOrLandProps;
						continue;
					}
					
					if(property.details.mode === 'Sell') {
						++totalSellProps;
					}
				  
				  }
				  
				  callback(null, {totalRentProps:totalRentProps*2, totalPlotOrLandProps:totalPlotOrLandProps*2, totalSellProps:totalSellProps*2});
				});

                
                
            }
    });
};

FatProperties.prototype.getProperty = function(id, callback){
	this.getCollection(function(error, properties_collection){
	 if(error) callback(error);
	  else{
		 properties_collection.findOne({'_id': ObjectID(id)}, function(error, result){
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
    properties_collection.find({"user.city":city, "user.locality":locality, 'active': { $ne: 'D'}},
    	{"active":1, "totalViews":1, "details.mode":1 , "details.price.price":1, "details.monthlyRent":1, "createdDate":1, "lastUpdatedDate":1, "details.title":1, "location.lat":1, "location.lng":1
    	,"details.bedRooms":1, "details.bathRooms":1, "details.area.builtUp.builtUp":1, "details.area.builtUp.builtUpInSqft":1, "details.area.builtUp.units":1,
    	"details.area.plotOrLand.plotOrLand":1, "details.area.plotOrLand.units":1 ,"details.area.plotOrLand.plotOrLandInSqft":1,"details.area.perUnitPrice":1,"details.area.perUnitUnits":1, "details.area.priceUnit":1, "user.locality":1, "details.propertySubType":1, "urls.coverPhotoUrl.url":1}).toArray(function(error, properties){
		 if(error) callback(error);
		 else{
		 	callback(null, properties);
		 }
		});
	}

});
};
 
exports.FatProperties = FatProperties;
