import logging
import ee
import os
from ee.ee_exception import EEException
import geojson
import pandas as pd
from . import cloud_mask as cm
from .products import EE_PRODUCTS
from django.http import HttpResponse, HttpResponseBadRequest
from json import dumps
import json
from tethys_sdk.workspaces import app_workspace
from django.utils.translation import gettext as _
import datetime as dt
from ..app import EarthEngine as app


log = logging.getLogger(f'tethys.apps.{__name__}')

# Handle Google Earth Engine Authentication
service_account = app.get_custom_setting('service_account_email')
private_key_path = app.get_custom_setting('private_key_file')

if service_account and private_key_path and os.path.isfile(private_key_path):
    try:
        credentials = ee.ServiceAccountCredentials(service_account, private_key_path)
        ee.Initialize(credentials)
        log.info('Successfully initialized GEE using service account.')
    except EEException as e:
        log.warning('Unable to initialize GEE using service account. If installing ignore this warning.')
else:
    try:
        ee.Initialize()
    except EEException as e:
        log.warning('Unable to initialize GEE with local credentials. If installing ignore this warning.')


def image_to_map_id(image_name, vis_params={}):
    """
    Get the tile fetcher url
    """
    try:
        map_id = image_name.getMapId(vis_params)
        tile_fetcher_url = map_id['tile_fetcher'].url_format
        return tile_fetcher_url

    except EEException as e:
        print('error in image to map id')
        print(e)
        log.exception('An error occurred while attempting to retrieve the map id.')

    except:
        print('other error')
        raise

def filt_date8(start):
    ls8toa = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA") # use Real-Time to avoid images with no bands
    filt_col = ls8toa.filterDate(ee.Date(start),ee.Date(start).advance(7,'day'))
    filt_im = ee.Image(filt_col.median().set('SENSOR_ID','OLI_TIRS').set('system:time_start',start))
    return filt_im

def filt_date32(start):
    ls8toa = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA") # use Real-Time to avoid images with no bands
    filt_col = ls8toa.filterDate(ee.Date(start),ee.Date(start).advance(31,'day'))
    filt_im = ee.Image(filt_col.median().set('SENSOR_ID','OLI_TIRS').set('system:time_start',start))
    return filt_im

def mask_ndvi(image):
    try:
        cloud_score = ee.Algorithms.Landsat.simpleCloudScore(image)
        cloud_mask = cloud_score.select(['cloud']).lte(20)
        masked_toa = image.updateMask(cloud_mask)
        ndvi_im = ee.Image(masked_toa.normalizedDifference(['B5','B4']).rename('NDVI').set('system:time_start',image.date().millis()))
        return ndvi_im
    except EEException:
        log.exception('An error occurred while attempting to calculate the cloud mask/NDVI.')
        return None

def get_ndvi_col(date_from, date_to, increment):
    try:
        start_date = ee.Date(date_from)
        second_date = start_date.advance(increment,'day').millis()
        increase = second_date.subtract(start_date.millis())
        date_list = ee.List.sequence(start_date.millis(), ee.Date(date_to).millis(), increase)
        if increment == 7: # TODO: make these one function with mult mapping params or within this other function
            filtered_by_date = ee.ImageCollection.fromImages(date_list.map(filt_date8,True)) # get one image per 8 days
        elif increment == 31:
            filtered_by_date = ee.ImageCollection.fromImages(date_list.map(filt_date32,True)) # get one image per 32 days
        masked_ndvi = ee.ImageCollection(filtered_by_date.map(mask_ndvi)) # get the masked and ndvi
        return masked_ndvi

    except EEException:
        log.exception(
            'An error occurred while attempting to calculate the NDVI.')

def get_image_collection_asset(platform, sensor, product, date_from=None, date_to=None, reducer='median'):
    """
    Get tile url for image collection asset.
    """
    ee_product = EE_PRODUCTS[platform][sensor][product]

    collection = ee_product['collection']

    index = ee_product.get('index', None)
    vis_params = ee_product.get('vis_params', {})
    cloud_mask = ee_product.get('cloud_mask', None)

    log.debug(f'Image Collection Name: {collection}')
    log.debug(f'Band Selector: {index}')
    log.debug(f'Vis Params: {vis_params}')

    tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}"


    try:
        if collection == 'LANDSAT/LC08/C01/T1_32DAY_NDVI': # get image collections for ndvi separately
            ee_collection = get_ndvi_col(date_from,date_to,31) # to mask clouds before calculating
        elif collection == 'LANDSAT/LC08/C01/T1_8DAY_NDVI':
            ee_collection = get_ndvi_col(date_from,date_to,7)
        else: # all other (non-ndvi) products
            ee_collection = ee.ImageCollection(collection)
            if date_from and date_to:
                ee_filter_date = ee.Filter.date(date_from, date_to)
                ee_collection = ee_collection.filter(ee_filter_date)

            if index:
                ee_collection = ee_collection.select(index)

            if cloud_mask: # delete? only sr using
                cloud_mask_func = getattr(cm, cloud_mask, None)
                if cloud_mask_func:
                    ee_collection = ee_collection.map(cloud_mask_func)

        if reducer:
            ee_collection = getattr(ee_collection, reducer)()
            
        if collection != 'LANDSAT/LC08/C01/T1_SR': # todo: take out? or figure out how to do sld with multiband?
            # Add a styled layer descriptor for the visualization
            min = vis_params.get('min')
            vis_range = vis_params.get('max') - min
            sld_intervals = '<RasterSymbolizer>' + \
                '<ContrastEnhancement><Normalize /></ContrastEnhancement>' + \
                '<ColorMap type="ramp" extended="false">' + \
                f'<ColorMapEntry color="#ffffff" quantity="{min}" />' + \
                f'<ColorMapEntry color="#ce7e45" quantity="{min+vis_range/11}" />' + \
                f'<ColorMapEntry color="#df923d" quantity="{min+vis_range/11*2}" />' + \
                f'<ColorMapEntry color="#f1b555" quantity="{min+vis_range/11*3}" />' + \
                f'<ColorMapEntry color="#fcd163" quantity="{min+vis_range/11*4}" />' + \
                f'<ColorMapEntry color="#99b718" quantity="{min+vis_range/11*5}" />' + \
                f'<ColorMapEntry color="#66a000" quantity="{min+vis_range/11*6}" />' + \
                f'<ColorMapEntry color="#3e8601" quantity="{min+vis_range/11*7}" />' + \
                f'<ColorMapEntry color="#207401" quantity="{min+vis_range/11*8}" />' + \
                f'<ColorMapEntry color="#056201" quantity="{min+vis_range/11*9}" />' + \
                f'<ColorMapEntry color="#004c00" quantity="{min+vis_range/11*10}"/>' + \
                f'<ColorMapEntry color="#011301" quantity="{min+vis_range}"/>' + \
                '</ColorMap>' + \
            '</RasterSymbolizer>'

            ee_collection = ee_collection.sldStyle(sld_intervals)
            vis_params = {}

        return image_to_map_id(ee_collection, vis_params)

    except EEException:
        log.exception(
            'An error occurred while attempting to retrieve the image collection asset.')

