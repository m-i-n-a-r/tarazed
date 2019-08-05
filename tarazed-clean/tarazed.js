// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed
// Some useful variables, all in the same place to simplify the configuration

var idToSelect = "#tarazed",
    margin = { top: 20, right: 20, bottom: 60, left: 50 },
    width = 1800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    widthTotal = 1800,
    heightTotal = 600,
    marginStatBlock = { top: 20, right: 20, bottom: 30, left: 40 },
    widthStatBlock = 600 - marginStatBlock.left - marginStatBlock.right,
    heightStatBlock = 280 - marginStatBlock.top - marginStatBlock.bottom,
    widthStatBlockTotal = 600,
    heightStatBlockTotal = 250,
    x = d3.scaleBand().range([0, width]).padding(0.1),
    y = d3.scaleLinear().range([height, 0]),
    maxDrawableStats = 100,
    drawedStats = 0,
    textColor = "#aaaaaa",
    futureEntriesColor = "rgba(150, 150, 150, 0.8)",
    highlightColor = "#7da1e8",
    loadingText = "...fetching results...",
    spinnerRadius = 50,
    launchLimit = 3000, // Takes up to this number of launches
    baseUrl = "https://launchlibrary.net/1.4/launch?mode=list", // Verbose, list or summary
    finalPageUrl = baseUrl + "&limit=" + launchLimit,
    nextLaunchUrl = "https://launchlibrary.net/1.4/launch/next/1",
    svg,
    storedData,
    decadeAggregatedData,
    yearlyAggregatedData,
    monthlyAggregatedData,
    lspAggregatedData,
    locationAggregatedData;

function tarazed() {
    // Update the barchart if the mode changes
    d3.select("#modes").on("change", updateData);

    // The main containers, they should scale to fit the screen div size
    svg = d3.select(idToSelect).append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthTotal + " " + heightTotal)

    // A loading text
    svg.append("text")
        .attr("id", "loadingtext")
        .attr("x", function (d) { return widthTotal / 2; })
        .attr("y", function (d) { return heightTotal / 2; })
        .style("text-anchor", "middle")
        .attr("fill", textColor)
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
        .attr("transform", "translate(" + widthTotal / 2 + "," + (heightTotal / 2 + 80) + ")")
        .attr("id", "spinner")
        .attr("opacity", 0.9)
    var background = spinner.append("path")
        .datum({ endAngle: 0.75 * tau })
        .style("fill", textColor)
        .attr("d", arc)
        .call(spin, 1500)

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
        document.getElementById("modes").style.display = "block";
        // Stats placeholder
        createStatsPlaceholder();

        // Check internet connection
        if (json == undefined || json == null) {
            svg.append("text")
                .attr("class", "noInternetText")
                .attr("dy", heightTotal / 2 - 50)
                .attr("dx", widthTotal / 2)
                .attr("font-weight", 700)
                .attr("fill", textColor)
                .text("NO INTERNET CONNECTION!")
                .style("font-size", "3em")
                .style("text-anchor", "middle");
        }
        // Store the data for future uses
        storeData(json);
    });

    // Get the next launch
    d3.json(nextLaunchUrl, json => {
        // Display next launch
        displayNextLaunch(json);
    });
}

// Needed for the loading spinner
function spin(selection, duration) {
    selection.transition()
        .duration(duration)
        .attrTween("transform", function () {
            return d3.interpolateString("rotate(45)", "rotate(405)");
        });
    setTimeout(function () { spin(selection, duration); }, duration);
}

// Needed for the loading spinner
function transitionFunction(path) {
    path.transition()
        .duration(7500)
        .attrTween("stroke-dasharray", tweenDash)
        .each("end", function () { d3.select(this).call(transition); });
}

