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
var height2 = 660;
var loadingColor = "#aaaaaa";
var loadingText = "...FETCHING RESULTS...";
var spinnerRadius = 50;
var limit = 3000; // Takes up to this number of launches
// The only way to retrieve every needed parameter is using the verbose mode (instead of list or summary)
var baseUrl = "https://launchlibrary.net/1.4/launch?mode=list";
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
    // Process data focusing on the launches
    //const processedData = processData(json);
    // Aggregate data on a monthly basis
    const monthlyAggregateData = aggregateData(json);
    drawChartAggregate(aggregateData);
});

var aggregateData = function (data) {
    const launches = data.launches;
    console.log(launches);
    // Aggregate data on a month basis
    aggregate = d3.nest()
        .key(function (d) { return d.windowstart.substring(0, 7); })
        .entries(launches);
    return aggregate;
}

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
        // Pick a subset of interesting properties
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

var drawChartAggregate = function (data) {
    var parseDate = d3.timeParse("%b %Y");

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) { return x(d.date); })
        .y0(height)
        .y1(function (d) { return y(d.price); });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) { return x2(d.date); })
        .y0(height2)
        .y1(function (d) { return y2(d.price); });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    d3.csv("sp500.csv", type, function (error, data) {
        if (error) throw error;

        x.domain(d3.extent(data, function (d) { return d.date; }));
        y.domain([0, d3.max(data, function (d) { return d.price; })]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        focus.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area);

        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

        context.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area2);

        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);
    });

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    function type(d) {
        d.date = parseDate(d.date);
        d.price = +d.price;
        return d;
    }
}
