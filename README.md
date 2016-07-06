# Udacity's Frontend Nanodegree Neighborhood Map Project
The purposed of this project was to gain experience using front-end javascript frameworks and researching APIs. The application developed allows you to search for places within your neighborhood utilizing the Yelp API. I also used the Google Maps API and Knockout.js

## Quick Links
* [GitHub Repository](http://github.com/mgg9xv/neighborhood-map)
* [GitHub Pages](http://mgg9xv.github.io/neighborhood-map)

## Table of Contents
1. [Downloading the project](#downloading-the-project)
1. [Running the project](#running-the-project)
1. [Using the project](#using-the-project)

## Downloading the project <a name="downloading-the-project"></a>
Clone the repo into a directory using a terminal
```
git clone https://github.com/mgg9xv/neighborhood-map.git
```


## Running the project <a name="running-the-project"></a>
1. Navigate to the neighborhood-map directory that was created when downloading the project

    ```
    cd neighborhood-map
    ```
2. Download node modules

    ```
    npm install
    ```
3. Open `index.html` using your favorite browser

    ```
    open index.html
    ```

    OR

    Go to [http://mgg9xv.github.io/neighborhood-map](http://mgg9xv.github.io/neighborhood-map)



## Using the project <a name="using-the-project"></a>

### Searching for places

Users can search for places in their neighborhood by entering text into the SEARCH form. As the user types, the places relevant to the search will be displayed in the list view and have their markers placed on the map.

### Filtering places

Users can filter out places and their markers by name by entering filters into the FILTER form. Entering "ab" into the FILTER form will hide all places and their markers which do not have a "ab" in their name.

### Getting More Information

Users can get more information about a particular place by clicking on a place in the list view or its corresponding marker. These actions will cause an info window to popup above that respective place's map marker. The info window will contain the place's image, name, phone number, rating, and yelp link provided by Yelp's API.
