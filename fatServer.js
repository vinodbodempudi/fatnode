
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

var FatProfile = require('./fatProfile').FatProfile;
var FatProfile= new FatProfile('localhost', 27017);

var FatCities = require('./fatCities').FatCities;
var fatCities= new FatCities('localhost', 27017);

var FatProperties = require('./fatProperties').FatProperties;
var fatProperties = new FatProperties('localhost', 27017);

var FatFeedback = require('./fatFeedback').FatFeedback;
var fatFeedback= new FatFeedback('localhost', 27017); 

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
app.use('/static', express.static(__dirname + '/public'));

app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
    next();
});

app.post('/users', function(req, res) {
    //log.info("inside post method");
    var user = req.body;
	log.info(user);
     fatUser.addUser(user, function(error, user){
	    if(error){
		   if(error.code==11000){
		    log.error(error + 'Duplicate User');
			res.send(409);
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
 //console.log("inside get all method");
 
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

app.post('/users/authenticate', function(req, res) {
 //console.log("inside get method");
   
   var  userDetails = req.body;
   log.info("email:"+userDetails.email);
   fatUser.authenticate(userDetails, function(error, user){
					
		if(error){
			log.error(error);
			res.send(error)
		}
		else{
			if(user) {
				delete user.password;
				res.send(user);
			} else {
				res.send(401);
			}
		
		}
		});
	});

app.post('/properties', function(req, res) {
    
    var properties = req.body;
	log.info(properties);
	var count = 0, amazonS3Url='http://s3.amazonaws.com/', userImageUploaded = true, propertyImagesUploaded = true;
    try{
		properties.property.urls = {};
		var uuid = generateUUID()
		if(properties.images.userImage) {
				userImageUploaded = false;
				var buffer =  new Buffer(properties.images.userImage.data, 'base64');
				var s3bucket = new AWS.S3();
				var userPhotoBucket;
				if(properties.property.user.type === 'Agent' ) {
					userPhotoBucket = 'fathome-images/agent/' + properties.property.user.city +'/'+properties.property.user.locality+'/'+uuid;
				} else {
					userPhotoBucket = 'fathome-images/builder/' + properties.property.user.city +'/'+properties.property.user.locality+'/'+uuid;
				}
				var fileName = properties.property.user.name + "." + properties.images.userImage.ext;
				s3bucket.createBucket(function() {
					var d = {
							Bucket: userPhotoBucket,
							//'Content-Type' : 'image/png',
							Key: fileName,	
							Body: buffer,
							ACL: 'public-read'
						};				
						s3bucket.putObject(d, function(err, res) {
							userImageUploaded = true;
							if (err) {
								log.error("Error uploading Agent/Builder photo: ", err);
							} else {
								properties.property.urls.userUrl = amazonS3Url + userPhotoBucket + '/' + fileName;
								log.info("saved user photo success");
							}
							
							saveProperty(properties, userImageUploaded, propertyImagesUploaded);
					});
				});
		}
		log.info("property images count : " + properties.images.propertyImages.length);
		if(properties.images.propertyImages && properties.images.propertyImages.length > 0) {
			propertyImagesUploaded = false;
			var imageUrl, date = new Date();
			var dateString = (date.getMonth()+1)+'-'+date.getDate()+'-'+date.getFullYear();
			var propertyBucket = 'fathome-images/' + dateString + '/' + properties.property.user.city +'/'+properties.property.user.locality+'/'+uuid;
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
							Bucket: propertyBucket,
							Key: fileName,	
							Body: buffer,
							ACL: 'public-read'
							};				
							s3bucket.putObject(d, function(err, res) {
								
								if (err) {
									log.error("Error uploading property image: ", err);
									properties.property.urls.propertyUrls[properties.property.urls.propertyUrls.length] = null;
								} else {
									imageUrl.url = amazonS3Url + propertyBucket + '/' + fileName;;
									if(currentImage.coverPhoto) {
										imageUrl.coverPhoto = currentImage.coverPhoto;
										properties.property.urls.coverPhotoUrl=imageUrl
									}
									properties.property.urls.propertyUrls[properties.property.urls.propertyUrls.length] = imageUrl;
									log.info("imageurl " + imageUrl.url);
									log.info("array count " + properties.property.urls.propertyUrls.length);
									log.info("Successfully uploaded image: count " + count);
								}
								
								if(properties.property.urls.propertyUrls.length === properties.images.propertyImages.length) {
									propertyImagesUploaded = true;
									saveProperty(properties, userImageUploaded, propertyImagesUploaded);
								}
								
							});
					});	
				}(currentImage, i))
			}
		}
		
	 } catch(ex) {
		log.error('Error in saving property'+ex);
	 }
	 
	 
	 var saveProperty = function (properties, userImageUploaded, propertyImagesUploaded) {
		
		if(!propertyImagesUploaded || !userImageUploaded) {
			return;
		}

		log.info("Saving Agent and Builder details");
		saveAgentBuilderDetails(properties);

		log.info("saving property");
		fatProperties.addProp(properties, function(error, properties){
			if(error){
			   if(error.code==11000){
				log.error(error + ' Duplicate properties');
				res.send({error:'Duplicate properties'});
			   }
			   else{
				log.error('Error in saving property in Mongo' + error);
				res.send(error);
			   }
			}else{
			   res.send(properties);
			}
		 });
	}

	var saveAgentBuilderDetails = function(properties) {
		var user = properties.property.user;
		if(properties.property.urls.userUrl) {
			user.userUrl = properties.property.urls.userUrl;
		}
		FatProfile.addProfile(user, function(error, user){
			if(error){
				log.error('Error in saving profile in Mongo'+error);
			}
		 });
	}
	
	saveProperty(properties, userImageUploaded, propertyImagesUploaded);
	
});



