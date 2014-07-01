var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

var fs = require('fs');
var AWS = require('aws-sdk'); 
AWS.config.loadFromPath('./config.json');

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
	    /*console.log(properties);
	    var buffer =  new Buffer(properties[0].user.image, 'base64');
	    var s3bucket = new AWS.S3();
				s3bucket.createBucket(function() {
				var d = {
					Bucket: 'fathome-images',
					//'Content-Type' : 'image/png',
					Key: properties[0]._id+".jpg",	
					Body: buffer,
					ACL: 'public-read'
					};				
					s3bucket.putObject(d, function(err, res) {
			if (err) {
				console.log("Error uploading data: ", err);
			} else {
				console.log("Successfully uploaded data to myBucket/myKey");
			}
			});
		});
                /*var newPath = "C:\\fathome\\" + properties[0]._id+".png";
                console.log('newPath' + newPath);
                //write file to uploads/fullsize folder
                fs.writeFile(newPath, buffer, 'base64', function (err) {

                    if (err)
                        console.log("There was an error writing to folder");
                    else
                        console.log(err);
                    //res.redirect("/");

            });*/
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
    properties_collection.find({"user.city":city, "user.locality":locality}).toArray(function(error, properties_results){
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
			
			if(properties_results[i].location) {
				newOptimizedProperty.lat = properties_results[i].location.lat;
				newOptimizedProperty.lng = properties_results[i].location.lng;
			}
			
	 		newOptimizedProperty.bedRooms = properties_results[i].details.bedRooms;
			newOptimizedProperty.bathRooms = properties_results[i].details.bathRooms;
	 		newOptimizedProperty.builtUpSize = properties_results[i].details.area.builtUp.builtUp;
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
