from tethys_sdk.workspaces import app_workspace
import os
import tempfile
import zipfile
import ee
import logging
import datetime as dt
import json
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseRedirect
from django.utils.translation import ugettext as _
from django.shortcuts import render
from simplejson.errors import JSONDecodeError
from tethys_sdk.gizmos import SelectInput, DatePicker, Button, MapView, MVView, PlotlyView, MVDraw, MVLayer, ButtonGroup
from tethys_sdk.permissions import login_required
from ..gee.products import EE_PRODUCTS
from ..helpers import compute_dates_for_product
from ..app import EarthEngine as app

log = logging.getLogger(f'tethys.apps.{__name__}')



@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    default_platform = 'MODIS'
    default_sensors = EE_PRODUCTS[default_platform]
    first_sensor_key = next(iter(default_sensors.keys()))
    default_products = default_sensors[first_sensor_key]
    first_product_key = next(iter(default_products.keys()))
    first_product = default_products[first_product_key]

    # Build initial platform control
    platform_select = SelectInput(
        name='platform',
        display_text=_('SatellitePlatform'),
        options=(
            ('MODIS', 'MODIS'),
            ('Landsat', 'Landsat')
        )
    )

    # Build initial sensor control
    sensor_options = []

    for sensor in default_sensors:
        sensor_options.append((sensor.upper(), sensor))

    sensor_select = SelectInput(
        name='sensor',
        display_text=_('Sensor'),
        options=sensor_options
    )

    # Build initial product control
    product_options = []
    for product, info in default_products.items():
        product_options.append((info['display'], product))

    product_select = SelectInput(
        name='product',
        display_text=_('Product'),
        options=product_options
    )

    # Get initial default dates and date ranges for date picker controls
    first_product_dates = compute_dates_for_product(first_product)

    start_date = DatePicker(
        name='start_date',
        display_text=_('StartDate'),
        format='yyyy-mm-dd',
        start_view='decade',
        today_button=True,
        today_highlight=True,
        start_date=first_product_dates['beg_valid_date_range'],
        end_date=first_product_dates['end_valid_date_range'],
        initial=first_product_dates['default_start_date'],
        autoclose=True
    )

    end_date = DatePicker(
        name='end_date',
        display_text=_('EndDate'),
        format='yyyy-mm-dd',
        start_view='decade',
        today_button=True,
        today_highlight=True,
        start_date=first_product_dates['beg_valid_date_range'],
        end_date=first_product_dates['end_valid_date_range'],
        initial=first_product_dates['default_end_date'],
        autoclose=True
    )

    # Build reducer method control
    reducer_select = SelectInput(
        name='reducer',
        display_text=_('ReductionMethod'),
        options=(
            (_('median'), 'median'),
            (_('mean'), 'mean'),
            (_('mode'), 'mode'),
            (_('min'), 'min'),
            (_('max'), 'max'),
            (_('sum'), 'sum'),
            (_('count'), 'count'),
            (_('product'), 'product'),
        )
    )

    # Build Buttons
    load_button = Button(
        name='load_map',
        display_text=_('LoadImagery'),
        style='default',
        attributes={'id': 'load_map'}
    )

    clear_imagery_button = Button(
        name='clear_imagery',
        display_text=_('ClearImagery'),
        style='danger',
        attributes={'id': 'clear_imagery'}
    )


    plot_button = Button(
        name='load_plot',
        display_text=_('PlotAOI'), 
        style='default',
        attributes={'id': 'load_plot'}
    )

    select_layer = SelectInput(
        name='select_layer',
        attributes={'id': 'select_layer'},
        display_text=_('LayerHeader'),
        multiple=True,
        initial=(),
        options=(
            (_('Watersheds'),'watersheds_lev09_v1c.geojson'),
            (_('SettlProj'),'Admin_ProjectoAssentamento_INCRA_2017.geojson'),
            (_('AcreMunic'),'acre_municipalities.geojson'),
            (_('UcaDist'),'ucayali_DISTRITO.geojson'),
            (_('UcaAcre'),'UCA_ACRE.geojson'),
            (_('TITitled'),'Tis_titled.geojson'),
            (_('TIUntitled'),'Tis_untitled.geojson'),
            (_('TIReserves'),'Tis_reserves.geojson'),
            (_('TIProposedReserves'),'Tis_proposedreserves.geojson'),
            (_('ANPs'),'ANP.geojson'),
            (_('ProposedConserv'),'Proposed_conservation.geojson'),
            (_('ConcessionsLogging'),'Concesiones_logging.geojson'),
            (_('ConcessionsConservation'),'Concesiones_conservation.geojson'),
            (_('ConcessionsReforestation'),'Concesiones_reforestation.geojson'),
            (_('ConcessionsEcotourism'),'Concesiones_ecotourism.geojson'),
            (_('PetroleumExt'),'petroleo_explorexploit.geojson'),
            (_('PetroleumProc'),'petroleo_inprocess.geojson'),
            (_('Mining'),'mineria.geojson'),
            (_('IllegalMining'),'MineriaIlegal.geojson')
            )
    )

    # grab the key for the Bing Aerial imagery to use in the next object
    if app.get_custom_setting('bing_key_file'):
        with open(app.get_custom_setting('bing_key_file')) as f:
            bing_file = json.load(f)
            bing_key = bing_file['key']
    else:
        bing_key = 'na'

    map_view = MapView(
        height='100%',
        width='100%',
        controls=[
            'ZoomSlider', 'Rotate', 'FullScreen',
            {'ZoomToExtent': {
                'extent': [-77.124, -13.601, -67.124, -5.601]
            }}
        ],
        basemap=[
            'OpenStreetMap', # for some reason setting the labels here breaks everything. maybe bc it's too close to the default?
            'Stamen', # here too
            {'Bing': {'key': bing_key, 'imagerySet': 'Aerial', 'control_label': _('BingAerial')}}
        ],
        view=MVView(
            projection='EPSG:4326',
            center=[-72.0, -9.19],
            zoom=7,
            maxZoom=18,
            minZoom=2
        ),
        draw=MVDraw(
            controls=['Pan', 'Modify', 'Delete',
                      'Move', 'Point', 'LineString',
                      'Polygon', 'Box'],
            initial='Pan',
            output_format='GeoJSON',
            feature_selection=False,
            line_color='#209cc5',
            fill_color='rgba(134,206,226,0.1)'
        ),
        attributes={'id': 'map_view'},
        feature_selection=False
    )


    context = {
        'platform_select': platform_select,
        'sensor_select': sensor_select,
        'product_select': product_select,
        'start_date': start_date,
        'end_date': end_date,
        'reducer_select': reducer_select,
        'load_button': load_button,
        'clear_imagery_button': clear_imagery_button,
        'plot_button': plot_button,
        'ee_products': EE_PRODUCTS,
        'map_view': map_view,
        'select_layer': select_layer
    }

    return render(request, 'earth_engine/home.html', context)