// A placeholder for the stats, if needed
function createStatsPlaceholder() {
    var statsPlaceholder = document.createElement("div");
    statsPlaceholder.id = "statsPlaceholder";
    document.getElementsByTagName("body")[0].appendChild(statsPlaceholder);
        
    svgStatsPlaceholder = d3.select("#statsPlaceholder").append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthTotal + " " + heightStatBlockTotal)
        .append("text")
        .attr("x", function (d) { return widthTotal / 2; })
        .attr("y", function (d) { return heightStatBlockTotal / 2 + 50; })
        .style("text-anchor", "middle")
        .attr("fill", textColor)
        .attr("font-weight", 700)
        .attr("font-size", "2em")
        .attr("opacity", 0)
        .text("Select a bar to see its details")
        .transition()
        .duration(600)
        .attr("opacity", 1)
        .on("end", function() { d3.selectAll(".bar").on("click", barClick); });
}

// Given its data, display the next launch
function displayNextLaunch(data) {
    var countDownDate = new Date(data.launches[0].windowstart).getTime();
    // Update the count down every 1 second
    var x = setInterval(function () {
        // Get today"s date and time
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

// Data aggregation functions
function yearlyAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by year
    yearlyAggregate = d3.nest()
        .key(function (d) { return parseInt(d.windowstart.substring(0, 4)); })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return yearlyAggregate;
}

function decadeAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by decade
    decadeAggregate = d3.nest()
        .key(function (d) {
            decadePrefix = parseInt(d.windowstart.substring(0, 3));
            return decadePrefix + "0 - " + decadePrefix + "9"
        })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return decadeAggregate;
}

function lspAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by launch service provider
    lspAggregate = d3.nest()
        .key(function (d) { return d.lsp.name; })
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

function statusAggregateData(data) {
    const launches = data.launches;
    // Aggregate data by status (completed/failed). The standard status value has a lot of different values
    statusAggregate = d3.nest()
        .key(function (d) {
            if (d.status == 1 || d.status == 3) return "complete";
            if (d.status == 2) return "uncertain";
            else return "failed";
        })
        .rollup(function (v) { return v.length; })
        .entries(launches);
    return statusAggregate;
}

// Draw a barchart depending on the aggregation choice
function drawChartAggregate(data, mode) {
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
        .attr("id", function (d) { return d.key.substring(0, 4); })
        .attr("class", "bar") // Assign the color dinamically from 140,35,135 to 240,115,35 (delta +100,+80,-100)
        .attr("fill", function (d, i) {
            let columnsNumber = Object.keys(data).length
            let normalizer = columnsNumber / 100
            if (parseInt(d.key.substring(0, 4)) > new Date().getFullYear()) return futureEntriesColor
            else return "rgb(" + (140 + i / normalizer) + ", " + (35 + (i * 0.8 / normalizer))
                + ", " + (135 - (i / normalizer)) + ")"
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
        .delay(function (d, i) { 
            if(mode === "year") return i * 20;
            if(mode === "decade") return i * 100
            else return i * 50; 
        })
        .attr("y", function (d) { return y(d.value); })
        .attr("height", function (d, i) { return height - y(d.value); });

    // Add the x Axis: the text changes between year and decade views
    if (mode === "decade") {
        g.append("g")
            .attr("transform", "translate(" + 0 + "," + (height) + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("font-weight", 700)
            .style("font-size", "1.8em");
    }

    else {
        g.append("g")
            .attr("transform", "translate(" + 0 + "," + (height) + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-90)")
            .attr("font-weight", 700)
            .style("font-size", "1.8em");
    }

    // Add the y Axis
    g.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("font-weight", 700)
        .style("font-size", "1.8em");
}

// Delete every visualized year/decade
function resetStats() {
    d3.selectAll(".bar").on("click", null);
    var n = 0;
    drawedStats = 0;

    // Workaround to execute the end callback a single time
    d3.selectAll(".stats")
        .each(function() { n++; })
        .transition("removeStats")
        .duration(1000)
        .delay(function (d, i) { return (i / 3 * 100); })
        .attr("transform", "translate(" + widthTotal + ")")
        .on('end', function() {
            n--;
            if (!n) endall();
        })
     
    function endall() {
        // Remove the generated divs
        var statsCointainer = document.getElementById("statsList");
        while (statsCointainer.firstChild) statsCointainer.removeChild(statsCointainer.firstChild);
        // Recreate the stats placeholder
        createStatsPlaceholder();
        // Reset interactions
        d3.selectAll(".bar")
            //.on("click", barClick) Used if statsPlaceholder is removed
            .on("mouseover", barMouseover)
            .on("mouseout", barMouseout)
            .transition("deblink")
            .duration(700)
            .style("opacity", 1);
    }
    
    // Autoscroll the page up (can be removed for bigger pages)
    const scrollToTop = () => {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
          window.requestAnimationFrame(scrollToTop);
          window.scrollTo(0, c - c / 16);
        }
      };
    scrollToTop();

}

// Draw some stats and subplots for the chosen bar
function drawStats(mode, time) {
    var startDate = time + "-01-01",
        endDate,
        subIdToSelect = [];

    // Append the necessary elements to the DOM instead of declaring them manually
    var statsMain = document.createElement("div");
    statsMain.id = "statsMain" + drawedStats;
    statsMain.className = "statscontainer";
    document.getElementById("statsList").appendChild(statsMain);

    var block1Div = document.createElement("div");
    block1Div.id = "firstStatBlock" + drawedStats;
    subIdToSelect[0] = "#" + block1Div.id;
    block1Div.className = "statssection";
    document.getElementById("statsMain" + drawedStats).appendChild(block1Div);

    var block2Div = document.createElement("div");
    block2Div.id = "secondStatBlock" + drawedStats;
    subIdToSelect[1] = "#" + block2Div.id;
    block2Div.className = "statssection";
    document.getElementById("statsMain" + drawedStats).appendChild(block2Div);

    var block3Div = document.createElement("div");
    block3Div.id = "thirdStatBlock" + drawedStats;
    subIdToSelect[2] = "#" + block3Div.id;
    block3Div.className = "statssection";
    document.getElementById("statsMain" + drawedStats).appendChild(block3Div);

    // 3 svgs to fill the entire div
    var svgLoading = d3.select("#secondStatBlock" + drawedStats).append("svg")
        .attr("id", "loading" + drawedStats)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal);
    d3.select("#firstStatBlock" + drawedStats).append("svg")
        .attr("id", "loading" + drawedStats)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal);
    d3.select("#thirdStatBlock" + drawedStats).append("svg")
        .attr("id", "loading" + drawedStats)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal);

    // A loading text
    svgLoading.append("text")
        .attr("id", "loadingtext")
        .attr("x", function (d) { return widthStatBlockTotal / 2; })
        .attr("y", function (d) { return heightStatBlockTotal / 2 - 50; })
        .style("text-anchor", "middle")
        .attr("fill", textColor)
        .attr("opacity", 1)
        .attr("font-size", "2em")
        .text(loadingText);

    // A loading spinner
    var radius = spinnerRadius;
    var tau = 2 * Math.PI;
    var arc = d3.arc()
        .innerRadius(radius * 0.45)
        .outerRadius(radius * 0.55)
        .startAngle(0);
    var spinner = svgLoading.append("g")
        .attr("transform", "translate(" + widthStatBlockTotal / 2 + "," + (heightStatBlockTotal / 2) + ")")
        .attr("id", "spinner")
        .attr("opacity", 0.9)
    spinner.append("path")
        .datum({ endAngle: 0.75 * tau })
        .style("fill", textColor)
        .attr("d", arc)
        .call(spin, 1500)

    if (mode == "year") { endDate = time + "-12-31"; }
    if (mode == "decade") { endDate = (parseInt(time) + 9) + "-12-31"; }
    queryUrl = "https://launchlibrary.net/1.4/launch?mode=verbose&limit=9999&startdate=" + startDate + "&enddate=" + endDate;
    d3.json(queryUrl, json => {
        // Chosen stats: total launches, location pie chart, lsp pie chart, failed launches vs completed launches
        drawDonutLocation(json, subIdToSelect);
        drawDonutCompletedFailed(json, subIdToSelect);
        drawGeneralStats(json, mode, time, subIdToSelect);
        // Remove the loading
        d3.selectAll("#loading" + drawedStats).remove();
    });
}

