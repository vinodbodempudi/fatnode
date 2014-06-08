
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
	console.log(properties);
     fatProperties.addProp(properties, function(error, properties){
	    if(error){
		   if(error.code==11000){
			res.send({error:'Duplicate properties'});
		   }
		   else{
		    res.send(error);
		   }
		}else{
		   res.send(properties);
		}
	 });
	 });

app.get('/properties', function(req, res) {
 console.log("inside get all method");
 
    fatProperties.getAllList(function(error, properties){
	    if(error){
			res.send(error);
		}
		else{
			res.send(properties);
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
			res.send(error);
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
			res.send(error);
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
			res.send(error)
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
  console.log('Express server listening on port ' + app.get('port'));
});