/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaGVpc2VuemlsbGEiLCJhIjoiY2xjcXlmaHlqMGE5eTNwbjJsZDhxODhpMSJ9.Ib4qz6M3pZ7pBDGXJr8DiA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

//Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', //container id in HTML
    style: 'mapbox://styles/heisenzilla/clfcye0dx000901p2b1gfqpui',  //****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 9 // starting zoom level
});



/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let collisionGeoJson;

fetch('https://gabcalayan.github.io/Lab_4_Code/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        collisionGeoJson = response;
});

map.on('load', () => {

    map.addSource ('Collision', {
        type: 'geojson',
        data: 'https://gabcalayan.github.io/Lab_4_Code/pedcyc_collision_06-21.geojson',
    });

    map.addLayer ({
        'id': 'Collision_Toronto',
        'type': 'circle',
        'source': 'Collision',
        'paint': {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                9, 1,
                11, 5
            ],
            'circle-color': 'black'
        }
    });

});
//So the data works and it shows on my map 



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

map.on('load', () => {
    
    let bboxgeojson;
    let bbox = turf.envelope(collisionGeoJson);
    let bboxscaled = turf.transformScale(bbox, 1.5);

    bboxgeojson = {
        type: 'FeatureCollection',
        features: [bboxscaled]
    };

//Adding a source for the bounding box
    map.addSource ('collis-bbox', {
        type: 'geojson',
        data: bboxgeojson
    });
//Adding the layer itself onto my map
    map.addLayer ({
        'id': 'collisionBBox',
        'type': 'fill',
        'source': 'collis-bbox',
        'paint': {
            'fill-color': 'grey',
            'fill-opacity': 0.1
        }
    });
//Using console.log just to check if it loaded in the browser
console.log(bbox)
console.log(bbox.geometry.coordinates)

//The bounding box works and its shown here 

//Creating the hexgrid using the boundaries I made previously
let bboxcoords = [bbox.geometry.coordinates[0] [0] [0],
                bbox.geometry.coordinates[0] [0] [1],
                bbox.geometry.coordinates[0] [2] [0],
                bbox.geometry.coordinates[0] [2] [1]];
let hexGeojson = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers'});

    map.addSource ('hex', {
        type: 'geojson',
        data: hexGeojson
    });

    map.addLayer ({
        'id': 'hexGEO',
        'type': 'fill',
        'source': 'hex',
        'paint': {
            'fill-color': [
                'step',
                ['get', 'COUNT'],
                '#800026',
                1, 'black'
            ],
            'fill-opacity': 0.3
        }
    });


/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

let collishex = turf.collect(hexGeojson, collisionGeoJson, '_id', 'values')

console.log(collishex)

let maxcollis = 0;

collishex.features.forEach((feature) => {
    //This line indicates that for each feature that I created in my collishex variable...
    feature.properties.COUNT = feature.properties.values.length
    //We're going to find out the count properties equalling the values of those features
    if (feature.properties.COUNT > maxcollis) {
    //If the count of that feature is greater than the max collision of 0...
        console.log(feature);
    //Log that feature to the console
        maxcollis = feature.properties.COUNT
    //And then equal that value found in feature properties to the properties count we made
    }
});
console.log(maxcollis)
});
// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows

//FINALIZING MAP ITEMS 

//Search control 
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: "ca"
    })
);

//Zoom control option 
map.addControl(new mapboxgl.NavigationControl());

//Pop - ups 
map.on('mouseenter', 'hexGEO', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'hexGEO', () => {
    map.getCanvas().style.cursor = '';
});

map.on('click', 'hexGEO', (e) => {
    new mapboxgl.Popup() 
        .setLngLat(e.lngLat)
        .setHTML("<b>Collision count: </b> " + e.features[0].properties.COUNT + "<br>")
        .addTo(map); //Show popup on map
});