// Draw the location donut chart
function drawDonutLocation(json, subIdToSelect) {
    var radius = Math.min(widthStatBlock, heightStatBlock) / 2;
    // Get an array of numbers from a dynamical query to the site
    aggregateDict = locationAggregateData(json);
    var data = [];
    for (key in aggregateDict) data.push(aggregateDict[key].value)

    var color = d3.scaleOrdinal()
        .domain(data)
        // Colors used in the donut chart
        .range(["#a63fa1", "#ca7b49", "#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#aaaaaa"])
    var pie = d3.pie().startAngle(-0.3 * Math.PI).value(d => d);
    var arc = d3.arc().innerRadius(radius * 0.85).outerRadius(radius * 0.65);

    // Select one of the 3 sub-areas of the stats
    var svgStats = d3.select(subIdToSelect[0]).append("svg")
        .attr("class", "stats")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal)
        .on("mouseover", donutMouseover)
        .append("g");
    var outerArc = d3.arc()
        .outerRadius(radius * 0.95)
        .innerRadius(radius * 0.95);
    svgStats.attr("transform", "translate(" + widthStatBlockTotal / 2 + "," + heightStatBlockTotal / 2 + ")");
    svgStats.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color(i));
    svgStats.append("g").classed("labels", true);
    svgStats.append("g").classed("lines", true);

    var polyline = svgStats.select(".lines")
        .selectAll("polyline")
        .data(pie(data))
        .enter().append("polyline")
        .style("opacity", 1)
        .style("stroke", (d, i) => color(i))
        .style("stroke-width", 3)
        .attr("points", function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 1.05 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos]
        });

    var label = svgStats.select(".labels").selectAll("text")
        .data(pie(data))
        .enter().append("text")
        .attr("x", function (d, i) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 1.10 * (midAngle(d) < Math.PI ? 1 : -1);
            return pos[0];
        })
        .attr("y", function (d, i) {
            var pos = outerArc.centroid(d);
            return pos[1];
        })
        .attr("dy", ".35em")
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .style("font-size", ".95em")
        .text(function (d, i) { return d.data + " | " + aggregateDict[i].key; })
        .style("text-anchor", function (d) {
            return (midAngle(d)) < Math.PI ? "start" : "end";
        });

    // Text for the name of the donut chart + a text for the total number of elements
    svgStats.append("text")
        .attr("class", "centerText")
        .attr("dy", 0) // Can adjust this to adjust text vertical alignment in tooltip
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .text("Launch location")
        .style("font-size", "1.2em")
        .style("text-anchor", "middle");

    // Avoid overlapping labels 
    var labels = label._groups[0],
        alpha = 0.3,
        spacing = 20;

    function relax() {
        var again = false;
        label.each(function (d, i) {
            var a = this,
                da = d3.select(a),
                y1 = da.attr("y");
            x1 = da.attr("x");
            label.each(function (d, j) {
                var b = this;
                if (a === b) return;
                db = d3.select(b);
                if (da.attr("text-anchor") !== db.attr("text-anchor")) return;
                var y2 = db.attr("y");
                var x2 = db.attr("x");
                if (x1 != x2) return;
                deltaY = y1 - y2;
                if (Math.abs(deltaY) > spacing) return;
                again = true;
                sign = deltaY > 0 ? 1 : -1;
                var adjust = sign * alpha;
                da.attr("y", +y1 + adjust);
                db.attr("y", +y2 - adjust);
            });
        });

        if (again) {
            var labelElements = labels;
            // Pos[0] means the x coordinate of the pos point
            polyline.attr("points", function (d, i) {
                var pos = outerArc.centroid(d);
                pos[0] = radius * 1.05 * (midAngle(d) < Math.PI ? 1 : -1);
                var labelForLine = d3.select(labelElements[i]);
                pos[1] = labelForLine.attr("y");
                var pos2 = outerArc.centroid(d);
                pos2[1] = labelForLine.attr("y");
                return [arc.centroid(d), pos2, pos]
            });
            setTimeout(relax, 20);
        }
    }
    relax();
}

