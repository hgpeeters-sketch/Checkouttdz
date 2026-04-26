/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


tc_confirmOrderValidations['itellashipping'] = function() { 
  if (
    $('.delivery-option.itellashipping input[name^=delivery_option]').is(':checked') &&
    !$('#itella_pickup_point_id').val()
    ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false; 
  } else {
    return true;
  }
} 

checkoutShippingParser.itellashipping = {
  extra_content: function (element) {
    element.after("<script>\
      $(document).ready(function(){\
        if ('undefined' !== typeof ItellaModule && 'undefined' !== typeof ItellaModule.init) {\
          typeof ItellaModule.init();\
        }\
      });\
      </script>");
  }, 

  init_once: function (elements) {
    

  }

}
