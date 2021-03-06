/*
 * predefined [EPSG:3821] projection
 * Please make sure your desired projection can find on http://epsg.io/
 *
 * Usage :
 *      loadshp({
 *          url: '/shp/test.zip', // path or your upload file
 *          encoding: 'big5' // default utf-8
 *          EPSG: 3826 // default 4326
 *      }, function(geojson) {
 *          // geojson returned
 *      });
 *
 * Created by Gipong <sheu781230@gmail.com>
 *
 */

var inputData = {},
    geoData = {},
    EPSGUser, url, encoding, EPSG,
    EPSGDestination = proj4('EPSG:4326');

var translatedStrings = {
    'es': {
        'missing-shp': 'esBad shapefile input. No .shp file detected.',
        'missing-dbf': 'esBad shapefile input. No .dbf file detected.'
    },
    'pt': {
        'missing-shp': 'ptBad shapefile input. No .shp file detected.',
        'missing-dbf': 'ptBad shapefile input. No .dbf file detected.'
    },
    'en': {
        'missing-shp': 'Bad shapefile input. No .shp file detected.',
        'missing-dbf': 'Bad shapefile input. No .dbf file detected.'
    }
}

function loadshp(config, returnData) {
    inputData = {};
    url = config.url;
    encoding = typeof config.encoding != 'utf-8' ? config.encoding : 'utf-8';
    EPSG = typeof config.EPSG != 'undefined' ? config.EPSG : 4326;
    if (config.EPSGDestination) {
        EPSGDestination = config.EPSGDestination;
    }

    loadEPSG((('https:' == document.location.protocol) ? 'https://epsg.io/' : 'http://epsg.io/') + EPSG + '.js', function () {
        if (EPSG == 3821)
            proj4.defs([
                ['EPSG:3821', '+proj=tmerc +ellps=GRS67 +towgs84=-752,-358,-179,-.0000011698,.0000018398,.0000009822,.00002329 +lat_0=0 +lon_0=121 +x_0=250000 +y_0=0 +k=0.9999 +units=m +no_defs']
            ]);

        EPSGUser = proj4('EPSG:' + EPSG);

        if (typeof url != 'string') {
            var reader = new FileReader();
            reader.onload = function (e) {
                var URL = window.URL || window.webkitURL || window.mozURL || window.msURL,
                    zip = new JSZip(e.target.result);
                try {
                    if (zip.file(/.shp$/i)[0] === void (0)) throw "missing-shp";
                    if (zip.file(/.dbf$/i)[0] === void (0)) throw "missing-dbf";
                    var shpString = zip.file(/.shp$/i)[0].name,
                        dbfString = zip.file(/.dbf$/i)[0].name,
                        prjString = zip.file(/.prj$/i)[0];
                }
                catch (err) {
                    alert(translatedStrings[languageCode][err]); 
                    return ("bad shapefile " + err);
                };

                if (prjString) {
                    proj4.defs('EPSGUSER', zip.file(prjString.name).asText());
                    try {
                        EPSGUser = proj4('EPSGUSER');
                    } catch (e) {
                        console.error('Unsuported Projection: ' + e);
                }
                    

                    SHPParser.load(URL.createObjectURL(new Blob([zip.file(shpString).asArrayBuffer()])), shpLoader, returnData);
                    DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData);
                } else {
                    returnData(undefined);
                }
            }

            reader.readAsArrayBuffer(url);
        } else {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if (err) throw err;

                var URL = window.URL || window.webkitURL,
                    zip = new JSZip(data);
                if (zip.file(/.shp$/i).length > 0 && zip.file(/.dbf$/i).length > 0) {
                    shpString = zip.file(/.shp$/i)[0].name;
                    dbfString = zip.file(/.dbf$/i)[0].name;
                    prjString = zip.file(/.prj$/i)[0];
                    if (prjString) {
                        proj4.defs('EPSGUSER', zip.file(prjString.name).asText());
                        try {
                            EPSGUser = proj4('EPSGUSER');
                        } catch (e) {
                            console.error('Unsuported Projection: ' + e);
                        }
                    }

                    SHPParser.load(URL.createObjectURL(new Blob([zip.file(shpString).asArrayBuffer()])), shpLoader, returnData);
                    DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData);
                } else {
                    returnData(undefined);
                }
            });
        }
    });
}

function loadEPSG(url, callback) {
    var script = document.createElement('script');
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    document.getElementsByTagName('head')[0].appendChild(script);
}

function TransCoord(x, y) {
    if (proj4)
        var p = proj4(EPSGUser, EPSGDestination, [parseFloat(x), parseFloat(y)]);
    return { x: p[0], y: p[1] };
}

function shpLoader(data, returnData) {
    inputData['shp'] = data;
    /*
    if (inputData['shp'] && inputData['dbf'])
        if (returnData) returnData(toGeojson(inputData));
    */
}

function dbfLoader(data, returnData) {
    inputData['dbf'] = data;
    if (inputData['shp'] && inputData['dbf'])
        if (returnData) returnData(toGeojson(inputData));
}

