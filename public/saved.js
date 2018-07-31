$(document).ready(function () {
    console.log("Loaded")
// Grab the articles as a json
$.get("/articles", function (data) {

    console.log("AJAX")
    // For each one
    for (var i = 0; i < data.length; i++) {
      // Display the apropos information on the page
      $("#articlesDiv").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br /><a>" + data[i].link + "</a></p>");
    }
  });

})