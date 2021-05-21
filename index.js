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
app.get("/movies", function(req, res) {
  res.json(movies);
});

//Puts a message on the page
app.get("/", function (req, res) {
  res.send("Welcome to the greatest movie app of all time!")
})

app.get("/movies/:movie", function(req, res) {
  res.send("GET request about a selected movie. Successfully completed.");
});

app.post("/users", function(req,res) {
  res.send("Profile successfully created!")
});

app.put("/users/:username", function(req, res) {
  res.send("Your username has been successfully updated.")
});

app.get("/users/:username/mylist", function(req, res) {
  res.send("Thou hast acquired thine list.")
});

app.post("/users/:username/mylist/:movie", function(req, res) {
  res.send("The movie has been added to your list.")
});

app.delete("/users/;username/mylist/:movie", function(req, res) {
  res.send("Gone forever is your movie.")
});

app.delete("/users/:username", function(req, res) {
  res.send("We didn't want you here anyways!")
});

app.get("/genres/:genre", function(req, res) {
  res.send("This is your kinda thing, huh?")
});

app.get("/directors/:director", function(req, res) {
  res.send("The man, the myth, the legend")
})

//Server on port 8080
app.listen(8080, function() {
  console.log("I have am a server");
});