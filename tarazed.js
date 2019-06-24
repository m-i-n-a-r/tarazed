// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

const firstLaunchYear = 1961;
const margin = ({
    top: 20,
    right: 0,
    bottom: 30,
    left: 40
});

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1"];
var width = 1800;
var height = 600;
var loadingColor = "#333333";
var loadingText = "...FETCHING RESULTS...";
var spinnerRadius = 50;
var limit = 3000; // Takes up to this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?mode=verbose"; // The only way to retrieve every needed parameter is using the verbose mode
var finalPageUrl = baseUrl + "&limit=" + limit;
var graphBgColor = "#000000"

// The main container, it should scale to fit the screen div size
var svg = d3.select(idToSelect[0]).append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height);

// A loading text
svg.append("text")
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
    .innerRadius(radius * 0.5)
    .outerRadius(radius * 0.9)
    .startAngle(0);
var spinner = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 80) + ")")
    .attr("id", "spinner")
    .attr("opacity", 0.9)
var background = spinner.append("path")
    .datum({ endAngle: 0.25 * tau })
    .style("fill", "loadingColor")
    .attr("d", arc)
    .call(spin, 1500)
function spin(selection, duration) {
    selection.transition()
        .duration(duration)
        .attrTween("transform", function () {
            return d3.interpolateString("rotate(0)", "rotate(360)");
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
    // Process data focusing on the launches
    const processedData = processData(json);
    drawChart1(processedData);
});

var processData = function (data) {
    const launches = data.launches;
    // Prepare to process dates
    const dateParse = d3.timeParse("%Y%m%dT%H%M%S%Z");
    const dateFormat = d3.timeFormat("%Y-%m-%d");
    const checkAgencies = function (agencies) {
        if (!agencies) return 0;
        else return agencies.length;
    }
    const launchesNumber = launches.length - 1
    const lastLaunchYear = parseInt(launches[launchesNumber].windowend.substring(0, 4));

    return launches.map((row) => {
        // Pick out a subset of the interesting properties
        return {
            name: row.name,
            net: dateParse(row.isonet), // Convert ISO timestamp to Javascript Dates
            location: row.location,
            probability: +row.probability,  // Convert string to number
            rocket: row.rocket,
            lsp: row.lsp,
            missions: row.missions,
            numAgencies: checkAgencies(row.rocket.agencies)
        }
    });
}

var drawChart1 = function (data) {
    // Create a stacked bar graph to display the launches over the years

    // Remove the "loading" text
    d3.select("text").transition("removeLoadingText")
        .duration(500)
        .attr("opacity", 0)
        .remove();
    d3.select("#spinner").transition("removeLoadingSpinner")
        .duration(500)
        .attr("opacity", 0)
        .remove();

    // The background of the graph    
    var bgPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("rx", 0)
        .attr("ry", 0)
        .attr("height", height)
        .attr("width", width)
        .attr("opacity", 0)
        .style("fill", graphBgColor);

    const xRange = [margin.left, width - margin.right];
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range(xRange)
        .padding(0.15); // how much space to put around each bar

    const maxAgencies = d3.max(data.map(d => d.numAgencies));
    const numAgenciesRange = [0, maxAgencies];
    const yRange = [height - margin.bottom, margin.top].map(d => d / 1); // scaling
    const yScale = d3.scaleLinear()
        .domain(numAgenciesRange)
        .range(yRange)
        .nice();

    // Draw the chart
    var barColor = function (row) {
        if (row.location.countryCode === "USA") {
            return "#78CDD7"; // pale turqoise saved from earlier
        } else {
            return "lightgrey";
        }
    };

    const yAxis = g => g
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale) // place tickets to the left of the bar
            .ticks(maxAgencies)
            // .tickSize(0)
            .tickFormat(d3.format("d"))
        )

    // Build the final chart
    svg.append("g")
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.name))
        .attr("y", d => yScale(d.numAgencies))
        .attr("height", d => yScale(0) - yScale(d.numAgencies))
        .attr("width", xScale.bandwidth() / 2)
        .attr("fill", barColor);

    svg.append("g")
        .call(yAxis);
}
