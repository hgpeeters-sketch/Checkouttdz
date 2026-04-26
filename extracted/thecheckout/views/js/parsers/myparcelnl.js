/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* (!) IMPORTANT (!)
   It's necessary to update also: myparcelnl\src\Module\Hooks\FrontHooks.php, change line: 
      if (! $this->context->controller instanceof OrderControllerCore) {
   to: 
      if (! $this->context->controller instanceof OrderControllerCore && $this->context->controller->page_name != "checkout") {

*/

checkoutShippingParser.myparcelnl = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-myparcelnl.js] init_once()');
    }
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-myparcelnl.js] delivery_option()');
    }

    element.append("<script>$(document).ready(setTimeout(function(){ prestashop.emit(\"changedCheckoutStep\", { \
                        event: new PointerEvent('body') \
                    }); \
                    setTimeout(function(){ \
                      prestashop.on('thecheckout_updateDeliveryOption', function() { \
                        if ($('.myparcel-delivery-options:visible').length == 0) { \
                          prestashop.emit(\"updatedDeliveryForm\", {dataForm:$('#js-delivery').serializeArray(),deliveryOption:$('#js-delivery').find('[name^=\"delivery_option\"]:checked').closest('.delivery-option-row')}); \
                      } \
                      })}, 500); \
                    }));</script>");
  },

  extra_content: function (element) {
  }

}
