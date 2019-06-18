// Separate script to render the visualization
// D3 is imported in the html file, where this script is executed

// Some useful variables, all in the same place to simplify the configuration
var id_to_select = "#tarazed";
var width = 450;
var height = 450;
var iterations = 1;
var limit = 3000; // Takes this number of launches
var base_url = "https://launchlibrary.net/1.4/launch?startdate=1950-01-01";
var final_page_url = base_url + "&limit=" + limit;

// Get a gigantic json containing every launch in history
d3.json(final_page_url, function (error, json) {
    process_data(json);
});

function process_data (json) {
    return;
}