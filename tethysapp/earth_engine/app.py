from tethys_sdk.base import TethysAppBase, url_map_maker
from tethys_sdk.app_settings import CustomSetting


class EarthEngine(TethysAppBase):
    """
    Tethys app class for Earth Engine.
    """

    name = 'Time Series of NDVI and EV in Ucayali-Peru and Acre-Brazil'
    index = 'earth_engine:home'
    icon = 'earth_engine/images/earth-engine-logo.png'
    package = 'earth_engine'
    root_url = 'earth-engine'
    color = '#524745'
    description = 'This app creates time series of vegetation and evapotranspiration in the context of watersheds and indigenous territories in Ucayali-Peru and Acre-Brazil'
    tags = 'ET, NDVI, Vegetation, MODIS, Landsat, Time Series'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='earth-engine',
                controller='earth_engine.controllers.home.home'
            ),
            UrlMap(
                name='get_image_collection',
                url='earth-engine/get-image-collection',
                controller='earth_engine.controllers.viewer.get_image_collection'
            ),
            UrlMap(
                name='get_time_series_plot',
                url='earth-engine/get-time-series-plot',
                controller='earth_engine.controllers.viewer.get_time_series_plot' 
            ),
            UrlMap( # TODO: figure out how to remove this
                name='getFeatureCollectionTileUrl',
                url='earth-engine/get-feature-collection-TileUrl',
                controller='earth_engine.gee.methods.getFeatureCollectionTileUrl'
            ),
            UrlMap(
                name='rest_get_time_series',
                url='earth-engine/api/get-time-series',
                controller='earth_engine.controllers.rest.get_time_series'
            ),

        )

        return url_maps

    def custom_settings(self):
        """
        Custom settings.
        """
        custom_settings = (
            CustomSetting(
                name='service_account_email',
                type=CustomSetting.TYPE_STRING,
                description='Email associated with the service account.',
                default='',
                required=False,
            ),
            CustomSetting(
                name='private_key_file',
                type=CustomSetting.TYPE_STRING,
                description='Path to service account JSON file containing the private key.',
                default='',
                required=False,
            ),
            CustomSetting(
                name='bing_key_file',
                type=CustomSetting.TYPE_STRING,
                description='Path to the JSON file containing the private key for the Bing Aerial imagery.',
                default='',
                required=False,
           ),
        )
        return custom_settings
