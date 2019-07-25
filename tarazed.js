// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

const firstLaunchYear = 1961;

// Some useful variables, all in the same place to simplify the configuration
var idToSelect = ["#tarazed1", "#tarazed2", "#tarazed3", "#tarazed4"];
var margin = { top: 20, right: 20, bottom: 60, left: 50 },
    width = 1800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
var marginStatBlock = { top: 20, right: 20, bottom: 30, left: 40 },
    widthStatBlock = 600 - marginStatBlock.left - marginStatBlock.right,
    heightStatBlock = 300 - marginStatBlock.top - marginStatBlock.bottom;
var x = d3.scaleBand()
    .range([0, width])
    .padding(0.1);
var y = d3.scaleLinear()
    .range([height, 0]);
var loadingColor = "#aaaaaa";
var futureGray = "rgba(160, 160, 160, 0.6)";
var axisTextColor = "#333";
var highlightColor = "#7da1e8";
var loadingText = "...fetching results...";
var spinnerRadius = 50;
var limit = 3000; // Takes up to this number of launches
var baseUrl = "https://launchlibrary.net/1.4/launch?mode=verbose"; // Verbose, list or summary
var finalPageUrl = baseUrl + "&limit=" + limit;
var nextLaunchUrl = "https://launchlibrary.net/1.4/launch/next/1";
var storedData;
var decadeAggregatedData;
var yearlyAggregatedData;
var monthlyAggregatedData;
var lspAggregatedData;
var locationAggregatedData;

// The main containers, they should scale to fit the screen div size
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

// Given its data, display the next launch
function displayNextLaunch(data) {
    var countDownDate = new Date(data.launches[0].windowstart).getTime();
    // Update the count down every 1 second
    var x = setInterval(function () {
        // Get today's date and time
        var now = new Date().getTime();
        // Find the distance between now and the count down date
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element with id="demo"
        document.getElementById("nextlaunch").innerHTML = "Next launch: " + days + "d " + hours +
            "h " + minutes + "m " + seconds + "s - name: " + data.launches[0].name;
        // If the count down is finished, write some text 
        if (distance < 0) {
            clearInterval(x);
            document.getElementById("nextlaunch").innerHTML = "Launch terminated! Refresh to see the next one!";
        }
    }, 1000);
}

// Get a gigantic json containing every launch in history
d3.json(finalPageUrl, json => {
    // Remove the "loading" screen, show the mode radio buttons
    d3.select("#loadingtext").transition("removeLoadingText")
        .duration(500)
        .attr("opacity", 0)
        .remove();
    d3.select("#spinner").transition("removeLoadingSpinner")
        .duration(500)
        .attr("opacity", 0)
        .remove();
    document.getElementById('modes').style.display = 'block';

    // Store the data for future uses
    storeData(json);
});

// Get the next launch
d3.json(nextLaunchUrl, json => {
    // Display next launch
    displayNextLaunch(json);
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

function lspAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by launch service provider
    lspAggregate = d3.nest()
        .key(function (d) { return d.lsp.abbrev; })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return lspAggregate;
}

function locationAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by launch location
    locationAggregate = d3.nest()
        .key(function (d) { return d.location.countryCode; })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return locationAggregate;
}

// Draw a barchart depending on the aggregation choice
function drawChartAggregate(data) {
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    x.domain(data.map(function (d) { return d.key; }));
    y.domain([0, d3.max(data, function (d) { return d.value; })]);

    // Append the rectangles for the bar chart (animation and color gradient)
    g.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("id", function (d) { return d.key; })
        .attr("class", "bar") // Assign the color dinamically from 140,35,135 to 240,115,35 (delta +100,+80,-100)
        .attr("fill", function (d, i) {
            let columnsNumber = Object.keys(data).length
            let normalizer = columnsNumber / 100
            if (parseInt(d.key.substring(0, 4)) > new Date().getFullYear()) return futureGray
            else return 'rgb(' + (140 + i / normalizer) + ', ' + (35 + (i * 0.8 / normalizer))
                + ', ' + (135 - (i / normalizer)) + ')'
        })
        .attr("x", function (d) { return x(d.key); })
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .on("mouseover", barMouseover)
        .on("mouseout", barMouseout)
        .on("click", barClick)
        .transition("bar spawning")
        .duration(250)
        .delay(function (d, i) { return i * 50; })
        .attr("y", function (d) { return y(d.value); })
        .attr("height", function (d, i) { return height - y(d.value); });

    // Add the x Axis
    g.append("g")
        .attr("transform", "translate(" + 0 + "," + (height) + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)")
        .attr("fill", axisTextColor)
        .style("font-size", "1.8em");

    // Add the y Axis
    g.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("fill", axisTextColor)
        .style("font-size", "1.8em");

}

// Draw some stats and subplots for the chosen bar
function drawStats(mode, time) {
    d3.selectAll(".stats").remove();

    // Chosen stats: total launches, location pie chart, lsp pie chart, failed launches vs completed launches
    drawDonutLocation(mode, time);
    drawDonutCompletedFailed(mode, time);
    drawDonutLsp(mode, time);
}

