from tethys_sdk.workspaces import app_workspace
import os
import ee
import logging
import datetime as dt
import geojson
from ..helpers import generate_figure
from ..gee.methods import get_image_collection_asset, get_time_series_from_image_collection
from ..gee.products import EE_PRODUCTS
from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils.translation import ugettext as _
from django.shortcuts import render
from simplejson.errors import JSONDecodeError
from tethys_sdk.gizmos import SelectInput, DatePicker, Button, MapView, MVView, PlotlyView, MVDraw, MVLayer, ButtonGroup
from tethys_sdk.permissions import login_required

log = logging.getLogger(f'tethys.apps.{__name__}')

@login_required()
def get_image_collection(request):
    """
    Controller to handle image collection requests.
    """
    response_data = {'success': False}

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        log.debug(f'POST: {request.POST}')

        platform = request.POST.get('platform', None)
        sensor = request.POST.get('sensor', None)
        product = request.POST.get('product', None)
        start_date = request.POST.get('start_date', None)
        end_date = request.POST.get('end_date', None)
        reducer = request.POST.get('reducer', None)

        url = get_image_collection_asset(
            platform=platform,
            sensor=sensor,
            product=product,
            date_from=start_date,
            date_to=end_date,
            reducer=reducer
        )

        log.debug(f'Image Collection URL: {url}')

        response_data.update({
            'success': True,
            'url': url
        })

    except Exception as e:
        response_data['error'] = f'Error Processing Request: {e}'

    return JsonResponse(response_data)

@login_required()
def get_time_series_plot(request):
    context = {'success': False}
    
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        log.debug(f'POST: {request.POST}')

        platform = request.POST.get('platform', None)
        sensor = request.POST.get('sensor', None)
        product = request.POST.get('product', None)
        start_date = request.POST.get('start_date', None)
        end_date = request.POST.get('end_date', None)
        reducer = request.POST.get('reducer', None)
        index_name = request.POST.get('index_name', None)
        scale = float(request.POST.get('scale', 250))
        geometry_str = request.POST.get('geometry', None)
        
        # Derived parameters
        ee_product = EE_PRODUCTS[platform][sensor][product]
        display_name = ee_product['display']

        if not index_name:
            index_name = ee_product['index']
       
        
        try:
            geometry = geojson.loads(geometry_str)
            # get the id of the feature
            ids = []
            for geom in geometry.geometries:
                ids.append(geom.properties.get('id'))

        except JSONDecodeError:
            err = _('NoAOIError')
            raise ValueError(err)

        if index_name is None:
            err = _('We\'re sorry, but plotting %(product)s is not supported at this time. Please select a different product.') % {'product': display_name}
            raise ValueError(err)
        
        time_series = get_time_series_from_image_collection(
            platform=platform,
            sensor=sensor,
            product=product,
            index_name=index_name,
            scale=scale,
            geometry=geometry,
            date_from=start_date,
            date_to=end_date,
            reducer=reducer
        )
        print(time_series)
        log.debug(f'Time Series: {time_series}')
        figure = generate_figure(
            figure_title=f'{display_name} ({platform} {sensor})',
            time_series=time_series,
            reducer=reducer,
            series_names=ids
        )

        plot_view = PlotlyView(figure, height='200px', width='100%')

        context.update({
            'success': True,
            'plot_view': plot_view

        })

    except ValueError as e:
        context['error'] = str(e)

    except Exception:
        context['error'] = _('An unexpected error has occurred. Please try again.')
        log.exception('An unexpected error occurred.')

    return render(request, 'earth_engine/plot.html', context) 
