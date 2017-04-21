# Front-End Nanodegree Neighborhood Map Project
The purpose of this project was to learn a new JavaScript framework (Knockout.js) and utilize public APIs (Yelp, Google Maps).
The web application allows you to search for places of interest within your surrounding area.

## Quick Links
* [Online Demo](https://mggwxyz.github.io/frontend-nanodegree-neighborhood-map)
* [Source Code](https://github.com/mggwxyz/frontend-nanodegree-neighborhood-map)


## Table of Contents
1. [Downloading the project](#downloading-the-project)
1. [Running the project](#running-the-project)
1. [Using the project](#using-the-project)

## Downloading the project <a name="downloading-the-project"></a>
Clone the repo into a directory using a terminal
```
git clone https://github.com/mggwxyz/frontend-nanodegree-neighborhood-map.git
```


## Running the project <a name="running-the-project"></a>
>If you don't care to run the project locally, simply visit [https://mggwxyz.github.io/frontend-nanodegree-neighborhood-map](https://mggwxyz.github.io/frontend-nanodegree-neighborhood-map)

1. Navigate to the neighborhood-map directory that was created when downloading the project

    ```
    cd neighborhood-map
    ```
2. Download node modules

    ```
    npm install
    ```
3. Start up a local web server

    ```
    npm start
    ```
4. Navigate to  [http://localhost:8080](http://localhost:8080) in you favorite browser





## Using the project <a name="using-the-project"></a>

### Searching for places

Users can search for places in their neighborhood by entering text into the SEARCH form. As the user types, the places relevant to the search will be displayed in the list view and have their markers placed on the map.

### Filtering places

Users can filter out places and their markers by name by entering filters into the FILTER form. Entering "ab" into the FILTER form will hide all places and their markers which do not have a "ab" in their name.

### Getting More Information

Users can get more information about a particular place by clicking on a place in the list view or its corresponding marker. These actions will cause an info window to popup above that respective place's map marker. The info window will contain the place's image, name, phone number, rating, and yelp link provided by Yelp's API.
