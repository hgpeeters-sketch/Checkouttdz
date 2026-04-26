/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['pocztapolskaen'] = function() {
  if (
      (
        $('.delivery-option.pocztapolskaen input[type=radio]').is(':checked') &&
        $('.pp_pickup_at_point_standard:visible').length > 0 &&
        $('#pp_pni_pickup').length > 0 && $('#pp_pni_pickup').val() === ''
      ) ||
      (
        $('.delivery-option.pocztapolskaen input[type=radio]').is(':checked') &&
        $('.pp_pickup_at_point_cod:visible').length > 0 &&
        $('#pp_pni_pickup_cod').length > 0 && $('#pp_pni_pickup_cod').val() === ''
      )
  ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    $('.shipping-validation-details').remove();
    shippingErrorMsg.append('<span class="shipping-validation-details"> (Poczta Polska - punkt odbioru)</span>')
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false;
  } else {
    return true;
  }
}

checkoutShippingParser.pocztapolskaen = {

}
