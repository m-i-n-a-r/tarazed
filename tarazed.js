// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1"];
var width = 450;
var height = 450;
var iterations = 1;
var limit = 3000; // Takes this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?startdate=1950-01-01";
var finalPageUrl = baseUrl + "&limit=" + limit;

// Get a gigantic json containing every launch in history
d3.json(finalPageUrl, function (error, json) {
    processData(json);
});

function processData (json) {
    // Take the launches in an array of objects, store some useful variables and build one or more graphs
    let launches = json.launches;
    let launchesNumber = launches.length - 1
    let lastLaunchYear = parseInt(launches[launchesNumber].windowend.substring(0,4)); 
    console.log(lastLaunchYear);
}