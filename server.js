var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// var request = require("request")
var axios = require("axios");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
// var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
// var db = require("./models");
var Article = require("./models/Article.js");
var Note = require("./models/Note.js")

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

//Home route

app.get("/"), function (req, res) {

  Article.find({}), function (error, doc) {

    if (error) {
      console.log(error);
    } else {

      res.send(index.html);
    }
  };
};



// A GET route for scraping the guardian website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.theguardian.com/us").then(function (response) {


    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    // Now, we grab every  within an article tag, and do the following:
    $(".fc-item__link").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).text();
      result.link = $(this).attr("href");
      // result.summary = $(this).parent().text().trim();

      console.log(result)


      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function (error, doc) {
        if (error) {
          console.log("error: ", error);
        } else {
          console.log("New Article Scraped: ", doc);
        }
      });
      // If we were able to successfully scrape and save an Article, send a message to the client
      res.send("Scrape Complete");
    })  
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  Article.find({}), function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  };
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .exec(function(error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    })
  });

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

    newNote.save(function(error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        Article.findOneAndUpdate({"_id": req.params.id}, {"note": doc._id})
        .exec(function(err, doc) {
          if (err) {
            console.log(err);
          }
          else {
            res.send(doc)
          }
        })
      }
    })
});

// Delete One from the DB
// app.get("/delete/:id", function (req, res) {
//   // Remove a note using the objectID
//   db.Note.remove(
//     {
//       _id: mongojs.ObjectID(req.params.id)
//     },
//     function (error, removed) {
//       // Log any errors from mongojs
//       if (error) {
//         console.log(error);
//         res.send(error);
//       }
//       else {
//         // Otherwise, send the mongojs response to the browser
//         // This will fire off the success function of the ajax request
//         console.log(removed);
//         res.send(removed);
//       }
//     }
//   );
// });

// Clear the DB
// app.get("/clearall", function (req, res) {
//   // Remove every note from the notes collection
//   db.Note.remove({}, function (error, response) {
//     // Log any errors to the console
//     if (error) {
//       console.log(error);
//       res.send(error);
//     }
//     else {
//       // Otherwise, send the mongojs response to the browser
//       // This will fire off the success function of the ajax request
//       console.log(response);
//       res.send(response);
//     }
//   });
// });

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});