// Draw the status donut chart
function drawDonutCompletedFailed(json, subIdToSelect) {
    var radius = Math.min(widthStatBlock, heightStatBlock) / 2;
    // Get an array of numbers from a dynamical query to the site
    aggregateDict = statusAggregateData(json);
    // Calculate the percentages and the values
    var data = [],
        valueSum = Object.keys(aggregateDict).reduce((sum,key) => sum + parseFloat(aggregateDict[key].value || 0), 0),
        percentages = [];
    for (key in aggregateDict) { 
        data.push(aggregateDict[key].value);
        percentages.push(Math.round(aggregateDict[key].value / valueSum * 100));
    }
    // Since there are 3 possible values, the colors are specified manually for each value
    var color = {
        "uncertain": "#a63fa1",
        "failed":  "#ca7b49",
        "complete": "#98abc5"
    }
    var pie = d3.pie().startAngle(-0.3 * Math.PI).value(d => d);
    var arc = d3.arc().innerRadius(radius * 0.85).outerRadius(radius * 0.65);

    // Select one of the 3 sub-areas of the stats
    var svgStats = d3.select(subIdToSelect[2]).append("svg")
        .attr("class", "stats")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal)
        .on("mouseover", donutMouseover)
        .append("g");
    var outerArc = d3.arc()
        .outerRadius(radius * 0.95)
        .innerRadius(radius * 0.95);
    svgStats.attr("transform", "translate(" + widthStatBlockTotal / 2 + "," + heightStatBlockTotal / 2 + ")");
    svgStats.selectAll("path")
        .data(pie(data))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => color[aggregateDict[i].key]);
    svgStats.append("g").classed("labels", true);
    svgStats.append("g").classed("lines", true);

    var polyline = svgStats.select(".lines")
        .selectAll("polyline")
        .data(pie(data))
        .enter().append("polyline")
        .style("opacity", 1)
        .style("stroke", (d, i) => color[aggregateDict[i].key])
        .style("stroke-width", 3)
        .attr("points", function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 1.05 * (midAngle(d) < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos]
        });

    var label = svgStats.select(".labels").selectAll("text")
        .data(pie(data))
        .enter().append("text")
        .attr("dy", ".35em")
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .style("font-size", "1.1em")
        .text(function (d, i) { return d.data + " " + aggregateDict[i].key + " | " + percentages[i] + "%"; })
        .attr("transform", function (d) {
            var pos = outerArc.centroid(d);
            pos[0] = radius * 1.10 * (midAngle(d) < Math.PI ? 1 : -1);
            return "translate(" + pos + ")";
        })
        .style("text-anchor", function (d) {
            return (midAngle(d)) < Math.PI ? "start" : "end";
        });

    // Text for the name of the donut chart + a text for the total number of elements
    svgStats.append("text")
        .attr("class", "centerText")
        .attr("dy", 0) // Can adjust this to adjust text vertical alignment in tooltip
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .text("Launch status")
        .style("font-size", "1.2em")
        .style("text-anchor", "middle");
}

