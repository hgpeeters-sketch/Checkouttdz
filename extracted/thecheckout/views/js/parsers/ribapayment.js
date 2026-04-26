/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['ribapayment'] = function() {
    if (
        $('#riba_coordinates:visible').length > 0 &&
        $('[name=payment-option]:checked').attr('data-module-name') === 'ribapayment' &&
        $.trim($('#riba_coordinates').val()) === ''
    ) {
        var paymentErrorMsg = $('#thecheckout-payment .dynamic-content > .inner-wrapper > .error-msg');
        $('.payment-validation-details').remove();
        paymentErrorMsg.append('<span class="payment-validation-details"> (inserire i codici ABI e CAB su cui appoggiare la ricevuta bancaria)</span>')
        paymentErrorMsg.show();
        scrollToElement(paymentErrorMsg);
        return false;
    } else {
        return true;
    }
}