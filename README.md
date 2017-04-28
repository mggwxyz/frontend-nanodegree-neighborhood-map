# Neighborhood Map | Front-End Nanodegree

A neighborhood map application for Udacity's Front-End Web Developer Nanodegree

## Try It Out
[https://mggwxyz.github.io/frontend-nanodegree-neighborhood-map](https://mggwxyz.github.io/frontend-nanodegree-neighborhood-map)

## Table of Contents
1. [Project Overview](#project-overview)
1. [Setting up the project](#setting-up-the-project)
1. [Running the project](#running-the-project)
1. [Resource Links](#resource-links)

## Project Overview

The purpose of this project was to gain experience building responsive web pages using HTML, CSS, and JavaScript. This project was part of Udacity's Front-End Web Developer Nanodegree.

## Setting up the project
Clone the git repository into a directory using a bash terminal
```bash
git clone https://github.com/mggwxyz/frontend-nanodegree-neighborhood-map.git
````

Navigate into the new project directory
```bash
cd frontend-nanodegree-neighborhood-map
```

Download the project's dependencies
```bash
npm install
```

## Running the project
Once the project has been setup, it can be started up at `http://127.0.0.1:8080`
```bash
npm start
```

## Using the project <a name="using-the-project"></a>

### Searching for places

Users can search for places in their neighborhood by entering text into the SEARCH form. As the user types, the places relevant to the search will be displayed in the list view and have their markers placed on the map.

### Filtering places

Users can filter out places and their markers by name by entering filters into the FILTER form. Entering "ab" into the FILTER form will hide all places and their markers which do not have a "ab" in their name.

### Getting More Information

Users can get more information about a particular place by clicking on a place in the list view or its corresponding marker. These actions will cause an info window to popup above that respective place's map marker. The info window will contain the place's image, name, phone number, rating, and yelp link provided by Yelp's API.
