from django.utils.translation import gettext as _

EE_PRODUCTS = {
    'MODIS': {
        'TERRA': {
            'evapotranspiration': {
                'display': _('NetEvap8Day500m'),
                'collection': 'MODIS/006/MOD16A2',
                'index': 'ET',
                'vis_params': {
                    'min': 0,
                    'max': 500,
                },
                'start_date': '2001-01-01',
                'end_date': None  # to present
            },
            'NDVI': {
                'display': _('NDVI16Day500m'),
                'collection': 'MODIS/006/MOD13A1',
                'index': 'NDVI',
                'vis_params': {
                    'min': 5300,
                    'max': 9000,
                },
                'start_date': '2000-02-18',
                'end_date': None  # to present
            }
        },
    },
    'Landsat': {
        '8': {
            'ndvi8': {
                'display': _('8DayNDVI'),
                'collection': 'GetLandsat8DayNDVI', # the premade products are bad, for now just calculating ndvi w a cloud mask
                'index': 'NDVI',
                'vis_params': {
                    'min': 0.0,
                    'max': 1.0,
                },
                'start_date': '2013-04-01',
                'end_date': None  # to present
            },
            'ndvi32': {
                'display': _('32DayNDVI'),
                'collection': 'GetLandsat32DayNDVI', # the premade products are bad, for now just calculating ndvi w a cloud mask
                'index': 'NDVI',
                'vis_params': {
                    'min': 0.0,
                    'max': 1.0,
                },
                'start_date': '2013-04-01',
                'end_date': None  # to present
            },
            'surface': { # todo: delete?
                'display': 'Surface Reflectance',
                'collection': 'LANDSAT/LC08/C01/T1_SR',
                'index': None,
                'vis_params': {
                    'bands': ['B4', 'B3', 'B2'],
                    'min': 0,
                    'max': 3000,
                    'gamma': 1.4,
                },
                'cloud_mask': 'mask_l8_sr',
                'start_date': '2013-04-01',
                'end_date': None  # to present
            },

        }
    }
}

