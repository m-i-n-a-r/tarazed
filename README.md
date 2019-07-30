# Tarazed - History of space launches

### Status: v 1.0 - WIP

## Introduction
Tarazed takes every **space launch** in history from [Launchlibrary](https://launchlibrary.net) and displays a visual representation using **d3js** and **javascript**. This kind of visualization should be easy to embed in another web page. For the available informations, refer to the [API documentation](https://launchlibrary.net/docs/1.4.1/api.html).

## Task
> How can a user understand the progression behind the overall evolution of the space travel phenomenon?

The specific task is to display the history of the space travels from 1961 until the last scheduled launch in a clear and easy to understand representation, focusing on group of launches instead of single launches. 
The user can see the progress on a time based representation, interacting with the graph to see the statistics of each year or decade.
Approximately, there are **2000 launches**, **250 agencies** and a time window of **60 years** (at the time of writing).

## Features
- Dynamic data! The visualization is **automatically updated** when a new launch is scheduled
- Interactive visual representation, **advanced stats** (completed/failed, launch location, total launches and more)
- **Countdown** to the next launch
- The sources are easy to **customize** and understand
- A beautiful **page template** to display the graph [SOON!]

## How to
Just clone the repo! You can use it as it is (use an http local server running the command `python -m http.server 8080`), or import the script and the css in another html page: make sure to add 4 `div`s with the correct id (it must match the `idToSelect` variable in the js file). The customizable variables are in the script iteself. 
