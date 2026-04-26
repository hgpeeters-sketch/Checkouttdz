/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.adyenofficial = {

    after_load_callback: function() {
        if ("undefined" !== typeof adyenCheckoutConfiguration) {
            $.getScript('modules/adyenofficial/views/js/checkout-component-renderer.js')
        }
    },

    popup_onopen_callback: function() {
        $('#payment-confirmation .btn').off('click.confirm_popup').on('click.confirm_popup', () => { $('.popup-payment-form > .js-payment-option-form form').submit(); })
    },

    container: function(element) {

        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="adyenofficial popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);
    }

}