// Draw some general statistics: selected time, total launches, most active lsp
function drawGeneralStats(json, mode, time, subIdToSelect) {
    aggregateDict = lspAggregateData(json);
    var data = [];
    for (key in aggregateDict) data.push(aggregateDict[key].value);
    var bestObj = Math.max.apply(Math, aggregateDict.map(function (o) { return o.value; }));
    var bestLsp = aggregateDict.find(function (o) { return o.value == bestObj; });

    var svgGeneralStats = d3.select(subIdToSelect[1]).append("svg")
        .attr("class", "stats")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + widthStatBlockTotal + " " + heightStatBlockTotal)

    svgGeneralStats.append("text")
        .attr("class", "generalStatsText")
        .attr("dy", heightStatBlockTotal / 2 - 50)
        .attr("dx", widthStatBlockTotal / 2)
        .attr("font-weight", 700)
        .attr("fill", highlightColor)
        .text(function () { return (mode + " " + time).toUpperCase(); })
        .style("font-size", "2.5em")
        .style("text-anchor", "middle");

    svgGeneralStats.append("text")
        .attr("class", "generalStatsText")
        .attr("dy", heightStatBlockTotal / 2 - 10)
        .attr("dx", widthStatBlockTotal / 2)
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .text(function () { return "Total launches: " + data.reduce((a, b) => a + b, 0); })
        .style("font-size", "1.6em")
        .style("text-anchor", "middle");

    svgGeneralStats.append("text")
        .attr("class", "generalStatsText")
        .attr("dy", heightStatBlockTotal / 2 + 50)
        .attr("dx", widthStatBlockTotal / 2)
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .text(function () { return "Best LSP: " + bestLsp.key })
        .style("font-size", "1.2em")
        .style("text-anchor", "middle");

    svgGeneralStats.append("text")
        .attr("class", "generalStatsText")
        .attr("dy", heightStatBlockTotal / 2 + 80)
        .attr("dx", widthStatBlockTotal / 2)
        .attr("font-weight", 700)
        .attr("fill", textColor)
        .text(function () { return "with " + bestLsp.value + " scheduled launches"; })
        .style("font-size", "1.2em")
        .style("text-anchor", "middle");
}

