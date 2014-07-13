var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectId;

FatFeedback = function(host, port){
this.db = new Db('fatDB', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatFeedback.prototype.getCollection=function(callback){
this.db.collection('feedback', function(error, feedback_collection){
   if(error) callback(error);
   else callback(null, feedback_collection);
	
	});
};

FatFeedback.prototype.saveFeedback = function(feedback, callback){
this.getCollection(function(error, feedback_collection){
  if(error) callback(error)
  else{
    feedback_collection.insert(feedback, function(){
	 callback(null, feedback);
	});
}

});
};

exports.FatFeedback = FatFeedback;

