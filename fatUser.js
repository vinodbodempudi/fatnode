var Db = require('mongodb').Db;
var Connection = require('mongodb').connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

FatUser = function(host, port){
this.db = new Db('fatDB', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
this.db.open(function(){});
};

FatUser.prototype.getCollection=function(callback){
this.db.collection('users', function(error, users_collection){
   if(error) callback(error);
   else {
      users_collection.ensureIndex({email:1, phoneNumber:1}, {unique:true}, function(error, indexName) {
		if(error) callback(error);
		else
			callback(null, users_collection);
		});
	  }
	});
};

FatUser.prototype.addUser = function(user, callback){
this.getCollection(function(error, users_collection){
  if(error) callback(error)
  else{
    users_collection.insert(user, {safe:true}, function(error, user){
	 if(error){
	    console.log(error);
		callback(error);
	 }
	 else{
	    console.log(user);
		callback(null, user);
	 }
	});
}

});
};

FatUser.prototype.authenticate = function(userDetails, callback){
this.getCollection(function(error, users_collection){
  if(error) callback(error)
  else{
    users_collection.find({'email':userDetails.email, 'password':userDetails.password}).nextObject( function(error, result){
	 if(error) callback(error)
	 else{
	 console.log(result);
     callback(null, result)
	 }
	});
	}

});
};
FatUser.prototype.findUser = function(userId, callback){
	this.getCollection(function(error, users_collection){
	  if(error) { 
		callback(error)
	  }
	  else{
		users_collection.findOne({'_id': ObjectID(userId)}, function(error, result){
			if(error) { 
				callback(error);
			}
			else {
				callback(null, result);
			}
		})
	}

	});
};
FatUser.prototype.updateUser = function(userId, request, callback) {
	this.getCollection(function(error, users_collection){
	 if(error) callback(error);
	  else{
		users_collection.update({_id:ObjectID(userId)}, {$set: request}, function(error, user){
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

FatUser.prototype.list = function(callback){
this.getCollection(function(error, users_collection){
  if(error) callback(error)
  else{
    users_collection.find().toArray(function(error, results){
	 if(error) callback(error)
	 else{
     console.log(results[0]);
     callback(null, results)
	 }
	});
	}

});
};


exports.FatUser = FatUser;
