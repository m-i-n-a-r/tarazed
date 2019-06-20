# Tarazed - History of space launches

### Status: v 0.1 - WIP

## Introduction
Tarazed takes every **space launch** in history from [Launchlibrary](https://launchlibrary.net) and displays a visual representation using **d3js**, **javascript** and other libraries. This kind of visualization should be easy to embed in another web page (an example wrapper is included). 

## Task
> How can a user understand the progression behind each space agency and the overall evolution of the space travel phenomenon?

The specific task is to display the history of the space travels from 1961 until the last scheduled launch in a clear and easy to understand representation. The user can see the progress of each agency on a time based graph, interacting with the graph to highlight or aggregate data.

## Features
- Dynamic data! The visualization is **automatically updated** when a new launch is scheduled
- Interactive visual representation, multiple options
- The sources are easy to **customize** and understand
- A beautiful **page template** to display the graph is included

## How to
Just take the script, import it in an html page, and make sure to add a div with the correct id (it must match the `idToSelect` variable in the js file). The customizable variables are in the script iteself. 