function toGeojson(geojsonData) {
    var geojson = {},
        features = [],
        feature, geometry, points;

    var shpRecords = geojsonData.shp.records;
    var dbfRecords = geojsonData.dbf.records;

    geojson.type = "FeatureCollection";
    min = TransCoord(geojsonData.shp.minX, geojsonData.shp.minY);
    max = TransCoord(geojsonData.shp.maxX, geojsonData.shp.maxY);
    geojson.bbox = [
        min.x,
        min.y,
        max.x,
        max.y
    ];

    geojson.features = features;

    for (var i = 0; i < shpRecords.length; i++) {
        feature = {};
        feature.type = 'Feature';
        geometry = feature.geometry = {};
        properties = feature.properties = dbfRecords[i];
        console.log(shpRecords[i].shape)

        if (shpRecords[i].shape) {
            // point : 1 , polyline : 3 , polygon : 5, multipoint : 8
            switch (shpRecords[i].shape.type) {
                case 1:// Point (x,y)
                case 11:// PointZ (X, Y, Z, M)
                case 21:// PointM (X, Y, M)
                    geometry.type = "Point";
                    var reprj = TransCoord(shpRecords[i].shape.content.x, shpRecords[i].shape.content.y);
                    geometry.coordinates = [
                        reprj.x, reprj.y
                    ];
                    break;
                case 3:// Polyline
                case 8:
                    if (shpRecords[i].shape.content.parts.length == 1) {
                        geometry.type = (shpRecords[i].shape.type == 3 ? "LineString" : "MultiPoint");
                        geometry.coordinates = [];
                        for (var j = 0; j < shpRecords[i].shape.content.points.length; j += 2) {
                            var reprj = TransCoord(shpRecords[i].shape.content.points[j], shpRecords[i].shape.content.points[j + 1]);
                            geometry.coordinates.push([reprj.x, reprj.y]);
                        };
                    } else if (shpRecords[i].shape.content.parts.length > 1) {
                        geometry.type = "MultiLineString";
                        geometry.coordinates = [];
                        for (var partIndex = 0; partIndex < shpRecords[i].shape.content.parts.length; partIndex++) {
                            var startIndex = shpRecords[i].shape.content.parts[partIndex] * 2;
                            var finishIndex = ((shpRecords[i].shape.content.parts.length - 1) === partIndex) ?
                                shpRecords[i].shape.content.points.length : (shpRecords[i].shape.content.parts[partIndex + 1] * 2);

                            var coordinatesArray = [];
                            while (startIndex < finishIndex) {
                                var reprj = TransCoord(shpRecords[i].shape.content.points[startIndex], shpRecords[i].shape.content.points[startIndex + 1]);
                                coordinatesArray.push([reprj.x, reprj.y]);
                                startIndex += 2;
                            }

                            geometry.coordinates.push(coordinatesArray);
                        }
                    }
                    break;
                case 13:// PolylineZ
                case 23:// PolylineM
                    if (shpRecords[i].shape.content.parts.length == 1) {
                        geometry.type = "LineString";
                        geometry.coordinates = [];
                        for (var j = 0; j < shpRecords[i].shape.content.points.length; j += 2) {
                            var reprj = TransCoord(shpRecords[i].shape.content.points[j], shpRecords[i].shape.content.points[j + 1]);
                            geometry.coordinates.push([reprj.x, reprj.y]);
                        };
                    } else if (shpRecords[i].shape.content.parts.length > 1) {
                        geometry.type = "MultiLineString";
                        geometry.coordinates = [];
                        for (var partIndex = 0; partIndex < shpRecords[i].shape.content.parts.length; partIndex++) {
                            var startIndex = shpRecords[i].shape.content.parts[partIndex] * 2;
                            var finishIndex = ((shpRecords[i].shape.content.parts.length - 1) === partIndex) ?
                                shpRecords[i].shape.content.points.length : (shpRecords[i].shape.content.parts[partIndex + 1] * 2);

                            var coordinatesArray = [];
                            while (startIndex < finishIndex) {
                                var reprj = TransCoord(shpRecords[i].shape.content.points[startIndex], shpRecords[i].shape.content.points[startIndex + 1]);
                                coordinatesArray.push([reprj.x, reprj.y]);
                                startIndex += 2;
                            }

                            geometry.coordinates.push(coordinatesArray);
                        }
                    }
                    break;
                case 25: // PolygonM
                case 15: // PolygonZ
                case 5:// Polygon (MBR, partCount, pointCount, parts, points)
                    geometry.type = "Polygon";
                    geometry.coordinates = [];

                    for (var pts = 0; pts < shpRecords[i].shape.content.parts.length; pts++) {
                        var partsIndex = shpRecords[i].shape.content.parts[pts],
                            part = [],
                            dataset;

                        for (var j = partsIndex * 2; j < (shpRecords[i].shape.content.parts[pts + 1] * 2 || shpRecords[i].shape.content.points.length); j += 2) {
                            var point = shpRecords[i].shape.content.points;
                            var reprj = TransCoord(point[j], point[j + 1]);
                            part.push([reprj.x, reprj.y]);
                        };
                        geometry.coordinates.push(part);

                    };
                    break;
                default:
            }
            if ("coordinates" in feature.geometry) features.push(feature);
        }
    };
    return geojson;
}