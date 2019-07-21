// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

const firstLaunchYear = 1961;

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1"];
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);
var loadingColor = "#aaaaaa";
var loadingText = "...fetching results...";
var spinnerRadius = 50;
var limit = 3000; // Takes up to this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?mode=verbose"; // Verbose, list or summary
var finalPageUrl = baseUrl + "&limit=" + limit;
var futureGray = "rgba(160, 160, 160, 0.6)";
var storedData;

// The main container, it should scale to fit the screen div size
var svg = d3.select(idToSelect[0]).append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))

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
    // Remove the "loading" text
    d3.select("#loadingtext").transition("removeLoadingText")
        .duration(500)
        .attr("opacity", 0)
        .remove();
    d3.select("#spinner").transition("removeLoadingSpinner")
        .duration(500)
        .attr("opacity", 0)
        .remove();

    storeData(json);
});

// Data aggregation functions
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

function decadeAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by decade
    decadeAggregate = d3.nest()
        .key(function (d) { return parseInt(d.isostart.substring(0, 3) + "0"); })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return decadeAggregate;
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

// Draw a barchart depending on the aggregation choice
function drawChartAggregate(data) {
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d.key; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    // Append the rectangles for the bar chart (animation and color gradient)
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar") // Assign the color dinamically from 140,35,135 to 240,115,35 (delta +100,+80,-100)
        .attr("fill", function (d, i) {
            let columnsNumber = Object.keys(data).length
            let normalizer = columnsNumber / 100
            if(parseInt(d.key.substring(0, 4)) > new Date().getFullYear()) return futureGray 
            else return 'rgb(' + (140 + i / normalizer) + ', ' + (35 + (i * 0.8 / normalizer)) 
            + ', ' + (135 - (i / normalizer)) + ')' 
        })
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
		.transition("bar spawning")
		.duration(250)
        .delay(function (d, i) { return i * 50;	})
        .attr("y", function(d) { return y(d.value); })
		.attr("height", function (d, i) { return height - y(d.value); });

    // Add the x Axis
    svg.append("g")
        .attr("transform", "translate(" + 0 + "," + (height) + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x));

    // Add the y Axis
    svg.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

}

function storeData(data) {
    storedData = data;
    const yearlyAggregatedData = yearlyAggregateData(data);
    drawChartAggregate(yearlyAggregatedData)
}

    var dataDim = d3.select("#modes")
        dataDim.on("change", updateData)

// Update the data when the user selects a different radio button
function updateData() {
    // Remove any previous visualization
    d3.selectAll(".bar").remove();
    d3.selectAll(".axis").remove();
    var modes = document.getElementById("modes")
    var mode;
        for(var i = 0; i < modes.length; i++) {
            if(modes[i].checked) {
            mode = modes[i].id;
            if(mode == "decade") {
                const decadeAggregatedData = decadeAggregateData(storedData);
                drawChartAggregate(decadeAggregatedData)
            }
            if(mode == "year") { 
                const yearlyAggregatedData = yearlyAggregateData(storedData);
                drawChartAggregate(yearlyAggregatedData)
            }
            if(mode == "month") {
                const monthlyAggregatedData = monthlyAggregateData(storedData);
                drawChartAggregate(monthlyAggregatedData)
            }
        }
    }
}