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

    // TODO: move this to the html/ put in another file?
    const translatedStrings = { // small(?) dictionary for strings that are used in this script
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
            'log-in': 'esLog In',
            'invalid-geojson': 'esInvalid geojson. Please validate your file and try again.',
            'invalid-kml': 'esInvalid KML. Please validate your file and try again.',
            'invalid-file-type': 'esIncorrect file type. Please select a geojson, KML, or zipped shapefile.',
            'empty-file-input': "esNo file selected. Please choose a file using the 'Choose File' button, then add it to the map by clicking 'Add Selected File'.",
            'unknown-platform': 'esUnknown platform selected. Please try again.',
            'unknown-sensor': 'esUnknown platform or sensor selected. Please try again.',
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
            'log-in': 'ptLog In',
            'invalid-geojson': 'ptInvalid geojson. Please validate your file and try again.',
            'invalid-kml': 'ptInvalid KML. Please validate your file and try again.',
            'invalid-file-type': 'ptIncorrect file type. Please select a geojson, KML, or zipped shapefile.',
            'empty-file-input': "ptNo file selected. Please choose a file using the 'Choose File' button, then add it to the map by clicking 'Add Selected File'.",
            'unknown-platform': 'ptUnknown platform selected. Please try again.',
            'unknown-sensor': 'ptUnknown platform or sensor selected. Please try again.',
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
            'log-in': 'Log In',
            'invalid-geojson': 'Invalid geojson. Please validate your file and try again.',
            'invalid-kml': 'Invalid KML. Please validate your file and try again.',
            'invalid-file-type': 'Incorrect file type. Please select a geojson, KML, or zipped shapefile.',
            'empty-file-input': "No file selected. Please choose a file using the 'Choose File' button, then add it to the map by clicking 'Add Selected File'.",
            'unknown-platform': 'Unknown platform selected. Please try again.',
            'unknown-sensor': 'Unknown platform or sensor selected. Please try again.',
        }
    };

    var nameFields = { // outline color and order to be added to the map (smaller features on top of the layer stack, for selection)
        'mineria.geojson': ['#663d00', 22],
        'MineriaIlegal.geojson': ['#663d00',21],
        'Tis_titled.geojson': ['#ff3300',20],
        'Tis_untitled.geojson': ['#b32400',19],
        'Tis_reserves.geojson': ['#801a00',18],
        'Tis_proposedreserves.geojson': ['#4d0f00', 17],
        'Admin_ProjectoAssentamento_INCRA_2017.geojson': ['#330000', 16],
        'Concesiones_reforestation.geojson': ['#000000',15],
        'Concesiones_ecotourism.geojson': ['#000000',14],
        'Concesiones_conservation.geojson': ['#000000',13],
        'Concesiones_logging.geojson': ['#000000', 12],
        'Proposed_conservation.geojson': ['#1a3300',11],
        'ANP.geojson': ['#003300',10],
        'petroleo_explorexploit.geojson': ['#52527a',9],
        'petroleo_inprocess.geojson': ['#666699',8],
        'watersheds_lev09_v1c.geojson': ['#000099',7],
        'acre_municipalities.geojson': ['#000000',6],
        'ucayali_DISTRITO.geojson': ['#000000',5],
        'UCA_ACRE.geojson': ['#000000',4]
        
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

    var featureCounter = 1;

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
        change_style,
        get_label,
        add_upload_vector_layer,
        get_stack_pos;

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
                let featureLabel = get_label(f);

                console.log('Selected Feature: ' + featureLabel);
                var selIndex = nameSelection.indexOf(featureLabel); // using names instead of the layers because it's more consistent (but is awful!! and I should try and find a better way)


                if (selIndex < 0) { // if the feature is not already selected, select it
                    featuresSelection.push(f); // add to array
                    nameSelection.push(featureLabel);

                    f.setProperties({ 'selected': 'true' }); // mark that this feature should be selected
                    change_style(f, true, true, null);

                } else { // remove the feature from both arrays and deselect
                    featuresSelection.splice(selIndex, 1); // remove from array
                    nameSelection.splice(selIndex, 1);

                    f.setProperties({ 'selected': 'false' }); // mark that this feature should not be selected
                    let strokeColor;
                    try {
                        strokeColor = nameFields[f.get('Layer_Name')][0];
                    }
                    catch (err) {
                        strokeColor = '#7d6aab'
                    }
                    
                    change_style(f, labelAll, false, strokeColor);
                }

                return true; 
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
                    let strokeColor;
                    try {
                        strokeColor = nameFields[f.get('Layer_Name')][0];
                    }
                    catch (err) {
                        strokeColor = '#7d6aab' // set as a default color if uploaded
                    }
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

        // adds the selected file from the input to the map
        $('#submit-input-button').on('click', function () {
            

            var file = $('#file-input').prop('files')[0];

            // check the extension of the uploaded file
            // accepts: kml, geojson, zipped shapefile (.shp, (.prj,) .dbf)
            // error messages for missing files in archive are in shp2geojson.js/preview.js
            let extension = $('#file-input').prop('value').split('.')[$('#file-input').prop('value').split('.').length - 1];

            // use the value of the file selector element which gives a fake path to get just the filename
            try {
                var filename = $('#file-input').prop('value').split('\\')[2].split('.')[0];
            }
            catch (err) { // throw error if no file selected (the html element value will be undefined)
                console.log(err);
                alert(translatedStrings[languageCode]['empty-file-input']) 
                return;
            }

            var uploadVectorSource; // initialize vector source variable (defined differently depending on file type)

            if (extension === 'zip') { // shapefile loading with shp2geojson.js: https://github.com/gipong/shp2geojson.js
                // converts from zipped shapefile to geojson
                loadshp({
                    url: file,
                    encoding: 'utf-8'//,
                    //EPSG: 4326 // the .prj file should have this information so I don't want to overwrite it
                }, function (geojson) { 

                        let features = new ol.format.GeoJSON({ geometryName: filename }).readFeatures( // geometryName set to the name of the file, so it can be carried over to the features when selecting
                            geojson
                        );
                        console.log(features)
                        uploadVectorSource = new ol.source.Vector({ // defines the vector source
                            features: features
                        });

                        filename = add_upload_vector_layer(uploadVectorSource, filename); // adds to map, sets styles, adds to list of loaded layers, etc

                        var newLayer = new Option(filename, filename, true, true) // creates new option that is added automatically
                        $('#select_layer').append(newLayer).trigger('change'); // appends new option to the select


                        return;
                        

                });

            }
            else { // geojson/kml
                // need to read the file first
                var reader = new FileReader(); 
                reader.onload = function () {


                    if (extension === 'geojson' || extension === 'json') { // create a vector source from a geojson
                        console.log('creating vector source from geojson file');
                        try {
                            let features = new ol.format.GeoJSON({ geometryName: filename }).readFeatures(reader.result);
                            uploadVectorSource = new ol.source.Vector({
                                features: features
                            });
                        }
                        catch (err) {
                            alert(translatedStrings[languageCode]['invalid-geojson']); 
                            console.error(err);
                            return;
                        };

                    }
                    else if (extension === 'kml') { // create a vector source from a kml
                        console.log('creating vector source from kml file');

                        try {
                            let features = new ol.format.KML({ extractStyles: false }).readFeatures(reader.result); 
                            uploadVectorSource = new ol.source.Vector({
                                features: features
                            });
                        }
                        catch (err) {
                            alert(translatedStrings[languageCode]['invalid-kml']); 
                            console.error(err);
                            return;
                        };

                        uploadVectorSource.forEachFeature(function (f) {
                            // get rid of the z coords (won't send over and get the time series with them)
                            let coords = f.getGeometry().flatCoordinates;
                            if (coords.length === 3) {
                                f.getGeometry().flatCoordinates = [coords[0], coords[1]]; // set as just the first two
                                f.getGeometry().format = 'XY'; // change the format from xyz to xy
                            };
                            // set the geometry name property
                            //f.setGeometryName(filename);
                            return;
                        })
                    }
                    else { // not a zipped file, geojson, or kml
                        alert(translatedStrings[languageCode]['invalid-file-type']); 
                        $('#file-input').val(''); // clears the input file selection
                        return;
                    };

                    filename = add_upload_vector_layer(uploadVectorSource, filename);

                    var newLayer = new Option(filename, filename, true, true); // creates new option that is added automatically
                    $('#select_layer').append(newLayer).trigger('change'); // appends new option to the select
                    
                    

                };

                reader.readAsText(file); // this is what starts reading the file, and on the load the above code will execute

            };

        });

        // Layer Dropdown
        $('#select_layer').on('change', function () {
            let layers = $('#select_layer').val() || [];

            let loadedLayerNames = Object.keys(loadedLayers) // get only the keys (layer names)
            var toLoad = layers.filter(value => !loadedLayerNames.includes(value)) // grab only the ones we don't already have loaded
            // if the file name does not end in .geojson (supposedly the uploaded files), do not add it again
            // this could be improved...
            for (let i = 0; i < toLoad.length; i++) {
                let splitted = toLoad[i].split('.')[toLoad[i].split('.').length - 1];
                if (splitted != 'geojson') {
                    toLoad.splice(i, 1);
                };
            };

            var toRemove = loadedLayerNames.filter(value => !layers.includes(value)); // grab layers that are no longer selected

            // if a layer is not already loaded, add it
            toLoad.forEach(function (currentValue) {
                let fileurl = '/static/earth_engine/data/' + currentValue;
                add_vector_layer(fileurl,currentValue);
            });

            // remove layers that are not selected
            toRemove.forEach(function (layerName) {
                // if the file is also an uploaded file, remove it from the list (since we lose the file (i think) after it's not in the input form)
                let splitted = layerName.split('.')[layerName.split('.').length - 1] // if it's one of our files it will end in .geojson
                if (splitted != 'geojson') { // remove it from the options
                    $("#select_layer option[value='" + layerName + "']").remove();
                }
                // remove the layer from the map
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
                    if (f.getStyle() == null || f.getStyle()[0].getStroke().getColor === '#7d6aab' || f.getStyle()[0].getStroke().getColor() != '#31d2d8') { // i.e., not selected
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

    add_upload_vector_layer = function (vectorSource, filename) {

        
        // get the geometry type of the features
        var geomType = vectorSource.getFeatures()[0].getGeometry().getType(); // the value should be Point, LineString, or Polygon
        
        if (filename in loadedLayers) { // if it matches the name of an already loaded layer, rename the layer
            var counter = 1;
            while (true) { // will keep indexing the counter until it finds a nonmatch
                let newFilename = filename + '(' + String(counter) + ')';
                if (!(newFilename in loadedLayers)) {
                    filename = newFilename;
                    console.log('duplicated file name. new filename: ' + filename)
                    
                    // TODO: try to update the geometryname property?
                    /*
                    vectorSource.forEachFeature(function (f) {
                        console.log(f.getGeometryName())
                        f.setGeometryName(filename)
                    }) */
                    console.log(vectorSource.getFeatures()[0].getGeometryName())
                    break;
                }
                else {
                    counter++;
                    continue;
                };
            };
            
        };

        // style things...
        let deselectClone = deselectStyle.clone(); // make a clone so other already loaded layers won't change styles
        deselectClone.getStroke().setColor('#7d6aab'); // set as a default color for now

        // if the feature is a point, define extra style params
        if (geomType.toLowerCase().indexOf('point') > -1) {
            let pointIm = new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({ color: 'rgba(134, 206, 226, 0.01)' }),
                stroke: new ol.style.Stroke({ color: '#7d6aab', width: 2 })
            })
            deselectClone.setImage(pointIm)
        };


        let style = [deselectClone, labelStyle];

        m_shapefile_layer = new ol.layer.Vector({
            source: vectorSource,
            style: style,
            className: filename
        });

        // label features if box is checked
        if (labelAll) { // if the label layer button is checked
            m_shapefile_layer.setStyle(function (feature) {
                let label = get_label(feature);
                labelStyle.getText().setText(label);
                return style;
            })
        } else { // if the label layer button is unchecked (need this to reset the labelStyle to having Null text)
            m_shapefile_layer.setStyle(function (feature) {
                labelStyle.getText().setText(null);
                return style;
            })
        };

        // order them based on if they're a point (top), line (middle), or polygon
        // and we'll hope that no one is adding a ton of files that overlap so that the selection will get weird :)
        var stackPos = get_stack_pos(filename, geomType);

        // adds to the map 
        m_map.getLayers().insertAt(stackPos, m_shapefile_layer);

        // zoom to the extent
        try { // this works for shapefiles...?
            m_map.getView().fit(vectorSource.getExtent());
        }
        catch (err) { 
            console.log('Error in zooming to extent: ', err)
            var listenerKey = vectorSource.on("change", function (e) { // this works for geojson and kml files (idk why probably something with the way the vector source is defined)
                if (vectorSource.getState() == 'ready') {
                    m_map.getView().fit(vectorSource.getExtent());
                    ol.Observable.unByKey(listenerKey); // unregister "change" listener
                };
            });
        };

        // add to dictionary to keep track of loaded layers
        loadedLayers[filename] = [m_shapefile_layer, vectorSource];

        // define style variables for when it's clicked later on
        nameFields[filename] = ['#7d6aab', 25]; // default purple color for outline and always order it at the top of the layer stack

        return (filename); // in case the file name has been modified here, return it
        
    };

    // manual ordering of loaded/uploaded layers
    get_stack_pos = function (filename,geomType) {
        // manual ordering so you're able to select the most potential features
        // largest layers go on bottom, smaller ones on top since many will overlap
        // uploaded layers will go on top of the stored layers
        // polygons on bottom, lines in middle, points on top
        var stackPos = 4;
        var currentLayerPos;
        try {
            currentLayerPos = nameFields[filename][1];
        }
        catch (err) {
            console.log(err)
            if (geomType.toLowerCase().indexOf('polygon') > -1) currentLayerPos = 25;
            else if (geomType.toLowerCase().indexOf('line') > -1) currentLayerPos = 35;
            else if (geomType.toLowerCase().indexOf('point') > -1) currentLayerPos = 45;
            else currentLayerPos = 8;
        }
        
        if (m_gee_layer) { // have to shift up an index if imagery is loaded
            stackPos = 5;
        };

        // it's a little weird to relate the order from the dictionary to the stack, so for now this goes through
        // each added layer from the bottom and compares the dictionary orders and determines the position it should
        // be inserted at from there
        for (var i = stackPos; i < (0 || m_map.getLayers().getArray().length); i++) {
            let compLayer = m_map.getLayers().getArray()[i]; // the already added layer we are comparing to
            let compLayerPos
            try {
                compLayerPos = nameFields[compLayer.values_.className][1]; // get the order from the dictionary
            }
            catch (err) {
                console.log(err)
                if (geomType.toLowerCase().indexOf('polygon') > -1) compLayerPos = 25;
                else if (geomType.toLowerCase().indexOf('line') > -1) compLayerPos = 35;
                else if (geomType.toLowerCase().indexOf('point') > -1) compLayerPos = 45;
                else compLayerPos = 8;
            }

            if (currentLayerPos > compLayerPos) { // set as one above and continue to next
                stackPos = i + 1;
            } else { break };
        };

        return stackPos;
    }

    // gets the label for a feature
    get_label = function (f) {

        let featureLabel = f.get('Label_Name'); // this won't throw an error if there's no field called Label_Name

        if (f.getId() !== void (0)) { // if the id is not void, then the label will just be the id to avoid setting it multiple times
            return String(f.getId());
        } else {
            // this is mainly for uploaded files (at least that's what it's intended for):
            if (featureLabel === void (0)) { // void(0) is the same as undefined, which is what we're looking for so we can name the feature
                // if it's an uploaded file, look for a field that could be an identifier for a feature
                let matching = ["object", "oid", "nombre", "nom", "name"]; // substrings to match for field names - idk how well this will work when applied but it can be adjusted
                let fields = f.getKeys();

                for (let i = 0; i < matching.length; i++) {
                    if (fields.some(function (k) { return ~k.toLowerCase().indexOf(matching[i]) })) { // if it has a field that contains the matching string
                        let matchedField = fields.filter(function (field) { // find a field that contains the substring
                            return field.toLowerCase().indexOf(matching[i]) === 0;
                        })[0]
                        let layerName = f['geometryName_']; // gets the name of the layer
                        featureLabel = layerName + '_' + f.get(matchedField); // the label name will be <FILENAME>_<OID> for this feature

                        break; // if one is found, don't continue looking for other fields
                    }
                }
                if (featureLabel === void (0)) { // if no fields found, give a generic name
                    featureLabel = f['geometryName_'] + '_' + String(featureCounter); // since we don't know what to call it, give it a number (:
                    featureCounter++; // increase the number so we don't get duplicates (: <- i don't like this it feels dumb
                }
            }
            f.setId(String(featureLabel));
        };

        return String(featureLabel);
    };

    // Changes style of a feature.
    change_style = function (feature, labelOn, highlightOn, strokeColor) {
        if (!m_shapefile_layer) { // if no layer loaded, return
            return true;
        };

        let style, label;
        let tempLabelStyle = labelStyle.clone(); // make a clone that will store this text

        if (labelOn) { // turn on label for this feature
            label = get_label(feature);
            tempLabelStyle.getText().setText(label);
        } else { // turn off label for this feature
            tempLabelStyle.getText().setText(null);
        };

        if (highlightOn) { // set style to highlight
            if (feature.getGeometry().getType() === 'Point') {
                let pointIm = new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: 'rgba(134,206,226,0.1)' }),
                    stroke: new ol.style.Stroke({ color: '#31d2d8', width: 4 })
                })
                highlightStyle.setImage(pointIm)
            }
            style = [highlightStyle, tempLabelStyle];
        } else { // set style to deselect
            let temp = deselectStyle.clone();
            temp.getStroke().setColor(strokeColor);
            if (feature.getGeometry().getType() === 'Point') {
                let pointIm = new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: 'rgba(134,206,226,0.1)' }),
                    stroke: new ol.style.Stroke({ color: '#7d6aab', width: 2 })
                })
                temp.setImage(pointIm);
            }
            style = [temp, tempLabelStyle];
        };

        feature.setStyle(style);
        return true;
    };

    // Loads the selected vector layer to the map.
    add_vector_layer = function (fileurl,filename) {
        let deselectClone = deselectStyle.clone(); // make a clone so other already loaded layers won't change styles
        deselectClone.getStroke().setColor(nameFields[filename][0]); // get the color of the stroke associated with the file

        let style = [deselectClone, labelStyle];

        m_shapefile_layer = new ol.layer.Vector({
            source: vectorSource = new ol.source.Vector({ // define the source where we are pulling the layer from
                url: fileurl,
                format: new ol.format.GeoJSON(),
                strategy: ol.loadingstrategy.all // bbox loading strat reloads features and makes it difficult to keep consistent styles
            }),
            style: style, 
            declutter: true,
            className: filename
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

        var stackPos = get_stack_pos(filename, null);
        
        m_map.getLayers().insertAt(stackPos, m_shapefile_layer); // the other basemaps are at positions 0-4


        $("#loader").addClass("show"); // show loading image

        var listenerKey = vectorSource.on("change", function (e) { // ((this method only works with kml and geojson vector files))
            if (vectorSource.getState() == 'ready') {
                $("#loader").removeClass("show"); // hide loading icon
                ol.Observable.unByKey(listenerKey); // unregister "change" listener
            };
        });

        // update dictionary to keep track of leaded layer/sources
        loadedLayers[filename] = [m_shapefile_layer, vectorSource];

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
            alert(translatedStrings[languageCode]['unknown-platform']);
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
            alert(translatedStrings[languageCode]['unknown-sensor']);
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
        m_map.getLayers().insertAt(3, m_gee_layer); // the other basemaps are at 0-4
    };

    


    // Time Series Plot Methods
    // Get all selected and drawn features into objects with the same format into an array
    get_geometry = function () {

        var geo = new ol.format.GeoJSON; 

        var drawnAOI = $('#map_view_geometry').val();

        var vectorSelection = []; // array to hold geojson formatted strings

        featuresSelection.forEach(function (f) {

            // Reformat the geometry before adding to an array
            let selectedName = get_label(f);

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

        // translate tethys html elements
        // Header
        $('.settings-button').find('a').attr({ "data-original-title": translatedStrings[languageCode]['settings'] }); // settings button
        $('.exit-button').find('a').attr({ "data-original-title": translatedStrings[languageCode]['exit'] }); // exit button
        $('.login-button').find('a').attr({ "data-original-title": translatedStrings[languageCode]['log-in'] }); // log in button hover text
        $('.login-button').find('a').text(translatedStrings[languageCode]['log-in']); // log in button text
        // Map controls
        $('#basemap_dropdown').text(translatedStrings[languageCode]['bm-select'] + ' '); // basemap selector
        $('.ol-full-screen :button').attr({ "title": translatedStrings[languageCode]['full-screen'] }) // full screen toggle
        //$('.ol-full-screen :button').attr({ "title": translatedStrings[languageCode]['full-screen'] }) // attributions
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

        // allow the select input to have custom options
        $('#select_layer').select2({
            tags: true
        })

    });

    return public_interface;
})(); // End of package wrapper
