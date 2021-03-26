var GEE_DATASETS = (function () {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
    *                      MODULE LEVEL / GLOBAL VARIABLES
    *************************************************************************/
    var INITIAL_START_DATE,
        INITIAL_END_DATE,
        EE_PRODUCTS;

    var public_interface;

    var translatedStrings = { // small(?) dictionary for strings that are used in this script
        'es': {
            'modal-loading': 'esLoading... This may take up to 5 minutes. Please wait.',
            'modal-error': 'esRequest failed to send. Please try again with a smaller AOI or fewer selected features.',
            'drawn': 'esDrawn',
            'LineString': 'esLineString',
            'Point': 'esPoint',
            'Polygon': 'esPolygon',
            'bm-select': 'esBase Map',
            'map-error-alert': 'esOops, there was a problem loading the map you requested. Please check the selected options and try again.',
            'settings': 'esSettings', // these are the labels for buttons that show on mouse hover
            'exit': 'esExit',
            'pan': 'esPan',
            'modify': 'esModify',
            'delete': 'esDelete',
            'move': 'esMove',
            'Box': 'esBox', // for drawing a box AOI
            'full-screen': 'esToggle full-screen',
            'zoom-in': 'esZoom in',
            'zoom-out': 'esZoom out',
            'extent-zoom': 'esFit to extent',
        },
        'pt': {
            'modal-loading': 'ptLoading... This may take up to 5 minutes. Please wait.',
            'modal-error': 'ptRequest failed to send. Please try again with a smaller AOI or fewer selected features.',
            'drawn': 'ptDrawn',
            'LineString': 'ptLineString',
            'Point': 'ptPoint',
            'Polygon': 'ptPolygon',
            'bm-select': 'ptBase Map',
            'map-error-alert': 'ptOops, there was a problem loading the map you requested. Please check the selected options and try again.',
            'settings': 'ptSettings', // these are the labels for buttons that show on mouse hover
            'exit': 'ptExit',
            'pan': 'ptPan',
            'modify': 'ptModify',
            'delete': 'ptDelete',
            'move': 'ptMove',
            'Box': 'ptBox', // for drawing a box AOI
            'full-screen': 'ptToggle full-screen',
            'zoom-in': 'ptZoom in',
            'zoom-out': 'ptZoom out',
            'extent-zoom': 'ptFit to extent',
        },
        'en': {
            'modal-loading': 'Loading... This may take up to 5 minutes. Please wait.',
            'modal-error': 'Request failed to send. Please try again with a smaller AOI or fewer selected features.',
            'drawn': 'Drawn',
            'LineString': 'LineString',
            'Point': 'Point',
            'Polygon': 'Polygon',
            'bm-select': 'Base Map',
            'map-error-alert': 'Oops, there was a problem loading the map you requested. Please check the selected options and try again.',
            'settings': 'Settings', 
            'exit': 'Exit',
            'pan': 'Pan',
            'modify': 'Modify',
            'delete': 'Delete',
            'move': 'Move',
            'Box': 'Box',
            'full-screen': 'Toggle full-screen',
            'zoom-in': 'Zoom in',
            'zoom-out': 'Zoom out',
            'extent-zoom': 'Fit to extent',
        }
    };

    var nameFields = { // outline color and order to be added to the map (smaller features on top of the layer stack, for selection)
        'mineria.geojson': ['#663d00', 24],
        'MineriaIlegal.geojson': ['#663d00',23],
        'Tis_titled.geojson': ['#ff3300',22],
        'Tis_untitled.geojson': ['#b32400',21],
        'Tis_reserves.geojson': ['#801a00',20],
        'Tis_proposedreserves.geojson': ['#4d0f00', 19],
        'Admin_ProjectoAssentamento_INCRA_2017.geojson': ['#330000', 18],
        'Concesiones_reforestation.geojson': ['#000000',17],
        'Concesiones_ecotourism.geojson': ['#000000',16],
        'Concesiones_conservation.geojson': ['#000000',15],
        'Concesiones_logging.geojson': ['#000000', 14],
        'Proposed_conservation.geojson': ['#1a3300',13],
        'ANP.geojson': ['#003300',12],
        'petroleo_explorexploit.geojson': ['#52527a',11],
        'petroleo_inprocess.geojson': ['#666699',10],
        'watersheds_lev09_v1c.geojson': ['#000099',9],
        'acre_municipalities.geojson': ['#000000',8],
        'ucayali_DISTRITO.geojson': ['#000000',7],
        'UCA_ACRE.geojson': ['#000000',6]
        
    };

    // Selector Variables
    var m_platform, m_sensor, m_product, m_start_date, m_end_date, m_reducer;

    var featuresSelection = [], // keeps track of selected features
        labelAll =  false; // keeps track of whether all features should be labeled

    // Styles
    var highlightStyle = new ol.style.Style({ // selected features
        fill: new ol.style.Fill({
            color: 'rgba(235, 236, 160, 0)', // transparent
        }),
        stroke: new ol.style.Stroke({
            color: '#31d2d8', // dark blue outline
            width: 4,
        }),
    });  

    var deselectStyle = new ol.style.Style({ // unselected features
        fill: new ol.style.Fill({
            color: 'rgba(134,206,226,0.05)', // transluscent fill
        }),
        stroke: new ol.style.Stroke({
            color: '#05111f',  // dark blue outline default (will override when applying)
            width: 2,
        }),
    });
    
    var labelStyle = new ol.style.Style({ // separate style for the label
        text: new ol.style.Text({
            font: '16px Calibri,sans-serif',
            overflow: true, // labels are allowed to go outside of the polygon
            fill: new ol.style.Fill({
                color: '#000',
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2,
            }),
        }),
    }); 

    var invisibleStyle = new ol.style.Style({ // workaround for bug where a feature stays symbolized for one click after it is removed
        fill: new ol.style.Fill({
            color: 'rgba(1,1,1,0)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(1,1,1,0)'
        })
    });

    // Map Variables
    var m_map, m_gee_layer, m_shapefile_layer, m_view, vectorSource, selectPointerMove;

    var loadedLayers = {}; // object to keep track of loaded layers and vector sources (by filename)
    var nameSelection = [];

    /************************************************************************
    *                    PRIVATE FUNCTION DECLARATIONS
    *************************************************************************/
    // Dataset Select Methods
    var bind_controls,
        update_product_options,
        update_sensor_options,
        update_date_bounds,
        collect_data;

    // Map Methods
    var update_map, update_data_layer, create_data_layer, clear_imagery, change_layer, add_vector_layer;

    // Time Series Plot Methods
    var get_geometry, update_plot, show_plot_modal;

    var clear_layer,
        change_style; 

    /************************************************************************
    *                    PRIVATE FUNCTION IMPLEMENTATIONS
    *************************************************************************/

    // Dataset Select Methods
    bind_controls = function () {
        
        // Get map
        m_map = TETHYS_MAP_VIEW.getMap();

        // Define a view with the correct projection info and starting position/zoom
        m_view = new ol.View({
            projection: 'EPSG:4326', // WGS84
            center: [-72.0, -9.19],
            zoom: 7,
            maxZoom: 18,
            minZoom: 2
        });

        // Set this new view for our map
        m_map.setView(m_view);

        // Handle selection of vector features
        m_map.on('click', function (e) {
            m_map.forEachFeatureAtPixel(e.pixel, function (f) {

                // get the name of the selected feature
                console.log('Selected Feature: ' + f.get('Label_Name'));
                var selIndex = nameSelection.indexOf(f.get('Label_Name')); // using names instead of the layers because it's more consistent

                if (selIndex < 0) { // if the feature is not already selected, select it
                    featuresSelection.push(f); // add to array
                    nameSelection.push(f.get('Label_Name'));

                    f.setProperties({ 'selected': 'true' }); // mark that this feature should be selected
                    change_style(f, true, true, null);

                } else { // remove the feature from both arrays and deselect
                    featuresSelection.splice(selIndex, 1); // remove from array
                    nameSelection.splice(selIndex, 1);

                    f.setProperties({ 'selected': 'false' }); // mark that this feature should not be selected
                    let strokeColor = nameFields[f.get('Layer_Name')][0];
                    change_style(f, labelAll, false, strokeColor);
                }

                return true; // I'm pretty sure this fixes the double selection bug but i'll keep the print statements in case it comes up again
            },
                {
                    layerFilter: function (layer) { // only select the feature if it is the currently loaded vector file
                        if ($('#map_view_geometry').val()) {
                            console.log($('#map_view_geometry').val())
                            console.log('drawn select')
                        }
                        let pass = false;
                        Object.values(loadedLayers).forEach(function (l) {
                            if (l[0] == layer) {
                                pass = true;
                            }
                        })
                        return pass;
                    }
                })
        });

        // When clicking outside of any features, deselect everything.
        selectPointerMove = new ol.interaction.Select({
            condition: ol.events.condition.click,
            style: undefined,
            layerFilter: function (layer) { // select if it is a loaded layer or drawn layer
                let pass = false;
                let drawLayerIndex = 5;
                if (m_gee_layer) { // if imagery is loaded, the drawing layer will be at index 6 not 5
                    drawLayerIndex = 6;
                }
                if (layer == m_map.getLayers().getArray()[drawLayerIndex] || layer == m_shapefile_layer) {
                    pass = true;
                }
                return pass;
            }
        });
        m_map.addInteraction(selectPointerMove);   
        selectPointerMove.on('select', function (e) { 
            var sel = e.selected;

            // Clear selection if click outside of the layer
            if (sel.length < 1) {
                
                featuresSelection.forEach(function (f, index) {
                    f.setProperties({ 'selected': 'false' }); 
                    let strokeColor = nameFields[f.get('Layer_Name')][0];
                    change_style(f, labelAll, false, strokeColor);
                });
                featuresSelection = []; // clear array of selected features
                nameSelection = [];
            };
        });

        $("#platform").on("change", function () {
            let platform = $("#platform").val();

            if (platform !== m_platform) {
                m_platform = platform;
                console.log(`Platform Changed to: ${m_platform}`);

                update_sensor_options(); // Update the sensor options when platform changes
            }
        });

        $("#sensor").on("change", function () {
            let sensor = $("#sensor").val();

            if (sensor !== m_sensor) {
                m_sensor = sensor;
                console.log(`Sensor Changed to: ${m_sensor}`);
                // Update the product options when sensor changes
                update_product_options();
            }
        });

        $("#product").on("change", function () {
            let product = $("#product").val();

            if (product !== m_product) {
                m_product = product;
                console.log(`Product Changed to: ${m_product}`);
                // Update the valid date range when product changes
                update_date_bounds();
            }
        });

        $("#start_date").on("change", function () {
            let start_date = $("#start_date").val();

            if (start_date !== m_start_date) {
                m_start_date = start_date;
                console.log(`Start Date Changed to: ${m_start_date}`);
            }
        });

        $("#end_date").on("change", function () {
            let end_date = $("#end_date").val();

            if (end_date !== m_end_date) {
                m_end_date = end_date;
                console.log(`End Date Changed to: ${m_end_date}`);
            }
        });

        $("#reducer").on("change", function () {
            let reducer = $("#reducer").val();

            if (reducer !== m_reducer) {
                m_reducer = reducer;
                console.log(`Reducer Changed to: ${m_reducer}`);
            }
        });

         $('#load_map').on('click', function() {
             update_map();
         });

        $('#clear_imagery').on("click", function () {
            clear_imagery();
        });

        $("#load_plot").on("click", function () {
            update_plot();
        });


        /****
        The files are located in the static folder/the public data in the tethysapp folder (default is .tethys/static/earth_engine/data/FileName.geojson)
        for now they are in my local tethysdev folder, when we publish we'll have to move
        Setting up: http://docs.tethysplatform.org/en/stable/installation/production/configuration/basic/static_and_workspaces.html
        More info: http://docs.tethysplatform.org/en/stable/tethys_sdk/extensions/templates_and_static_files.html
        ****/

        // Layer Dropdown
        $('#select_layer').on('change', function () {
            let layers = $('#select_layer').val() || [];

            let loadedLayerNames = Object.keys(loadedLayers) // get only the keys (layer names)

            var toLoad = layers.filter(value => !loadedLayerNames.includes(value)) // grab only the ones we don't already have loaded
            var toRemove = loadedLayerNames.filter(value => !layers.includes(value)) // grab layers that are no longer selected

            // if a layer is not already loaded, add it
            toLoad.forEach(function (currentValue) { // idk why this won't work as .map() but oh well?
                add_vector_layer(currentValue);
            });

            // remove layers that are not selected
            toRemove.forEach(function (layerName) {
                clear_layer(layerName);
            });

        });

        // Change labeling when label check button is changed.
        $("input[name=labelfeatures]").on("change", function () {

            if ($("input[name=labelfeatures]").is(":checked")) { // add all labels
                labelAll = true;
            } else { // remove all labels
                labelAll = false;
            };

            Object.values(loadedLayers).forEach(function (l) { // go through each layer
                let layer = l[1]; // gets the vector source
                let strokeColor = nameFields[Object.keys(loadedLayers).find(key => loadedLayers[key] === l)][0];

                layer.forEachFeature(function (f) { // go through each feature
                    if (f.getStyle() == null || f.getStyle()[0].getStroke().getColor() != '#31d2d8') { // i.e., not selected
                        // could do condition differently if i set a property for each feature when adding the vector layer
                        change_style(f, labelAll, false, strokeColor); // deselected and labels if checked
                    } else {
                        change_style(f, true, true, strokeColor);
                    };
                });
            });
        });

        // About Modal Button
        $('#eeapp-about-label').on('click', function () {
            $("#about-modal").modal("show");
        });


    }; // end bind_controls

    // Changes style of a feature.
    change_style = function (feature, labelOn, highlightOn, strokeColor) {
        if (!m_shapefile_layer) { // if no layer loaded, return
            return true;
        };

        let style, label;
        let tempLabelStyle = labelStyle.clone(); // make a clone that will store this text

        if (labelOn) { // turn on label for this feature
            label = String(feature.get('Label_Name'));
            tempLabelStyle.getText().setText(label);
        } else { // turn off label for this feature
            tempLabelStyle.getText().setText(null);
        };

        if (highlightOn) { // set style to highlight
            style = [highlightStyle, tempLabelStyle];
        } else { // set style to deselect
            let temp = deselectStyle.clone()
            temp.getStroke().setColor(strokeColor);
            style = [temp, tempLabelStyle];
        };

        feature.setStyle(style);
        return true;
    };

    // Loads the selected vector layer to the map.
    add_vector_layer = function (file) {

        let deselectClone = deselectStyle.clone(); // make a clone so other already loaded layers won't change styles
        deselectClone.getStroke().setColor(nameFields[file][0]); // get the color of the stroke associated with the file
        let style = [deselectClone, labelStyle];

        m_shapefile_layer = new ol.layer.Vector({
            source: vectorSource = new ol.source.Vector({ // define the source where we are pulling the layer from
                url: '/static/earth_engine/data/' + file,
                format: new ol.format.GeoJSON(),
                strategy: ol.loadingstrategy.all // bbox loading strat reloads features and makes it difficult to keep consistent styles
            }),
            style: style, 
            declutter: true,
            className: file
        });

        // label features if box is checked
        if (labelAll) { // if the label layer button is checked
            m_shapefile_layer.setStyle(function (feature) {
                let label = String(feature.get('Label_Name')); 
                labelStyle.getText().setText(label)
                return style;
            }) 
        } else { // if the label layer button is unchecked (need this to reset the labelStyle to having Null text)
            m_shapefile_layer.setStyle(function (feature) {
                labelStyle.getText().setText(null);
                return style;
            }) 
        }; 

        // manual ordering so the selection works
        var currentLayerPos = nameFields[file][1];
        var stackPos = 6;
        if (m_gee_layer) { // have to shift up an index if imagery is loaded
            stackPos = 7;
        };
        console.log(m_map.getLayers())

        // it's a little weird to relate the order from the dictionary to the stack, so for now this goes through
        // each added layer from the bottom and compares the dictionary orders and determines the position it should
        // be inserted at from there
        for (var i = stackPos; i < (0 || m_map.getLayers().getArray().length); i++) {
            let compLayer = m_map.getLayers().getArray()[i]; // the already added layer we are comparing to
            let compLayerPos = nameFields[compLayer.values_.className][1]; // get the order from the dictionary
            
            if (currentLayerPos > compLayerPos) { // set as one above and continue to next
                stackPos = i + 1;
            } else {break};
        };

        m_map.getLayers().insertAt(stackPos, m_shapefile_layer); // the other basemaps are at positions 0-4
        
        $("#loader").addClass("show"); // show loading image

        var listenerKey = vectorSource.on("change", function (e) { // ((this method only works with kml and geojson vector files))
            if (vectorSource.getState() == 'ready') {
                $("#loader").removeClass("show"); // hide loading icon
                ol.Observable.unByKey(listenerKey); // unregister "change" listener
            };
        });

        // update dictionary to keep track of leaded layer/sources
        loadedLayers[file] = [m_shapefile_layer, vectorSource];
    }

    // Clears a vector layer from the map when it is removed from the list.
    clear_layer = function (layerName) {

        let layer = loadedLayers[layerName][0]; // get vector layer with the dictionary

        // clear any selected features from the layer to be removed
        let indices = []; // indices to remove
        featuresSelection.forEach(function (f) {
            if (f.get('Layer_Name') == layerName) {
                indices.push(featuresSelection.indexOf(f));
            }
        });
        indices.reverse().forEach(function (ind) { // go through each index marked and remove (reversed so indices aren't changing as they're being removed)
            featuresSelection.splice(ind, 1);
            nameSelection.splice(ind, 1);
        });

        // workaround for when if a feature is selected and deselected by clicking again and the layer 
        // is cleared it doesn't disappear until the next click
        let vectorSource = loadedLayers[layerName][1];
        vectorSource.forEachFeature(function (f) {
            f.setStyle(invisibleStyle);
        });

        m_map.removeLayer(layer); // remove layer from the map
        delete loadedLayers[layerName]; // remove the layer from the list of loaded layers
    };

    // Clears imagery from the map when the 'Clear Imagery' button is clicked.
    clear_imagery = function () { 
        m_map.removeLayer(m_gee_layer); // removes imagery
        m_gee_layer = null;
    };


    update_sensor_options = function () {
        if (!m_platform in EE_PRODUCTS) {
            alert("Unknown platform selected.");
        };

        // Clear sensor options
        $("#sensor").select2().empty();

        // Set the Sensor Options
        let first_option = true;
        for (var sensor in EE_PRODUCTS[m_platform]) {
            let sensor_display_name = sensor.toUpperCase();
            let new_option = new Option(
                sensor_display_name,
                sensor,
                first_option,
                first_option
            );
            $("#sensor").append(new_option);
            first_option = false;
        };

        // Trigger a sensor change event to update select box
        $("#sensor").trigger("change");
        update_date_bounds();
    };

    update_product_options = function () {
        if (!m_platform in EE_PRODUCTS || !m_sensor in EE_PRODUCTS[m_platform]) {
            alert("Unknown platform or sensor selected.");
        };

        // Clear product options
        $("#product").select2().empty();

        let first_option = true;

        // Set the Product Options
        for (var product in EE_PRODUCTS[m_platform][m_sensor]) {
            let product_display_name =
                EE_PRODUCTS[m_platform][m_sensor][product]["display"];
            let new_option = new Option(
                product_display_name,
                product,
                first_option,
                first_option
            );
            $("#product").append(new_option);
            first_option = false;
        };

        // Trigger a product change event to update select box
        $("#product").trigger("change");
        update_date_bounds();
    };

    update_date_bounds = function () {
        // Get new date picker bounds for the current product
        let earliest_valid_date =
            EE_PRODUCTS[m_platform][m_sensor][m_product]["start_date"];
        let latest_valid_date =
            EE_PRODUCTS[m_platform][m_sensor][m_product]["end_date"];

        // Get current values of date pickers
        let current_start_date = $("#start_date").val();
        let current_end_date = $("#end_date").val();

        // Convert to Dates objects for comparison
        let date_evd = Date.parse(earliest_valid_date);
        let date_lvd = Date.parse(latest_valid_date)
            ? latest_valid_date
            : Date.now();
        let date_csd = Date.parse(current_start_date);
        let date_ced = Date.parse(current_end_date);

        // Don't reset currently selected dates if they fall within the new date range
        let reset_current_dates = true;

        if (
            date_csd >= date_evd &&
            date_csd <= date_lvd &&
            date_ced >= date_evd &&
            date_ced <= date_lvd
        ) {
            reset_current_dates = false;
        }

        // Update start date datepicker bounds
        $("#start_date").datepicker("setStartDate", earliest_valid_date);
        $("#start_date").datepicker("setEndDate", latest_valid_date);
        if (reset_current_dates) {
            $("#start_date").datepicker("update", INITIAL_START_DATE);
            m_start_date = INITIAL_START_DATE;
        }

        // Update end date datepicker bounds
        $("#end_date").datepicker("setStartDate", earliest_valid_date);
        $("#end_date").datepicker("setEndDate", latest_valid_date);
        if (reset_current_dates) {
            $("#end_date").datepicker("update", INITIAL_END_DATE);
            m_end_date = INITIAL_END_DATE;
        }

        console.log(
            "Date Bounds Changed To: " +
            earliest_valid_date +
            " - " +
            latest_valid_date
        );
    };

    // Gather the data from the input selections
    collect_data = function () {
        let data = {
            platform: m_platform,
            sensor: m_sensor,
            product: m_product,
            start_date: m_start_date,
            end_date: m_end_date,
            reducer: m_reducer,
            geometry: get_geometry()
        };
        return data;
    };

    // Map Methods
    update_map = function () {
        let data = collect_data();
        console.log('Data inputs for loading imagery:')
        console.log(data)
        let xhr = $.ajax({
            type: "POST",
            url: "get-image-collection/",
            dataType: "json",
            data: data
        });

         xhr.done(function (response) {
           if (response.success) {
             update_data_layer(response.url);
           } else {
             alert(translatedStrings[languageCode]['map-error-alert']);
           }
         });
    };

    update_data_layer = function (url) {
        if (!m_gee_layer) { // if there is not already imagery loaded, create a layer for it
            console.log(url)
            create_data_layer(url);
        } else { // if there is already imagery loaded, set a different source url
            m_gee_layer.getSource().setUrl(url);
        }
    };


    create_data_layer = function (url) {
        let source = new ol.source.XYZ({
            url: url,
            attributions: '<a href="https://earthengine.google.com" target="_">Google Earth Engine</a>'
        });

        source.on("tileloadstart", function () {
            $("#loader").addClass("show");
        });

        source.on("tileloadend", function () {
            $("#loader").removeClass("show");
        });

        source.on("tileloaderror", function () {
            $("#loader").removeClass("show");
        });

        m_gee_layer = new ol.layer.Tile({
            source: source,
            opacity: 1
        });
        // Insert below the draw layer (so drawn polygons and points render on top of data layer).
        m_map.getLayers().insertAt(5, m_gee_layer); // the other basemaps are at 0-4
    };

    


    // Time Series Plot Methods
    // Get all selected and drawn features into objects with the same format into an array
    get_geometry = function () {

        var geo = new ol.format.GeoJSON; 

        var drawnAOI = $('#map_view_geometry').val();

        var vectorSelection = []; // array to hold geojson formatted strings

        featuresSelection.forEach(function (f) {
            console.log(f)

            // Reformat the geometry before adding to an array
            let selectedName = f.get('Label_Name');

            let temp_feat = geo.writeGeometry(f.getGeometry());
            temp_feat = temp_feat.substring(0, temp_feat.length - 1); // take off the last bracket

            temp_feat += ',"properties":{"id":"' + selectedName // add an id name and the crs
                + '"},"crs":{"type":"link","properties":{"href":"http://spatialreference.org/ref/epsg/4326/proj4/","type":"proj4"}}}';

            vectorSelection.push(temp_feat);
            
        })

        // if there are no selections, return null
        if (!drawnAOI && vectorSelection.length < 1) {
            return null;
        };

        // build the string that will contain all the geometry inputs
        var allAOI = '{"type":"GeometryCollection","geometries":['; // begin string

        // get the drawn features
        if (drawnAOI) {
            var geom = JSON.parse($('#map_view_geometry').val());
            geom.geometries.forEach(function (g, i) {
                var ind = i + 1;
                g.properties.id = translatedStrings[languageCode]['drawn'] + ' ' + translatedStrings[languageCode][String(g.type)] + ' ' + ind; // rename the id
                allAOI += JSON.stringify(g) + ',';
            })
        }

        // get the selected features from the vector layers
        vectorSelection.forEach(function (feature, i, arr) {
            allAOI += feature + ','
        })
        
        allAOI = allAOI.substring(0, allAOI.length - 1); // take off the comma of the last feature
        allAOI += ']}'; // close off string
        return allAOI;
    };

    update_plot = function () {

        let cdata = collect_data();
        console.log('Data for plotting the AOI: ');
        console.log(cdata);

        show_plot_modal();

        $("#plot-container").load("get-time-series-plot/", cdata, function (response,status,xhr) {
            if (xhr.status == 400) { // if the request fails to send (probably bc aoi is too big)
                $('#plot-container').html( // show an error message in the modal
                    '<div id="on-error">' +
                    "<p>" + translatedStrings[languageCode]['modal-error'] +"</p>" +
                    '</div>'
                );
            }
        });

    };

    show_plot_modal = function () {
        $("#plot-container").html(
            '<div id="plot-loader">' +
            '<img src="/static/earth_engine/images/plot-loader.gif">' +
            "<p>" + translatedStrings[languageCode]['modal-loading'] + "</p>" +
            "</div>"
        );
        $("#plot-modal").modal("show");
    };

    /************************************************************************
     *                            PUBLIC INTERFACE
     *************************************************************************/
    public_interface = {};

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/
    $(function () {
        // Initialize Global Variables
        bind_controls();

        console.log('current language: ' + languageCode);

        if (languageCode.includes('en')) { // remap so that the language codes match the dictionary (by generalizing locale)
            languageCode = 'en';
        } else if (languageCode.includes('es')) {
            languageCode = 'es';
        } else if (languageCode.includes('pt')) {
            languageCode = 'pt';
        } else {
            languageCode = 'es'; // set default as Spanish
        };

        // translate tethys html elements
        // Header
        $('.settings-button').find('a').attr({ "data-original-title": translatedStrings[languageCode]['settings'] }); // settings
        $('.exit-button').find('a').attr({ "data-original-title": translatedStrings[languageCode]['exit'] }); // exit
        // Map controls
        $('#basemap_dropdown').text(translatedStrings[languageCode]['bm-select'] + ' '); // basemap selector
        $('.ol-full-screen :button').attr({ "title": translatedStrings[languageCode]['full-screen'] }) // full screen toggle
        $('.ol-zoom-in').attr({ "title": translatedStrings[languageCode]['zoom-in'] }); 
        $('.ol-zoom-out').attr({ "title": translatedStrings[languageCode]['zoom-out'] }); 
        $('.ol-zoom-extent :button').attr({ "title": translatedStrings[languageCode]['extent-zoom'] });
        // Drawing controls
        $('#tethys_pan :button').attr({ "data-original-title": translatedStrings[languageCode]['pan'] }); 
        $('#tethys_modify :button').attr({ "data-original-title": translatedStrings[languageCode]['modify'] });
        $('#tethys_delete :button').attr({ "data-original-title": translatedStrings[languageCode]['delete'] });
        $('#tethys_move :button').attr({ "data-original-title": translatedStrings[languageCode]['move'] });
        $('#draw_Point :button').attr({ "data-original-title": translatedStrings[languageCode]['Point'] });
        $('#draw_LineString :button').attr({ "data-original-title": translatedStrings[languageCode]['LineString'] });
        $('#draw_Polygon :button').attr({ "data-original-title": translatedStrings[languageCode]['Polygon'] });
        $('#draw_Box :button').attr({ "data-original-title": translatedStrings[languageCode]['Box'] });

        // EE Products
        EE_PRODUCTS = $("#ee-products").data("ee-products");
        
        // Initialize values
        m_platform = $("#platform").val();
        m_sensor = $("#sensor").val();
        m_product = $("#product").val();
        INITIAL_START_DATE = m_start_date = $("#start_date").val();
        INITIAL_END_DATE = m_end_date = $("#end_date").val();
        m_reducer = $("#reducer").val();        

    });

    return public_interface;
})(); // End of package wrapper
