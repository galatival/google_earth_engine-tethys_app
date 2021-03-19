# Earth Engine App

The Earth Engine is a Tethys App that displays and plots time series of evapotranspiration and NDVI products from Google Earth Engine, focused on Acre, Brazil and Ucayali, Brazil.

## Installation

Install the app with the Tethys Platform environment activated as follows:

```
# For development installations
tethys install -d

# For production installations
tethys install
```

## Settings

The app has two Custom Settings that can be used to configure the app to use a [Google Earth Engine service account](https://developers.google.com/earth-engine/service_account):

* **service_account_email**: Email associated with the service account.
* **private_key_file**: Path to service account JSON file containing the private key.

There is also one Custom Setting that is used to specify the location of the API key for the [Bing Aerial imagery base map](http://www.bingmapsportal.com/):
* **bing_key_file**: Path to the JSON file containing the Bing Aerial imagery API key

After install configure portal settings (portal_config.yml):

To specify the location of the locale files for translation, replacing the path with your local path:

```
tethys settings --set LOCALE_PATHS "['C:\Users\USERNAME\Documents\tethysdev\tethysapp-earth_engine\tethysapp\earth_engine\locale',]"
```

To change the language displayed (supported language codes: 'es', 'es-pe', 'pt-br','en-us', 'en'):

```
tethys settings --set LANGUAGE_CODE "pt-br"
```

## Authenticate for Development

Alternatively, you can authenticate with your personal Google Earth Engine account by running the following command:

```
earthengine authenticate
```

**WARNING**: Do not use personal Google Earth Engine credentials for a production installation.

