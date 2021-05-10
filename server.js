const http = require("http");
const url = require("url");
const fs = require("fs");

http.createServer(function(request, response) {
  let addr = request.url;
  let q = url.parse(addr, true);
  let filePath = "";

  fs.appendFile("log.txt", "URL: " + addr + "\nTimestamp: " + new Date() + "\n\n", 
  function(err) {
    if(err) {
      console.log(err);
    }
    else {
      console.log("Added to log");
    }
  })

  if(q.pathname.includes("documentation")) {
    filePath = (__dirname + "/documentation.html");
  }
  else {
    filePath = "index.html";
  }

  fs.readFile(filePath, function(err, data) {
    if(err) {
      throw err;
    }
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(data);
    response.end();
  });
}).listen(8080);
console.log("My server is running on port 8080");