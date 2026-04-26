/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* popup mode last tested on 15.4.2023 with revolutpayment v2.2.4 */

checkoutPaymentParser.revolutpayment = {

    popup_onopen_callback: function () {
        checkoutPaymentParser.revolutpayment.initPayment();
    },

    all_hooks_content: function (content) {

    },

    initPayment: function() {
        // revolut_card container present, but fields not yet initiated
        if ($('#revolut_card').length && !($('#revolut_card.rc-card-field').length)) {
            $.getScript(tcModuleBaseUrl+'/../revolutpayment/views/js/version17/revolut.payment.js');
        }
    },

    container: function(element) {
        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="stripe_official popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);
    },

    form: function (element, triggerElementName) {

        if (!payment.isConfirmationTrigger(triggerElementName)) {
            if (debug_js_controller) {
                console.info('[revolutpayment parser] Not confirmation trigger, removing payment form');
            }
            element.remove();
        } else {
            // Intentially empty
        }

        return;
    }

}

