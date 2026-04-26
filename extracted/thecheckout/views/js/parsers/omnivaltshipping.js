/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['omnivaltshipping'] = function() { 
  if (
    $('[name=omnivalt_parcel_terminal]').is(':visible') &&
    !$('[name=omnivalt_parcel_terminal]').val()
    ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false; 
  } else {
    return true;
  }
} 

checkoutShippingParser.omnivaltshipping = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[omnivaltshipping] init_once()');
    }

    var additional_script_tag = "<script> \
        if ('undefined' !== typeof omnivaltDelivery) {\
          $('.delivery-options .delivery-option input[type=\"radio\"]').on('click',function(){\
            omnivaltDelivery.init();\
          });\
        }\
        </script> \
      ";
    elements.last().append(additional_script_tag);

  }
}