// Draw the subcharts
function drawDonutLocation(mode, time) {
    var svgStats = d3.select(idToSelect[1]).append("svg")
    .attr("class", "stats")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + (widthStatBlock + marginStatBlock.left + marginStatBlock.right) + " " + (heightStatBlock + marginStatBlock.top + marginStatBlock.bottom))
    .append("g");

    svgStats.append("g")
        .attr("class", "slices");
    svgStats.append("g")
        .attr("class", "labels");
    svgStats.append("g")
        .attr("class", "lines");
    var radius = Math.min(widthStatBlock, heightStatBlock) / 2;
    var color = d3.scaleOrdinal(d3.schemeCategory20);
    var data = [26, 25, 10, 30, 30, 50, 33, 56, 38];
    var pie = d3.pie().sort(null).value(d => d);
    var arc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.6);

    var outerArc = d3.arc()
        .outerRadius(radius * 0.9)
        .innerRadius(radius * 0.9);

    svgStats.attr("transform", "translate(" + widthStatBlock / 2 + "," + heightStatBlock / 2 + ")");

    svgStats.selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i));
    svgStats.append('g').classed('labels', true);
    svgStats.append('g').classed('lines', true);

    var polyline = svgStats.select('.lines')
        .selectAll('polyline')
        .data(pie(data))
        .enter().append('polyline')
        .attr('points', function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos]
        });

    var label = svgStats.select('.labels').selectAll('text')
        .data(pie(data))
        .enter().append('text')
        .attr('dy', '.35em')
        .html(function (d) {
            return d.data;
        })
        .attr('transform', function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style('text-anchor', function (d) {
            return (midAngle(d)) < Math.PI ? 'start' : 'end';
        });

    svgStats.append('text')
        .attr('class', 'toolCircle')
        .attr('dy', -15) // Can adjust this to adjust text vertical alignment in tooltip
        .html('Launch location')
        .style('font-size', '.9em')
        .style('text-anchor', 'middle');

    function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }
}

function drawDonutCompletedFailed(mode, time) {
    var svgStats = d3.select(idToSelect[2]).append("svg")
        .attr("class", "stats")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (widthStatBlock + marginStatBlock.left + marginStatBlock.right) + " " + (heightStatBlock + marginStatBlock.top + marginStatBlock.bottom))

    var radius = Math.min(widthStatBlock, heightStatBlock) / 2 - marginStatBlock.bottom;
    var gPie = svgStats.append("g")
        .attr("transform", "translate(" + widthStatBlock / 2 + "," + heightStatBlock / 2 + ")");
    // Create dummy data
    var data = { a: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100), c: Math.floor(Math.random() * 100), d: Math.floor(Math.random() * 100), e: Math.floor(Math.random() * 100) }
    // Set the color scale
    var color = d3.scaleOrdinal()
        .domain(data)
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"])
    // Compute the position of each group on the pie
    var pie = d3.pie()
        .value(function (d) { return d.value; })
    var data_ready = pie(d3.entries(data))
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function
    gPie.selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(50) // This is the size of the donut hole
            .outerRadius(radius)
        )
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "0px")
        .style("opacity", 0.7)
}

function drawDonutLsp(mode, time) {
    var svgStats = d3.select(idToSelect[3]).append("svg")
        .attr("class", "stats")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + (widthStatBlock + marginStatBlock.left + marginStatBlock.right) + " " + (heightStatBlock + marginStatBlock.top + marginStatBlock.bottom))

    var radius = Math.min(widthStatBlock, heightStatBlock) / 2 - marginStatBlock.bottom;
    var gPie = svgStats.append("g")
        .attr("transform", "translate(" + widthStatBlock / 2 + "," + heightStatBlock / 2 + ")");
    // Create dummy data
    var data = { a: Math.floor(Math.random() * 100), b: Math.floor(Math.random() * 100), c: Math.floor(Math.random() * 100), d: Math.floor(Math.random() * 100), e: Math.floor(Math.random() * 100) }
    // Set the color scale
    var color = d3.scaleOrdinal()
        .domain(data)
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"])
    // Compute the position of each group on the pie
    var pie = d3.pie()
        .value(function (d) { return d.value; })
    var data_ready = pie(d3.entries(data))
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function
    gPie.selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(50) // This is the size of the donut hole
            .outerRadius(radius)
        )
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "0px")
        .style("opacity", 0.7)
}

// Action to take on mouse click
function barClick() {
    var modes = document.getElementById("modes")
    var mode;
    for (var i = 0; i < modes.length; i++) {
        if (modes[i].checked) mode = modes[i].id;
    }
    var time = d3.select(this).attr("id");
    drawStats(mode, time)

    d3.select(this).transition("blink")
        .duration(500)
        .style("opacity", 0.5)
        .transition("deblink")
        .duration(500)
        .style("opacity", 1.0);
}

// Change the color on hover, change it back to normal on mouse out
function barMouseover() {
    d3.select(this).transition("hoverBar")
        .style("stroke", highlightColor)
        .style("stroke-width", 10)
}

function barMouseout() {
    d3.select(this).transition("outBar")
        .style("stroke", "rgba(160, 160, 160, 0.0)")
        .style("strokeWidth", 0)
}

function storeData(data) {
    storedData = data;

    // Initial barchart
    yearlyAggregatedData = yearlyAggregateData(data);
    drawChartAggregate(yearlyAggregatedData);
}

var dataDim = d3.select("#modes")
dataDim.on("change", updateData)

// Update the data when the user selects a different radio button
function updateData() {
    // Remove any previous visualization
    d3.selectAll(".bar").remove();
    d3.selectAll(".axis").remove();
    d3.selectAll("g").remove();
    var modes = document.getElementById("modes")
    var mode;
    for (var i = 0; i < modes.length; i++) {
        if (modes[i].checked) {
            mode = modes[i].id;
            if (mode == "decade") {
                decadeAggregatedData = decadeAggregateData(storedData);
                drawChartAggregate(decadeAggregatedData)
            }
            if (mode == "year") {
                yearlyAggregatedData = yearlyAggregateData(storedData);
                drawChartAggregate(yearlyAggregatedData)
            }
            if (mode == "month") {
                monthlyAggregatedData = lspAggregateData(storedData);
                drawChartAggregate(monthlyAggregatedData)
            }
        }
    }
}