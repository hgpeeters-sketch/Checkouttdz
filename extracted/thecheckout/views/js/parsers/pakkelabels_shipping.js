/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.pakkelabels_shipping = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-pakkelabels_shipping.js] init_once()');
    }
    //elements.after("<script>console.info('test'); setTimeout(function() {jQuery('.delivery-option input:checked').click();}, 1000);</script>");
  },

  all_hooks_content: function(element) {
    if (debug_js_controller) {
      console.info('[thecheckout-pakkelabels_shipping.js] all_hooks_content()');
    }

    element.after("<script>setTimeout(function() {jQuery('.delivery-option input:checked').click();}, 1000);</script>");
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-pakkelabels_shipping.js] delivery_option()');
    }

    // Uncheck mondialrelay item, so that it can be manually selected
    
  },

  extra_content: function (element) {
  }

}
