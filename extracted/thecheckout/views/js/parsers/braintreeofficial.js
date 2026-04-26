/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

 /*
    Fix necessary - modules/braintreeofficial/views/js/payment_bt.js; since braintreeofficial 1.1.2 and checkout module 3.2.6, separate payment page is enforced for Braintree
    27.4.2023: braintreeofficial v1.2.5, now working in popup mode, no need to patch anymore.
 */

checkoutPaymentParser.braintreeofficial = {

    init_once: function(elements) {
        // Change original .additional-information block to js-payment-option-form
        const additionalInfoEl = elements.find('.additional-information');
        const formId = additionalInfoEl.attr('id').replace(/payment-option-(\d+)-.*/, 'pay-with-payment-option-$1-form');
        additionalInfoEl.attr('id', formId).attr('class', 'js-payment-option-form ps-hidden').hide();
        additionalInfoEl.find('.row > .col-md-10').removeClass('col-md-10');
    },

    popup_onopen_callback: function () {
        checkoutPaymentParser.braintreeofficial.initPayment();
    },

    initPayment: function() {
        setTimeout(function () {
            // Load only when braintree hosted fields are not initialized yet
            if (!$('.braintree-card #card-number iframe').length) {
                $.getScript(tcModuleBaseUrl + '/../braintreeofficial/views/js/payment_bt.js');
            }
            //console.info("$.getScript(tcModuleBaseUrl + '/../braintreeofficial/views/js/payment_bt.js')");
        }, 300)
    },

    container: function(element) {

        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="braintreeofficial popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);

    },

    form: function (element, triggerElementName) {

        if (!payment.isConfirmationTrigger(triggerElementName)) {
            if (debug_js_controller) {
                console.info('[braintreeofficial parser] Not confirmation trigger, removing payment form');
            }
            element.remove();
        } else {
            // intentionally empty
        }

        return;
    }


    // additionalInformation: function (element) {

    //     var paymentOptionForm = element;
    //     var staticContentContainer = $('#thecheckout-payment .static-content');


    //     if (!staticContentContainer.find('.braintree-payment-form').length) {
    //         $('<div class="braintree-payment-form"></div>').appendTo(staticContentContainer);
    //         paymentOptionForm.clone().appendTo(staticContentContainer.find('.braintree-payment-form'));
    //     }

    //     paymentOptionForm.find('*').remove();

    //     // Update ID of fixed form, so that it's displayed/hidden automatically with payment method selection
    //     var origId = paymentOptionForm.attr('id');
    //     staticContentContainer.find('.braintree-payment-form .js-additional-information').attr('id', origId);

    //     // Remove tag ID and class from original form
    //     paymentOptionForm.attr('id', 'braintree-form-original-container');
    //     paymentOptionForm.removeClass('js-additional-information');


    //     var additional_script_tag = " \
    //             <script> \
    //             $(document).ready( \
    //                 checkoutPaymentParser.braintreeofficial.on_ready \
    //             ); \
    //             </script> \
    //         ";


    //     element.append(additional_script_tag);

    // }

}