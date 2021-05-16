// Import express and morgan
const express = require("express");
const app = express();
const morgan = require("morgan");

//Morgan will log basic info to console
app.use(morgan("common"));

//Grab static pages from "public" folder
app.use('/', express.static('public'));

//error handling function for app problems
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Maybe not the greatest after all...")
});

let movies = ["Tokyo Story", "Ikiru", "My Neighbor Totoro"," Red line", "Omohide Poroporo", "Galaxy Quest", 
"The Shawshank Redemption", "Princess Mononoke", "Kizumonogatari", "Some Like it Hot"];

//get list of movies
app.get('/movies', function(req, res) {
  res.json(movies);
});

//Puts a message on the page
app.get('/', function (req, res) {
  res.send("Welcome to the greatest movie app of all time!")
})

//Server on port 8080
app.listen(8080, function() {
  console.log("I have am a server");
});