// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

const firstLaunchYear = 1961;

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1"];
var width = 1600;
var height = 900;
var limit = 3000; // Takes up to this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?startdate=1950-01-01";
var finalPageUrl = baseUrl + "&limit=" + limit;
var graphBgColor = "#000000"

// Get a gigantic json containing every launch in history
d3.json(finalPageUrl, function (error, json) {
    // Process data focusing on the launches
    processLaunches(json);
});

function processLaunches(json) {
    // Take the launches in an array of objects, store some useful variables and build one or more graphs
    let launches = json.launches;
    let launchesNumber = launches.length - 1
    let lastLaunchYear = parseInt(launches[launchesNumber].windowend.substring(0, 4));

    // Create a stacked bar graph to display the launches over the years
    // The main container, it should scale to fit the screen div size
    var svg = d3.select(idToSelect[0]).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + width + " " + height);

    // The background of the graph    
    var bgPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", 0)
        .attr("ry", 0)
        .attr("height", height)
        .attr("width", width)
        .attr("opacity", 0.1)
        .style("fill", graphBgColor);

    
}