app.get('/properties', function(req, res) {
 
    fatProperties.getAllList(function(error, properties){
	    if(error){
	    	log.error('Error in getting properties' + error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(properties);
		}
		});
});

app.get('/properties/my-properties/:userId', function(req, res) {
	var userId = req.params.userId;
    fatProperties.getMyProperties(userId, function(error, properties){
	    if(error){
	    	log.error('Error in getting mylist properties' + error);
			res.send("Something went wrong please try again");
		}
		else{
			console.log('properties' + properties);
			res.send(properties);
		}
	});
});

app.get('/properties/:id', function(req, res) {
 
 	var id = req.params.id;
 	var document_id = new require('mongodb').ObjectID(id);
    fatProperties.getProperty(document_id, function(error, property) {
	    if(error){
	    	log.error('Error in getting property with id:'+id+' document_id'+document_id+' error:'+ error);
			res.send("Something went wrong please try again");
		}
		else{
			//log.info(property);
			res.send(property);
		}
		});
});

app.get('/properties/:city/:locality', function(req, res) {
 
 	var  city = req.params.city;
    var  locality = req.params.locality;
    
    log.info("get properties for city: " + city + " locality "+locality);

    fatProperties.list(city, locality, function(error, properties){
	    if(error){
	    	log.error('Error in getting properties for city:'+ city +' locality:'+locality+' error:'+error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(properties);
		}
		});
	
});

app.get('/cities', function(req, res) {
	//log.info('User-Agent: ' + req.headers['user-agent']);

    var ua = req.headers['user-agent'].toLowerCase();
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
		log.info('Mobile user');
	}
	else{
		log.info('Computer user');
	}


    fatCities.list(function(error, cities){
	    if(error){
	    	log.error('Error in getting cities: '+error);
			res.send("Something went wrong please try again");
		}
		else{
			res.send(cities);
		}
		});
	
	});


app.get('/localities/:city', function(req, res) {
   
   var  city = req.params.city;
   log.info("get localities for city: " + city);
   fatCities.getLocalities(city, function(error, localities){
					
		if(error){
			log.error('Error in getting localities for city:'+city+' error'+error);
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



app.post('/feedback', function(req, res) {
    
    var feedback = req.body;
	fatFeedback.saveFeedback(feedback, function(error, feedback){
	    if(error){
		   log.error('could not save feedback:' + feedback+' error:'+error);
		
		}else{
		   res.send(feedback);
		}
	 });
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
  log.error('Error' + er.message);
});

d.run(function() {
  require('http').createServer(function(req, res) {
    handleRequest(req, res);
  }).listen(PORT);
});
