import pandas as pd
from plotly import graph_objs as go
from django.utils.translation import gettext as _
import datetime as dt

def compute_dates_for_product(product_dict):
    """
    Compute default dates and date range for given product.

    Args:
        product_dict (dict): the product dictionary from EE_PRODUCTS

    Returns:
        dict<default_start_date,default_end_date,beg_valid_date_range,end_valid_date_range>: dict with date strings formatted %Y-%m-%d.
    """
    
    # Hardcode initial end date to today (works since all datasets extend to present (ndvi..? TODO: check)
    today = dt.datetime.today()
    default_end_date = today.strftime('%Y-%m-%d')

    # Initial start date will a set number of days before the end date
    # (( this assumes the start date of the dataset is at least 90 days prior to today ))
    default_end_date_dt = dt.datetime.strptime(default_end_date, '%Y-%m-%d')
    default_start_date_dt = default_end_date_dt - dt.timedelta(days=90)
    default_start_date = default_start_date_dt.strftime('%Y-%m-%d')

    # get valid date range for product
    beg_valid_date_range = product_dict.get('start_date', None)
    end_valid_date_range = product_dict.get('end_date', None) or default_end_date
    
    product_dates = {
        'default_start_date': default_start_date,
        'default_end_date': default_end_date,
        'beg_valid_date_range': beg_valid_date_range,
        'end_valid_date_range': end_valid_date_range
    }

    return product_dates


def generate_figure(figure_title, time_series, reducer, series_names):
    """
    Generate a figure from a list of time series Pandas DataFrames.

    Args:
        figure_title(str): Title of the figure.
        time_series(list<pandas.DataFrame>): list of time series Pandas DataFrames.
    """
    data = []
    yaxis_title = 'No Data'

    for index, df in enumerate(time_series):
        column_name = df.columns[1]
        redu = _(reducer)
        yaxis_title = f'{column_name} ({redu})'
        series_name = series_names[index] 
        series_plot = go.Scatter(
            x=pd.to_datetime(df.iloc[:, 0], unit='ms'),
            y=df.iloc[:, 1],
            name=series_name,
            mode='lines+markers'
        )

        data.append(series_plot)

    figure = {
        'data': data,
        'layout': {
            'title': {
                'text': figure_title,
                'pad': {
                    'b': 5,
                },
            },
            'showlegend': True,
            'yaxis': {'title': yaxis_title},
            'legend': {
                'orientation': 'h'
            },
            'margin': {
                'l': 40,
                'r': 10,
                't': 80,
                'b': 10
            }
        }
    }

    return figure
