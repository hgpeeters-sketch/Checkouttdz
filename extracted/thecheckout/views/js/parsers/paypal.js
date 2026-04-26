/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 *
 * Last tested on 05.10.2022 with Paypal v5.8.0 by 202 ecommerce
 */

/*
    IMPORTANT: In paypal v5.8.0, make sure to disable 'Put the PayPal button at the end of the order page' option!
 */

checkoutPaymentParser.paypal = {

    isGermanPaypalPlus: function () {
        // return false; // Paypal v5.3.1 by 202 ecommerce update
        return ('undefined' !== typeof PAYPAL && 'undefined' !== typeof PAYPAL.apps && 'undefined' !== typeof PAYPAL.apps.PPP);
    },

    container: function(element) {
        // Fee parsing - optional, uncomment if Paypal module has a fee assigned
        // var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];
        // var feeHtml = element.find('label span').html();
        // var fee = payment.parsePrice(feeHtml.replace(/.*?\((.*?)\).*/,"$1"));
        // element.last().append('<div class="payment-option-fee hidden" id="'+paymentOption+'-fee">'+fee+'</div>');
    },

    init_once: function (content, triggerElementName) {
        // v5.5.0 fixes - set popup payment type and move additional info into popup - but only for in-context mode
        // 'content' can contain multiple ...-container elements, e.g. Paypal express checkout and Paypal standard
        containerElements = content.find('[id$=-container]');
        $.each(containerElements, function (n, containerElement) {
            additionalInfoElement = $(containerElement).next('[id$=-additional-information]');
            // If embedded mode (=data-container-express-checkout button exists), set popup payment type and make it binary

            if (additionalInfoElement.find('[data-container-express-checkout]').length || additionalInfoElement.find('[data-container-bnpl]').length) {
                payment.setPopupPaymentType($(containerElement), true);
                additionalInfoElement.addClass('paypal').addClass('paypal-hide-pp-info-and-button');
                additionalInfoElement.find('.pp-info').prependTo(additionalInfoElement);
                // additionalInfoElement.addClass('paypal').addClass('popup-notice').addClass('hidden-in-payment-methods');
                if (additionalInfoElement.find('[data-container-express-checkout]').length) {
                    additionalInfoElement.find('[data-container-express-checkout]').css('align-items', 'initial');
                }
                // pay in installments
                if (additionalInfoElement.find('[data-container-bnpl]').length) {
                    additionalInfoElement.find('[data-container-bnpl]').css('align-items', 'initial');
                }
            }
        });

        $.each(content, function (n, paymentContent) {
            if ($(paymentContent).find('.payment_module.braintree-card').length) {
                $(paymentContent).addClass('paypal-braintree-card');
                var braintreeRadio = $(paymentContent).find('.payment-option');
                payment.setPopupPaymentType(braintreeRadio);

                var formElement = $(paymentContent).find('.js-payment-option-form');

                if (!payment.isConfirmationTrigger(triggerElementName)) {
                    if (debug_js_controller) {
                        console.info('[paypal parser] Not confirmation trigger, removing payment form');
                    }
                    formElement.remove();
                } else {
                    if ('undefined' !== typeof initBraintreeCard) {
                        var additional_script_tag = '<script>\
                            $(document).ready(function(){\
                              if (\'undefined\' !== typeof initBraintreeCard) {\
                                setTimeout(initBraintreeCard, 100);\
                              }\
                            });\
                            </script>\
                        ';
                        formElement.append(additional_script_tag);
                    }
                }

            }
        });

        var express_checkout_make_visible = '<script>\
                            $(document).ready(function(){\
                              $(\'[data-module-name^=express_checkout_s]\').closest(\'.tc-main-title\').show();\
                              setTimeout(function() {$(\'[data-module-name^=express_checkout_s]\').prop(\'checked\', true);}, 100);\
                            });\
                            </script>\
                        ';
        content.append(express_checkout_make_visible);

    },

    all_hooks_content: function (content) {

    },

    form: function (element) {

        if (this.isGermanPaypalPlus()) {
            // First, set the 'form' action to be our background confirmation button click
            // On this background confirmation button, stripe action is hooked
            let form = element.find('form');
            let onSubmitAction = '$(\'#payment-confirmation button\').click();';
            form.attr('action', 'javascript:void(0);');
            form.attr('onsubmit', onSubmitAction);
        }
    },

    additionalInformation: function (element) {

        if (this.isGermanPaypalPlus()) {

            if (element.find('#ppplus').length && 'undefined' === typeof modePPP) {
                element.append('<a id="pppplus_reload" href="javascript: location.reload()"><span></span></a>');

            } else {
                if ('undefined' !== typeof countryIsoCodePPP && null === countryIsoCodePPP && $('[data-address-type=invoice] [name=country_iso_hidden]').length) {
                    countryIsoCodePPP = $('[data-address-type=invoice] [name=country_iso_hidden]').val();
                }

                var additional_script_tag = " \
                    <script> \
                    $.getScript(tcModuleBaseUrl + '/../paypal/views/js/payment_ppp.js') \
                    </script> \
                ";

                element.append(additional_script_tag);
            }
        }
    }

}