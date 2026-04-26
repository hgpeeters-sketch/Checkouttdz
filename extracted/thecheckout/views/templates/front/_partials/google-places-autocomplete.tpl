{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
{if $tc_config->google_maps_api_key}
{literal}
<script async
        src="https://maps.googleapis.com/maps/api/js?key={/literal}{$tc_config->google_maps_api_key}{literal}&libraries=places&callback=googlePlacesScriptLoadCallback&loading=async">
</script>
<script>
    var tc_autocomplete = {};
    var debug_google_places = 0;

    function tc_reInitGooglePlaces() {
        initGooglePlacesAutocomplete();
    }

    // Called by the Google Maps API once it has loaded (via the &callback= parameter).
    // DOMContentLoaded has already fired by this point in virtually all real-world cases,
    // so we use jQuery ready() which executes immediately when the DOM is already loaded.
    function googlePlacesScriptLoadCallback() {
        $(function () {
            initGooglePlacesAutocomplete();
        });
    }

    function initGooglePlacesAutocomplete() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            return;
        }
        for (const tc_addr_type of ['invoice', 'delivery']) {
            const addressInput = document.querySelector('[data-address-type=' + tc_addr_type + '] [name=address1]');
            if (!addressInput) {
                continue;
            }

            tc_autocomplete[tc_addr_type] = new google.maps.places.Autocomplete(addressInput, {
                fields: ['address_components'],
                strictBounds: false,
                types: ['address'],
            });
            tc_autocomplete[tc_addr_type].addListener('place_changed', function (addrType) {
                return function () {
                    googlePlaceChanged(addrType, tc_autocomplete[addrType].getPlace());
                };
            }(tc_addr_type));

            // Set country restriction only when a real country is already selected
            var initialIso = $('[data-address-type=' + tc_addr_type + '] [name=id_country] option:selected').attr('data-iso-code');
            if (initialIso) {
                tc_autocomplete[tc_addr_type].setComponentRestrictions({'country': initialIso});
            }

            // Update restriction whenever the customer picks a different country.
            // Use a namespaced event so re-initialisation (tc_reInitGooglePlaces) can
            // cleanly remove the previous handler before attaching a new one.
            $('body')
                .off('change.googlePlacesCountry', '[data-address-type=' + tc_addr_type + '] [name=id_country]')
                .on('change.googlePlacesCountry', '[data-address-type=' + tc_addr_type + '] [name=id_country]', (function (addrType) {
                    return function () {
                        var iso = $(this).children('option:selected').attr('data-iso-code');
                        if (tc_autocomplete[addrType] && iso) {
                            tc_autocomplete[addrType].setComponentRestrictions({'country': iso});
                        }
                    };
                })(tc_addr_type));

            if (debug_google_places) {
                console.log('Google Places Autocomplete initialised for:', tc_addr_type, addressInput);
            }
        }
    }

    function googlePlaceChanged(addressType, place) {
        if (!place || !place.address_components) {
            return;
        }
        if (debug_google_places) {
            console.log('googlePlaceChanged', addressType, place);
        }

        var placeDetails = place.address_components.reduce(function (acc, x) {
            acc[x.types[0]] = x.long_name;
            return acc;
        }, {});

        var country = tc_autocomplete[addressType] && tc_autocomplete[addressType].componentRestrictions
            ? tc_autocomplete[addressType].componentRestrictions.country
            : '';
        var streetNumberFirst = ['US', 'GB', 'AU'].indexOf(country) !== -1;

        var street;
        if (streetNumberFirst) {
            street = ((placeDetails.street_number || '') + ' ' + (placeDetails.route || '')).trim();
        } else {
            street = ((placeDetails.route || '') + ' ' + (placeDetails.street_number || '')).trim();
        }

        var tc_place_address = {
            street:   street,
            city:     placeDetails.locality || placeDetails.sublocality_level_1 || '',
            postcode: placeDetails.postal_code || '',
            state:    placeDetails.administrative_area_level_1 || ''
        };

        if (debug_google_places) {
            console.log('Parsed place:', tc_place_address);
        }

        var mapPlacePropsToFields = {
            address1: 'street',
            city:     'city',
            postcode: 'postcode',
            id_state: 'state'
        };

        for (var fieldName in mapPlacePropsToFields) {
            var propName = mapPlacePropsToFields[fieldName];
            if (!tc_place_address[propName]) {
                continue;
            }
            var el = $('[data-address-type=' + addressType + '] [name=' + fieldName + ']');
            if (propName === 'state') {
                var stateVal = tc_place_address[propName].toLowerCase();
                var stateEl = el.find('option').filter(function () {
                    return $.trim($(this).text()).toLowerCase() === stateVal;
                });
                if (stateEl.length) {
                    stateEl.prop('selected', true).trigger('change');
                }
            } else {
                el.val(tc_place_address[propName]);
                setTimeout(function (thisEl) {
                    thisEl.trigger('change');
                }, 100, el);
            }
        }
    }
</script>
{/literal}
{/if}
