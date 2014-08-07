var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

FatProfile = function(host, port){
this.db = new Db('fatDB', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatProfile.prototype.getCollection=function(callback){
this.db.collection('profiles', function(error, profiles_collection){
   if(error) callback(error);
   else callback(null, profiles_collection);
	
	});
};


FatProfile.prototype.addProfile = function(profile, callback){
this.getCollection(function(error, profiles_collection){
  if(error) callback(error);
  else{
    profiles_collection.insert(profile, function(error, profile){
	 try{
		 if(error) callback(error);
		 else{
		    callback(null, profile);
		 }
	 } catch (ex) {
		callback(ex);
	}
	});
}

});
};



exports.FatProfile = FatProfile;
