// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

const firstLaunchYear = 1961;

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1"];
var width = 1800;
var height = 600;
var marginSingle = 30;
var loadingColor = "#aaaaaa";
var loadingText = "...fetching results...";
var spinnerRadius = 50;
var limit = 3000; // Takes up to this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?mode=verbose"; // Verbose, list or summary
var finalPageUrl = baseUrl + "&limit=" + limit;
var graphBgColor = "#000000"

// The main container, it should scale to fit the screen div size
var svg = d3.select(idToSelect[0]).append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height);

// A loading text
svg.append("text")
    .attr("id", "loadingtext")
    .attr("x", function (d) { return width / 2; })
    .attr("y", function (d) { return height / 2; })
    .style("text-anchor", "middle")
    .attr("fill", loadingColor)
    .attr("opacity", 1)
    .attr("font-size", "3em")
    .text(loadingText);

// A loading spinner
var radius = spinnerRadius;
var tau = 2 * Math.PI;
var arc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.9)
    .startAngle(0);
var spinner = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 80) + ")")
    .attr("id", "spinner")
    .attr("opacity", 0.9)
var background = spinner.append("path")
    .datum({ endAngle: 0.75 * tau })
    .style("fill", loadingColor)
    .attr("d", arc)
    .call(spin, 1500)
function spin(selection, duration) {
    selection.transition()
        .duration(duration)
        .attrTween("transform", function () {
            return d3.interpolateString("rotate(45)", "rotate(405)");
        });
    setTimeout(function () { spin(selection, duration); }, duration);
}
function transitionFunction(path) {
    path.transition()
        .duration(7500)
        .attrTween("stroke-dasharray", tweenDash)
        .each("end", function () { d3.select(this).call(transition); });
}

// Get a gigantic json containing every launch in history
d3.json(finalPageUrl, json => {
    // Prepare the data
    const monthlyAggregatedData = monthlyAggregateData(json);
    const yearlyAggregatedData = yearlyAggregateData(json);
    const countryAggregatedData = countryAggregateData(json);
    console.log(countryAggregatedData);
    drawChartAggregate(yearlyAggregatedData);
});

function monthlyAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by month
    monthlyAggregate = d3.nest()
        .key(function (d) { return parseInt(d.isostart.substring(0, 6)); })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return monthlyAggregate;
}

function yearlyAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by year
    yearlyAggregate = d3.nest()
        .key(function (d) { return parseInt(d.isostart.substring(0, 4)); })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return yearlyAggregate;
}

function countryAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by country
    countryAggregate = d3.nest()
        .key(function (d) { return d.location.countryCode; })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return countryAggregate;
}

var drawChartAggregate = function (data) {
    // Remove the "loading" text
    d3.select("#loadingtext").transition("removeLoadingText")
        .duration(500)
        .attr("opacity", 0)
        .remove();
    d3.select("#spinner").transition("removeLoadingSpinner")
        .duration(500)
        .attr("opacity", 0)
        .remove();

    // Parse the date
    var parseTime = d3.timeParse("%Y");

    // Set the ranges
    var x = d3.scaleTime().range([marginSingle, width - marginSingle]);
    var y = d3.scaleLinear().range([height - 2 * marginSingle, 0]);

    // Define the area
    var area = d3.area()
        .x(function (d) { return x(d.key); })
        .y0(height - marginSingle)
        .y1(function (d) { return y(d.value); });

    // Define the line
    var valueline = d3.line()
        .x(function (d) { return x(d.key); })
        .y(function (d) { return y(d.value); });

    // Move the 'group' element to the top left margin
    svg.append("g")
        //.attr("transform", "translate(" + marginSingle + "," + marginSingle + ")");

    // Format the data
    data.forEach(function (d) {
        d.key = parseTime(d.key);
        d.value = +d.value;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function (d) { return d.key; }));
    y.domain([0, d3.max(data, function (d) { return d.value; }) + 10]); // max number of launches per year + 3

    // Add the area
    svg.append("path")
        .data([data])
        .attr("class", "area")
        .attr("d", area);

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline);

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + (height - marginSingle) + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .attr("transform", "translate(" + marginSingle + "," + 0 + ")")
        .call(d3.axisLeft(y));
}

// Update the data when the user selects a different radio button
function updateData() {
    var modes = document.getElementById("modes")
    var mode;
        for(var i = 0; i < modes.length; i++) {
            if(modes[i].checked) {
            mode = modes[i].id;
            }
        }
}

var dataDim = d3.select("#modes")
	dataDim.on("change", updateData)
