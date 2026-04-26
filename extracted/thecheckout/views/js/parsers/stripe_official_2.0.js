/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* popup mode last tested on 15.4.2023 with stripe_official v3.0.2 */


checkoutPaymentParser.stripe_official_inline = {

    all_hooks_content: function (content) {

    },

    container: function (element) {

        //payment.setPopupPaymentType(element);
        // Add logos to payment method
        // Img path:
        var stripe_base_url = '';
        if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {
            stripe_base_url = prestashop.urls.base_url;
        }

        element.find('label').append('<img src="' + stripe_base_url + '/modules/stripe_official/views/img/logo-payment.png">');

    },


    form: function (element) {

        // First, set the 'form' action to be our background confirmation button click
        // On this background confirmation button, stripe action is hooked
        let form = element.find('form');
        let onSubmitAction = '$(\'#payment-confirmation button\').click();';
        form.attr('action', 'javascript:void(0);');
        form.attr('onsubmit', onSubmitAction);

        // And now, let's put Stripe's form into static container, so that it's not being refreshed
        var paymentOptionForm = element;
        var staticContentContainer = $('#thecheckout-payment .static-content');

        // Now create new block with original Id and place it inside of static-content block
        if (!staticContentContainer.find('.stripe-payment-form').length) {
            $('<div class="stripe-payment-form"></div>').appendTo(staticContentContainer);
            paymentOptionForm.clone().appendTo(staticContentContainer.find('.stripe-payment-form'));
            staticContentContainer.find('.stripe-payment-form script').remove();

            // Formatted version - KEEP it
            // Init only once - when we're first time moving CC form
            // let stripe_orig_script_tag = `
            // <script>
            // if ($('#stripe-card-element').length && !$('#stripe-card-element.StripeElement').length) {
            //     var stripe_base_url = '';
            //     if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {
            //         stripe_base_url = prestashop.urls.base_url;
            //     }
            //     $.getScript(stripe_base_url + '/modules/stripe_official/views/js/payments.js');
            // }
            // </script>
            // `;

            // https://babeljs.io/repl
            var stripe_orig_script_tag = "\n            <script>\n            if (($('#stripe-card-element').length && !$('#stripe-card-element.StripeElement').length) || ($('#stripe-card-number').length && !$('#stripe-card-number.StripeElement').length)) {\n                var stripe_base_url = '';\n                if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {\n                    stripe_base_url = prestashop.urls.base_url;\n                }\n                $.getScript(stripe_base_url + '/modules/stripe_official/views/js/payments.js');\n            }\n            </script>\n            ";
            //


            staticContentContainer.find('.stripe-payment-form').append(stripe_orig_script_tag);
        }

        // Remove stripe payment form from actual .js-payment-option-form container and keep only "dynamic" part,
        // which is <script> tag with dynamically created variables
        var scriptTag = paymentOptionForm.find('script');
        // stripe_official can have multiple payment options, make sure move only card payment to static-container
        if (paymentOptionForm.find('#stripe-card-payment').length) {
            paymentOptionForm.find('*').remove();
            paymentOptionForm.prepend(scriptTag);

            // Update ID of fixed form, so that it's displayed/hidden automatically with payment method selection
            var origId = paymentOptionForm.attr('id');
            staticContentContainer.find('.stripe-payment-form .js-payment-option-form').attr('id', origId);

            // Remove tag ID and class from original form
            paymentOptionForm.attr('id', 'stripe-script-tag-container');
            paymentOptionForm.removeClass('js-payment-option-form');
        }
    }

}


checkoutPaymentParser.stripe_official_popup = {

    popup_onopen_callback: function () {
        checkoutPaymentParser.stripe_official_popup.initPayment();
    },

    all_hooks_content: function (content) {

    },

    initPayment: function() {
        if (($('#stripe-card-element').length && !$('#stripe-card-element.StripeElement').length) ||
            ($('#stripe-card-number').length && !$('#stripe-card-number.StripeElement').length) ||
            ($('#js-stripe-payment-element').length && !$('#js-stripe-payment-element.StripeElement').length)) {
            // var stripe_base_url = '';
            // if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {
            //     stripe_base_url = prestashop.urls.base_url;
            // }
            $.getScript(tcModuleBaseUrl+'/../stripe_official/views/js/checkout.js');
            // $.getScript(stripe_base_url + '/modules/stripe_official/views/js/payments.js');
        }
    },

    container: function(element) {

        var stripe_base_url = '';
        if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {
            stripe_base_url = prestashop.urls.base_url;
        }

        element.find('label').append('<img src="' + stripe_base_url + '/modules/stripe_official/views/img/logo-payment.png">');

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
                console.info('[stripe_official parser] Not confirmation trigger, removing payment form');
            }
            element.remove();
        } else {
            // var stripe_orig_script_tag = "\n            <script>\n            if (($('#stripe-card-element').length && !$('#stripe-card-element.StripeElement').length) || ($('#stripe-card-number').length && !$('#stripe-card-number.StripeElement').length)) {\n                var stripe_base_url = '';\n                if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {\n                    stripe_base_url = prestashop.urls.base_url;\n                }\n                $.getScript(stripe_base_url + '/modules/stripe_official/views/js/payments.js');\n            }\n            </script>\n            ";
            // element.append(stripe_orig_script_tag);
            // checkoutPaymentParser.stripe_official_popup.initPayment();
        }

        return;
    }

}

// Default Stripe parser
//checkoutPaymentParser.stripe_official = checkoutPaymentParser.stripe_official_inline;
checkoutPaymentParser.stripe_official = checkoutPaymentParser.stripe_official_popup;


