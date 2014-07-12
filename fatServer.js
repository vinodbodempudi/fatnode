
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

var FatCities = require('./fatCities').FatCities;
var fatCities= new FatCities('localhost', 27017);

var FatProperties = require('./fatProperties').FatProperties;
var fatProperties = new FatProperties('localhost', 27017);

//var FatFeedback = require('./fatFeedback').FatFeedback;
//var fatFeedback= new FatFeedback('localhost', 27017); 

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

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb'}));
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
	var count = 0, amazonS3Url='http://s3.amazonaws.com/', userImageUploaded = true, propertyImagesUploaded = true;
    try{
		properties.property.urls = {};
		if(properties.images.userImage) {
				userImageUploaded = false;
				var buffer =  new Buffer(properties.images.userImage.data, 'base64');
				var s3bucket = new AWS.S3();
				var bucket = 'fathome-images'
				var fileName = properties.property.user.name + "." + properties.images.userImage.ext;
				s3bucket.createBucket(function() {
					var d = {
							Bucket: bucket,
							//'Content-Type' : 'image/png',
							Key: fileName,	
							Body: buffer,
							ACL: 'public-read'
						};				
						s3bucket.putObject(d, function(err, res) {
							userImageUploaded = true;
							if (err) {
								log.error("Error uploading data: ", err);
							} else {
								properties.property.urls.userUrl = amazonS3Url + bucket + '/' + fileName;
								log.info("saved user photo success");
							}
							
							saveProperty(properties, userImageUploaded, propertyImagesUploaded);
					});
				});
		}
		console.log("property images c0unt : " + properties.images.propertyImages.length);
		if(properties.images.propertyImages) {
			propertyImagesUploaded = false;
			var uuid = generateUUID(), imageUrl, date = new Date();
			var dateString = (date.getMonth()+1)+'-'+date.getDate()+'-'+date.getFullYear();
			var bucket = 'fathome-images/' + dateString + '/' + properties.property.user.city +'/'+properties.property.user.locality+'/'+uuid;
			properties.property.urls.propertyUrls = [];
			for(var i=0; i<properties.images.propertyImages.length; i++) {
				
				var currentImage =properties.images.propertyImages[i]; 
				(function uploadToAmazonS3(currentImage, count) {
					
						var imageUrl = {};
						var buffer =  new Buffer(currentImage.data, 'base64');
						var s3bucket = new AWS.S3();
						var fileName = count+"."+currentImage.ext;
						
						s3bucket.createBucket(function() {
						var d = {
							Bucket: bucket,
							Key: fileName,	
							Body: buffer,
							ACL: 'public-read'
							};				
							s3bucket.putObject(d, function(err, res) {
								
								if (err) {
									log.error("Error uploading data: ", err);
								} else {
									imageUrl.url = amazonS3Url + bucket + '/' + fileName;;
									if(currentImage.coverPhoto) {
										imageUrl.coverPhoto = currentImage.coverPhoto;
									}
									properties.property.urls.propertyUrls[count] = imageUrl;
									log.info("Successfully uploaded image: " + count);
								}
								
								if(count === properties.images.propertyImages.length-1) {
									propertyImagesUploaded = true;
									saveProperty(properties, userImageUploaded, propertyImagesUploaded);
								}
								
							});
					});	
				}(currentImage, i))
			}
		}
		
	 } catch(ex) {
		log.error(ex);
	 }
	 
	 
	 var saveProperty = function (properties, userImageUploaded, propertyImagesUploaded) {
		console.log("in saveProperty");
		if(!propertyImagesUploaded || !userImageUploaded) {
			return;
		}

		console.log("saving property");
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

	}
});





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
