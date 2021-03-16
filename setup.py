from setuptools import setup, find_namespace_packages
from tethys_apps.app_installation import find_resource_files

# -- Apps Definition -- #
app_package = 'earth_engine'
release_package = 'tethysapp-' + app_package

# -- Python Dependencies -- #
dependencies = []

# -- Get Resource File -- #
resource_files = find_resource_files('tethysapp/' + app_package + '/templates', 'tethysapp/' + app_package)
resource_files += find_resource_files('tethysapp/' + app_package + '/public', 'tethysapp/' + app_package)
resource_files += find_resource_files('tethysapp/' + app_package + '/locale', 'tethysapp/' + app_package)


with open('README.md', 'r') as f:
    long_description = f.read()

setup(
    name=release_package,
    version='0.1.0',
    description='An app for viewing and plotting evapotranspiration and NDVI within Acre, Brazil and Ucayali, Peru.',
    long_description=long_description,
    author='Valerie Galati',
    author_email='valerie.galati@richmond.edu',
    url='', # will be set up later once i publish to github
    license='BSD 3-Clause',
    packages=find_namespace_packages(),
    package_data={'': resource_files},
    include_package_data=True,
    zip_safe=False,
    install_requires=dependencies,
)