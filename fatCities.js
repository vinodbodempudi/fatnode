var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

var log4js = require( "log4js" );
log4js.configure( "log4js.json" );
var logger = log4js.getLogger( "test-file-appender" );

FatCities = function(host, port){
this.db = new Db('fatcities', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatCities.prototype.getCollection=function(callback){
this.db.collection('cities', function(error, cities_collection){
   if(error) callback(error);
   else callback(null, cities_collection);
	
	});
};


FatCities.prototype.list = function(callback){
this.getCollection(function(error, cities_collection){
   //console.log("inside DB");	
  if(error) callback(error)
  else{
    cities_collection.distinct('city', function(error, cities){
	 if(error) {
	 	logger.debug(error);
	 	callback(error);
	 }
	 else{
     	callback(null, cities);
	 }
	});
	}

});
};


FatCities.prototype.getLocalities = function(city, callback){
this.getCollection(function(error, cities_collection){
  if(error) callback(error)
  else{
    cities_collection.find({'city':city}).sort({'locality':1}).toArray(function(error, localities){
	 if(error) callback(error)
	 else{
	// console.log(localities);
     callback(null, localities)
	 }
	});
	}

});
};



exports.FatCities = FatCities;
