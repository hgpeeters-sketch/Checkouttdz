/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['ruch'] = function() {
  if (
      $('.delivery-option.ruch input[type=radio]').is(':checked') &&
      'undefined' !== typeof testPkt17() && !testPkt17()
  ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    $('.shipping-validation-details').remove();
    shippingErrorMsg.append('<span class="shipping-validation-details"> (ORLEN Paczka)</span>')
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false;
  } else {
    return true;
  }
}

checkoutShippingParser.ruch = {
  after_load_callback: function(deliveryOptionIds) {
    if ('undefined' !== typeof ruch_widget_started && 'undefined' !== typeof testRuchServ17)
    {
      ruch_widget_started = false;
      testRuchServ17();
      $('.delivery-option input').on('click', function() {
        testRuchServ17();
      });
    }
  },
}
