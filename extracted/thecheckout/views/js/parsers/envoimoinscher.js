/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['envoimoinscher'] = function() {
  if (
      /*$('#mondialrelay_widget').is(':visible')*/
      $('.delivery-option.envoimoinscher input[type=radio]').is(':checked') &&
      $('.emcListPoints').is(':visible') &&
      "undefined" !== typeof Emc && 
      !Emc.validateCarrierForm(true)
  ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.text(shippingErrorMsg.text());
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false;
  } else {
    return true;
  }
}

checkoutShippingParser.envoimoinscher = {
  init_once: function (elements) {
   
  },

  delivery_option: function (element) {
    
  },

  extra_content: function (element) {
  }

}