## TODO: take this out...?
def getFeatureCollectionTileUrl(request):
    return True

def get_time_series_from_image_collection(platform, sensor, product, index_name, scale=30, geometry=None,
                                          date_from=None, date_to=None, reducer='median', orient='df'):

    """
    Derive time series at given geometry.
    """
    time_series = []
    ee_product = EE_PRODUCTS[platform][sensor][product]

    collection_name = ee_product['collection']
    calculations = ee_product.get('calculate',None)
    print(f'Collection name: {collection_name}')
    
    ## If not a GeometryCollection, statement converts geometry to a GeometryCollection
    if not isinstance(geometry, geojson.GeometryCollection): 
        try:
            geometry = geojson.GeometryCollection([geometry])
            print(f'Geometry after being converted to a collection: {geometry}')
        except:
            log.exception('An error occurred trying to convert to a GeometryCollection.')

    if not isinstance(geometry, geojson.GeometryCollection): # TODO:I can't imagine a scenario where this would happen, remove?
        raise ValueError('?! Geometry must be a valid geojson.GeometryCollection')

    for geom in geometry.geometries:
        print(f'Computing Time Series for Geometry of Type: {geom.type}')
        log.debug(f'Computing Time Series for Geometry of Type: {geom.type}')

        try:
            ee_geometry = None
            if isinstance(geom, geojson.Polygon):
                ee_geometry = ee.Geometry.Polygon(geom.coordinates)
            elif isinstance(geom, geojson.Point):
                ee_geometry = ee.Geometry.Point(geom.coordinates)
            ## Following elif statement added to account for LineStrings in the current geojson files - Renato
            elif isinstance(geom, geojson.LineString):
                ee_geometry = ee.Geometry.LineString(geom.coordinates)
            ## Account for multipolygons (as in the Territorios Indigenas (TI_clip.geojson) file)
            elif isinstance(geom, geojson.MultiPolygon):
                ee_geometry = ee.Geometry.MultiPolygon(geom.coordinates)
            else:
                raise ValueError(f'Only Points, Polygons, MultiPolygons, and LineStrings are supported. Selected geometry type: {geom.type}.')

            if date_from is not None:
                if index_name is not None:
                    if collection_name == 'LANDSAT/LC08/C01/T1_32DAY_NDVI':
                        indexCollection = get_ndvi_col(date_from,date_to,31) # calculate 32-day ndvi composite
                    else:
                        indexCollection = ee.ImageCollection(collection_name) \
                            .filterDate(date_from, date_to)
                        indexCollection = indexCollection.select(index_name)
                else:
                    indexCollection = ee.ImageCollection(collection_name) \
                        .filterDate(date_from, date_to)
            else:
                indexCollection = ee.ImageCollection(collection_name)

            def get_index(image):
                if reducer:
                    the_reducer = getattr(ee.Reducer, reducer)()
    
                if index_name is not None:
                    index_value = image.reduceRegion(
                        the_reducer, ee_geometry, scale).get(index_name)
                else:
                    index_value = image.reduceRegion(
                        the_reducer, ee_geometry, scale)

                date = image.get('system:time_start')
                index_image = ee.Image().set(
                    'indexValue', [ee.Number(date), index_value])
                return index_image

            index_collection = indexCollection.map(get_index)
            index_collection_agg = index_collection.aggregate_array(
                'indexValue')
            values = index_collection_agg.getInfo()
            print('Values acquired.')
            log.debug('Values acquired.')

            df = pd.DataFrame(
                values, columns=['Time', index_name.replace("_", " ")])
            time_series.append(df)

        except EEException:
            log.exception(
                'An error occurred while attempting to retrieve the time series.')

    log.debug(f'Time Series: {time_series}')
    print(f'Time Series: {time_series}')
    return time_series
