/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.colissimo = {
    on_ready: function() {
        setTimeout(function(){
            if ($('.iti').length == 0 && 'undefined' !== typeof initMobileField) {
               initMobileField();
               if ($('#colissimo-pickup-mobile-phone').length) {
                 $('#colissimo-pickup-mobile-phone').keyup();
               }
            }
        },100)
    },
    delivery_option: function (element) {
        element.append(' \
            <script> \
              $(document).ready( \
                 checkoutShippingParser.colissimo.on_ready \
              ); \
            </script> \
        ');
    },
}