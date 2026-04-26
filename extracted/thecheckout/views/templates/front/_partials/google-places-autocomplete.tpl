{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

{literal}
<script async
        src="https://maps.googleapis.com/maps/api/js?key={/literal}{$tc_config->google_maps_api_key}{literal}&libraries=places&callback=googlePlacesScriptLoadCallback">
</script>
<script>
    function tc_reInitGooglePlaces() {
        googlePlacesScriptLoadCallback();
    }
    var tc_autocomplete = {}
    var debug_google_places = 0;
    function googlePlacesScriptLoadCallback() {
        if (debug_google_places == 1) {
            console.log('googlePlacesScriptLoadCallback');
        }
        addEventListener('DOMContentLoaded', (event) => {
            /* global google */
            if (google) {
                for (const tc_addr_type of ['invoice', 'delivery']) {
                    // console.log('Attempt to bind ' + tc_addr_type, document.querySelector(`[data-address-type=${tc_addr_type}] [name=address1]`))
                    tc_autocomplete[tc_addr_type] = new google.maps.places.Autocomplete(document.querySelector(`[data-address-type=${tc_addr_type}] [name=address1]`), {
                        fields: ['address_components'],
                        strictBounds: false,
                        types: ['address'],
                        // TODO: component restriction based on selected country
                        // TODO: what about US states?
                        // componentRestrictions: { country: ['sk'] },
                    });
                    tc_autocomplete[tc_addr_type].addListener('place_changed', () => googlePlaceChanged(tc_addr_type, tc_autocomplete[tc_addr_type].getPlace()));

                    const initialIso = $(`[data-address-type=${tc_addr_type}] [name=id_country]`).children('option').filter(':selected').attr('data-iso-code');
                    tc_autocomplete[tc_addr_type].setComponentRestrictions({'country': initialIso});
                    $('body').off('googlePlacesScriptLoadCallback').on('change.componentRestrictions', `[data-address-type=${tc_addr_type}] [name=id_country]`, function() {
                        console.log('Google places, change.componentRestrictions change listener called');
                        if (tc_autocomplete && tc_autocomplete[tc_addr_type]) {
                            const iso = $(this).children('option').filter(':selected').attr('data-iso-code');
                            if (debug_google_places == 1) {
                                console.log(`setting '${iso}' as component/country restriction`)
                            }
                            tc_autocomplete[tc_addr_type].setComponentRestrictions({'country': iso});
                        }
                    });
                }
            }
        });
    }

    function googlePlaceChanged(addressType, place) {
        if (place.address_components) {
            if (debug_google_places == 1) {
                console.log(addressType, place);
            }
            const placeDetails = place.address_components.reduce((acc, x) => ({...acc, [x.types[0]]: x.long_name}), {});
            if (debug_google_places == 1) {
                console.log('Place details: ', placeDetails);
            }

            const streetNumberFirst = ['US', 'GB', 'AU'].includes(tc_autocomplete[addressType]?.componentRestrictions?.country);

            const tc_place_address = {};
            if (streetNumberFirst) {
                tc_place_address.street = `${placeDetails?.street_number || ''} ${placeDetails?.route || ''}`;
            } else {
                tc_place_address.street = `${placeDetails?.route || ''} ${placeDetails?.street_number || ''}`;
            }
            tc_place_address.city = placeDetails?.locality || placeDetails?.sublocality_level_1 || '';
            tc_place_address.postcode = placeDetails?.postal_code || '';
            tc_place_address.state = placeDetails?.administrative_area_level_1 || '';

            if (debug_google_places == 1) {
                console.log(tc_place_address);
            }

            var mapPlacePropsToFields = {
                address1: 'street',
                city: 'city',
                postcode: 'postcode',
                id_state: 'state'
            }

            var el;
            var stateEl;
            for (const [fieldName, propName] of Object.entries(mapPlacePropsToFields)) {
                el = $(`[data-address-type=${addressType}] [name=${fieldName}]`);
                if (tc_place_address && tc_place_address[propName]) {
                    if (propName === 'state') {
                        stateEl = el.find('option').filter(function() {
                            return $.trim($(this).text()).toLowerCase() === (tc_place_address[propName] || '').toLowerCase();
                        });
                        if (stateEl && stateEl.length) {
                           stateEl.attr('selected', true).trigger('change');
                        }
                    } else {
                        el.val(tc_place_address[propName] || '');
                        setTimeout(function (thisEl) {
                            // console.log('el.val', thisEl.val())
                            thisEl.change();
                        }, 100, el);
                    }
                }
            }
        }
    }
</script>
{/literal}
