/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.tntofficiel = {
    init_once: function (elements) {
    },

    on_ready: function() {
        setTimeout(function(){
            if ('undefined' != typeof window.TNTOfficiel && 
                'undefined' != typeof window.TNTOfficiel.carrier && 
                'undefined' != typeof window.TNTOfficiel.carrier.list) {


                window.strTNTOfficieljQSelectorInputRadioTNT = jQuery.map(window.TNTOfficiel.carrier.list, function (value, id_carrier) {
                    return '.delivery-option input:radio[value^="' + id_carrier + ',"]';
                }).join(', ');

                // Flag.
                jQuery.extend(true, window.TNTOfficiel, {
                    "cart": {
                        "isCarrierListDisplay": true
                    }
                });
            }
        },300)
    },

    delivery_option: function (element) {
        element.append(' \
        <script> \
          $(document).ready( \
             checkoutShippingParser.tntofficiel.on_ready \
          ); \
        </script> \
    ');

    },

    extra_content: function (element) {
    }

}
