const http = require("http");
const url = require("url");
const fs = require("fs");

http.createServer(function(request, response) {
  let addr = request.url;
  let q = url.parse(addr, true);
  let filePath = "";

  fs.appendFile("log.txt", `URL: ${filePath}\n Timestamp: ${new Date()}\n\n`, 
  function(err) {
    if(err) {
      console.log(err);
    }
    else {
      console.lof("Added to log");
    }
  })

  if(q.pathname.includes("documentation")) {
    filePath = __dirname + "documentation.html";
  }
  else {
    filePath = "index.html"
  }

  response.writeHead(200, {"Content Type": "text/plain"});
  response.end("Hello Node!\n");
}).listen(8080);