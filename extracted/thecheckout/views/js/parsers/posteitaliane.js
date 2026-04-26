/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.posteitaliane = {
    init_once: function (elements) {
    },

    on_ready: function() {
        setTimeout(function(){
            if ('function' == typeof checkSelectedShippingMethod) {
                $('#js-delivery').on('change', 'input[name^=delivery_option]', function(e) {
                    checkSelectedShippingMethod();
                });
                checkSelectedShippingMethod();
            }
        },300)
    },

    delivery_option: function (element) {
        element.append(' \
        <script> \
          $(document).ready( \
             checkoutShippingParser.posteitaliane.on_ready \
          ); \
        </script> \
    ');

    },

    extra_content: function (element) {
    }

}
