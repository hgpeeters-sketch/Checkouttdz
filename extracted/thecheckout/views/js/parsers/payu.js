/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/**************** IMPORTANT NOTICE *****************/
/*
 Update also modules/payu/js/payu17.js, change line:
   document.addEventListener("DOMContentLoaded", function () {
 to:
   $(document).ready(function () {

 Also, switch PayU (in settings) to no-widget mode: Płatność kartą w widżecie = Nie
 */

tc_confirmOrderValidations['payu'] = function() {
    if (
        $('input[name=transferGateway]').length > 0 &&
        $('input[name=transferGateway]').closest('.js-payment-option-form').is(':visible') &&
        $('input[name=transferGateway]').val() === ''
    ) {
        var paymentErrorMsg = $('#thecheckout-payment .dynamic-content > .inner-wrapper > .error-msg');
        $('.payment-validation-details').remove();
        paymentErrorMsg.append('<span class="payment-validation-details"> (PayU channel)</span>')
        paymentErrorMsg.show();
        scrollToElement(paymentErrorMsg);
        return false;
    } else {
        return true;
    }
}

checkoutPaymentParser.payu = {
    after_load_callback: function() {
        setTimeout(function() {
            $.getScript(tcModuleBaseUrl+'/../payu/js/payu17.js')
                .done(
                    function() {
                        console.log('[thecheckout] modules/payu/payu17.js loaded')
                        // setTimeout(function() {
                        //     if (typeof enableBlikSupport !== 'undefined') { enableBlikSupport(); }
                        //     if (typeof enablePblSupport !== 'undefined') { enablePblSupport(); }
                        // }, 300);
                    })
                .fail(function( jqxhr, settings, exception ) {
                    console.log('payu17.js not found, probably different module?');
                });
        }, 100);
    },

    // form: function (element) {
    //     var blikPayButtonSelector = "form.paynow-blik-form .paynow-payment-option-container button.btn-primary";
    //     if (element.find('.paynow-blik-form').length) {
    //         element.find('.payment-form').attr('onsubmit', '$("'+blikPayButtonSelector+'").click(); return false;');
    //     }
    //
    //     // Add CSS rule to hid blickPayButton
    //     var element = document.createElement('style'),sheet;
    //     document.head.appendChild(element);
    //     element.sheet.insertRule(blikPayButtonSelector + '{ display: none; }');
    // },
}