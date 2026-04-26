/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['samedaycourier_easybox_locker'] = function () {
    if (
        $('#locker_address').length && 
        $('#showLockerMap:visible').length && 
        $('#locker_address').val() === ''
    ) {
      var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
      $('.shipping-validation-details').remove();
      shippingErrorMsg.append('<span class="shipping-validation-details"> (Sameday Courier - Alege easybox)</span>')
      shippingErrorMsg.show();
      scrollToElement(shippingErrorMsg);
      return false;
    } else {
      return true;
    }
};

