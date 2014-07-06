
/**
 * Module dependencies.
 */

var express = require('express');
var logger = require('morgan');
var http = require('http');
var path = require('path');
var app = express();
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var FatUser = require('./fatUser').FatUser;
var fatUser= new FatUser('localhost', 27017);

var FatCities = require('./fatcities').FatCities;
var fatCities= new FatCities('localhost', 27017);

var FatProperties = require('./fatproperties').FatProperties;
var fatProperties = new FatProperties('localhost', 27017);

var fs = require('fs');
var AWS = require('aws-sdk'); 
AWS.config.loadFromPath('./config.json');

var log4js = require( "log4js" );
log4js.configure( "log4js.json" );
var log = log4js.getLogger( "test-file-appender" );

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
    next();
});

app.post('/users', function(req, res) {
    console.log("inside post method");
    var user = req.body;
	console.log(user);
     fatUser.addUser(user, function(error, user){
	    if(error){
		   if(error.code==11000){
		    log.error(error + 'Duplicate User');
			res.send({error:'Duplicate User'});
		   }
		   else{
		    res.send(error);
		   }
		}else{
		   res.send(user);
		}
	 });
	 });
	 
app.get('/users', function(req, res) {
 console.log("inside get all method");
 
    fatUser.list(function(error, users){
	    if(error){
	    	log.error(error);
			res.send(error);
		}
		else{
			res.send(users);
		}
		});
	
	});

app.get('/users/:email', function(req, res) {
 console.log("inside get method");
   
   var  email = req.params.email;
   console.log("email:"+email);
   fatUser.findByEmail(email, function(error, user){
					
		if(error){
			log.error(error);
			res.send(error)
		}
		else{
			res.send(user);
		}
		});
	});

app.post('/properties', function(req, res) {
    console.log("inside post method");
    var properties = req.body;
	log.info(properties);
	var urls = new Object();
	var count = 0;
    try{
	if(properties.images.userImage) {
	    	var buffer =  new Buffer(properties.images.userImage.data, 'base64');
	    	var s3bucket = new AWS.S3();
			s3bucket.createBucket(function() {
			var d = {
						Bucket: 'fathome-images',
						//'Content-Type' : 'image/png',
						Key: properties.property.user.name + "." + properties.images.userImage.ext,	
						Body: buffer,
						ACL: 'public-read'
					};				
					s3bucket.putObject(d, function(err, res) {
					if (err) {
						log.error("Error uploading data: ", err);
					} else {
						urls.userUrl = res;
						log.info(res);
						log.info("Successfully uploaded data to myBucket/myKey");
					}
				});
			});
	}
	if(properties.images.propertyImages) {
		var uuid = generateUUID();
		var properties_Url = new Array();
		var imageUrl;
		for(var i=0; i<properties.images.propertyImages.length; i++) {
			var currentImage =properties.images.propertyImages[i]; 
	    	uploadToAmazonS3(currentImage, properties.property.user.city, properties.property.user.locality, uuid, properties_Url,i, properties);	
		}
		urls.propertyUrls = properties_Url;
	}
	 properties.property.urls = urls;

     fatProperties.addProp(properties, function(error, properties){
	    if(error){
		   if(error.code==11000){
		   	log.error(error + ' Duplicate properties');
			res.send({error:'Duplicate properties'});
		   }
		   else{
		   	log.info(error);
		    res.send(error);
		   }
		}else{
		   res.send(properties);
		}
	 });

 } catch(ex) {
 	log.error(ex);
 }
});

function uploadToAmazonS3(currentImage, city, locality, uuid, properties_Url, count, properties) {
	var imageUrl = {};
	var buffer =  new Buffer(currentImage.data, 'base64');
	    	var s3bucket = new AWS.S3();
	    	var date = new Date();
	    	var dateString = (date.getMonth()+1)+'-'+date.getDate()+'-'+date.getFullYear();
			s3bucket.createBucket(function() {
			var d = {
				Bucket: 'fathome-images/' + dateString + '/' + city +'/'+locality+'/'+uuid,
				//'Content-Type' : 'image/png',
				Key: count+"."+currentImage.ext,	
				Body: buffer,
				ACL: 'public-read'
				};				
				s3bucket.putObject(d, function(err, res) {
				if (err) {
					log.error("Error uploading data: ", err);
				} else {
					imageUrl.url = res;
					if(currentImage.coverPhoto) {
						imageUrl.coverPhoto = currentImage.coverPhoto;
					}
					properties_Url[count] = imageUrl;
					log.info(res);
					console.log("Successfully uploaded data to myBucket/myKey");
				}
			});
		});	
}

app.get('/properties', function(req, res) {
 console.log("inside get all method");
 
    fatProperties.getAllList(function(error, properties){
	    if(error){
	    	log.error(error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(properties);
		}
		});
});

app.get('/properties/:id', function(req, res) {
 console.log("inside get all method");
 	var id = req.params.id;
 	console.log("id:"+id);
 	var document_id = new require('mongodb').ObjectID(id);
    fatProperties.getProperty(document_id, function(error, property) {
	    if(error){
	    	log.error(error);
			res.send("Something went wrong please try again");
		}
		else{
			log.info(property);
			res.send(property);
		}
		});
});

app.get('/properties/:city/:locality', function(req, res) {
 console.log("inside find method");

 	var  city = req.params.city;
    console.log("city:"+city);

    var  locality = req.params.locality;
    console.log("locality:"+locality);

    fatProperties.list(city, locality, function(error, properties){
	    if(error){
	    	log.error(error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(properties);
		}
		});
	
});

app.get('/cities', function(req, res) {
 console.log("inside get cities method");
 
    fatCities.list(function(error, cities){
	    if(error){
	    	log.error(error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(cities);
		}
		});
	
	});


app.get('/localities/:city', function(req, res) {
 console.log("inside get localities method");
   
   var  city = req.params.city;
   //console.log("city:"+city);
   fatCities.getLocalities(city, function(error, localities){
					
		if(error){
			log.error(error);
			res.send("Something went wrong please try again")
		}
		else{
			res.send(localities);
		}
		});
	});


app.get('/', function(req, res) {
  // fatUser.list(function(error, users){
	//				res.render('userlist', {"users": users});
		//			});
			res.send('Hello World!');		
	
});

http.createServer(app).listen(app.get('port'), function(){
  log.info('Express server listening on port ' + app.get('port'));
  console.log('Express server listening on port ' + app.get('port'));
});

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
};

var d = require('domain').create();
d.on('error', function(er) {
  console.log('error', er.message);
});

d.run(function() {
  require('http').createServer(function(req, res) {
    handleRequest(req, res);
  }).listen(PORT);
});