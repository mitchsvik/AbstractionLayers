// Dependencies (5)
var http = require('http'),
    fs = require('fs');

// Cache
var cache = {};

// HTTP Server
http.createServer(function (req, res) {
  var cookies = parseCookie(req);
    
  logging(req);

  // Serve from cache
  if (cache[req.url] && req.method === 'GET') {
    res.writeHead(200);
    res.end(cache[req.url]);
  } else {

    // Routing
    if (req.url === '/') {
      if (req.method === 'GET') {
        res.writeHead(200, {
          'Set-Cookie': 'mycookie=test',
          'Content-Type': 'text/html'
        });
        var ip = req.connection.remoteAddress;
        res.write('<h1>Welcome</h1>Your IP: ' + ip);
        res.end('<pre>' + JSON.stringify(cookies) + '</pre>');
      }
    } else if (req.url === '/person') {
      if (req.method === 'GET') {
        person.read(function(err, obj){
          if(!err){
            
            var data = JSON.stringify(obj);
            cache[req.url] = data;
             
            // HTTP reply  
            res.writeHead(200);
            res.end(data);
          } else {
            res.writeHead(500);
            res.end('Read error');
          }
        }); 
      } else if (req.method === 'POST') {

        // Receiving POST data
        var body = [];
        req.on('data', function(chunk) {
          body.push(chunk);
        }).on('end', function() {
          var data = Buffer.concat(body).toString();
          var obj = JSON.parse(data);
          person.write(obj, function(err) {
            if (!err) {
              res.writeHead(200);
              res.end('File saved');
            } else {
              res.writeHead(500);
              res.end('Write error');
            }
          });
          cache[req.url] = data;
        });
      }
    } else {
      res.writeHead(404);
      res.end('Path not found');
    }
  }
// Configure (6)
}).listen(80);

// Logging (3.4)
function logging(req) {
  var date = new Date().toISOString();
  console.log([date, req.method, req.url].join('  '));
}

// Work with cookies(3.2)
function parseCookie(req) {
  var cookie = req.headers.cookie,
      cookies = {};
  if (cookie) cookie.split(';').forEach(function(item) {
    var parts = item.split('=');
    cookies[(parts[0]).trim()] = (parts[1] || '').trim();
  });
    return cookies;
}

// Data acsess (1)
var person = {};

person.write = function(data, callback) {
  var types = {
  object: function(obj) { 
    if (obj.name) obj.name = obj.name.trim();  
    return JSON.stringify(obj); },
  string: function(s) { return object(JSON.parse(s)); },
  undefined: function() { return callback("error");}
  };
  fs.writeFile('./person.json', types[typeof(data)](data), callback);
};
               
person.read = function(callback) {
  fs.readFile('./person.json', function(err, data) {
    if (!err) {
      callback(err, logic(data));
    } else {
      callback(err, undefined);
    }
  });    
}

// Serialization (2) and business logic (4)
function logic(data) {
  var obj = JSON.parse(data);
  obj.birth = new Date(obj.birth);
  var difference = new Date() - obj.birth;
  obj.age = Math.floor(difference / 31536000000);
  delete obj.birth;
  return obj;
}