function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

// Action to take on mouse click
function barClick() {
    // Disable the click on the already selected years/decades
    d3.select(this)
        .transition("removeStroke")
        .duration(1000)
        .style("stroke-width", 0);

    d3.select(this)
        .on("click", null)
        .on("mouseover", null)
        .on("mouseout", null);

    // Delete the stats placeholder
    d3.select("#statsPlaceholder").remove();

    // Useful to draw only the right number of stats 
    drawedStats++;
    if (drawedStats >= maxDrawableStats) d3.selectAll(".bar").on("click", null);

    var modes = document.getElementById("modes")
    var mode;
    for (var i = 0; i < modes.length; i++) {
        if (modes[i].checked) mode = modes[i].id;
    }
    var time = d3.select(this).attr("id");
    drawStats(mode, time);

    d3.select(this).transition("blink")
        .duration(500)
        .style("opacity", 0.5)
}

// Change the stroke on hover
function barMouseover() {
    d3.select(this).transition("hoverBar")
        .duration(300)
        .style("stroke", highlightColor)
        .style("stroke-width", 10);
}

// Restore the previous stroke on mouseout
function barMouseout() {
    d3.select(this).transition("outBar")
        .duration(300)
        .style("stroke-width", 0);
}

// Move the text in the donuts to highlight it
function donutMouseover() {
    d3.selectAll(".centerText").transition("modeDown")
        .duration(300)
        .attr("dy", 5)
        .transition("moveUp")
        .duration(100)
        .attr("dy", 0);
}

// Store the data in a global variable
function storeData(data) {
    storedData = data;

    // Initial barchart
    yearlyAggregatedData = yearlyAggregateData(data);
    drawChartAggregate(yearlyAggregatedData, "year");
}

// Update the data when the user selects a different radio button
function updateData() {
    // Clean from any previous visualization
    d3.selectAll(".bar").remove();
    d3.selectAll(".axis").remove();

    var modes = document.getElementById("modes");
    var mode;
    for (var i = 0; i < modes.length; i++) {
        if (modes[i].checked) mode = modes[i].id;
    }
    if (mode == "decade") {
        decadeAggregatedData = decadeAggregateData(storedData);
        drawChartAggregate(decadeAggregatedData, mode);
    }
    if (mode == "year") {
        yearlyAggregatedData = yearlyAggregateData(storedData);
        drawChartAggregate(yearlyAggregatedData, mode);
    }
    resetStats();
}

// * * * * * * * EXECUTE TARAZED * * * * * * *
tarazed();