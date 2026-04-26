/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* Tested with ps_checkout v2.21.0 (12.01.2023) */
window.tc_ps_checkout = {
    init: false
};

window.ps_checkout = {
    selectors: {
        CONDITIONS_CHECKBOXES: '[id="conditions_to_approve[terms-and-conditions]"]',
        //BASE_PAYMENT_CONFIRMATION: '.popup-payment-button #payment-confirmation button'
       // BASE_PAYMENT_CONFIRMATION: '#tc-payment-confirmation button'
    },
    events: new EventTarget(),
}

window.ps_checkout.events.addEventListener('init', ({detail}) => {
    window.tc_ps_checkout.init = true;
    // === window.ps_checkout
    const {ps_checkout} = detail;
    // console.log('ps_checkout init()', ps_checkout);
});

// We enable all eligible payment options
window.ps_checkout.events.addEventListener('payment-option-active', function (event) {
    // console.log('= payment-option-active', event.detail.HTMLElementContainer)
    var HTMLElementContainer = event.detail.HTMLElementContainer;
    var myHTMLElementContainer = HTMLElementContainer.parentElement;

    var HTMLBinaryContainer = event.detail.HTMLElementBinary
        .parentElement.parentElement;

    // We remove the disabled style for the binaries on payment options
    // The default payment tunnel does this but this is not the case on your module
    HTMLBinaryContainer.classList.remove('disabled');
    myHTMLElementContainer.style.display = '';

    // var paymentOptionRadio = HTMLElementContainer.querySelector('[name=payment-option]');
    // if (typeof paymentOptionRadio !== 'undefined' && paymentOptionRadio) {
    //     var data_module_name = paymentOptionRadio.getAttribute('data-module-name');
    //     console.log('data_module_name = ', data_module_name)
    //     if ($('.js-payment-'+data_module_name).length) {
    //         var confirmation_container = $('.popup-payment-button #payment-confirmation');
    //         confirmation_container.html('');
    //         $('.js-payment-'+data_module_name).appendTo(confirmation_container);
    //     }
    // }

    // var confirmation_container = $('.popup-payment-button #payment-confirmation');
    // confirmation_container.html('');
    // //var data_mod_name = $('#' + option).attr('data-module-name');
    // $('.js-payment-binary').appendTo(confirmation_container);
});

checkoutPaymentParser.ps_checkout = {

    after_load_callback: function() {
        // console.info('after load callback');
        if (window.tc_ps_checkout.init) {
            // console.log('[-] rendering ps_checkout')
            window.ps_checkout.renderCheckout()
        }
    },

    init_once: function (content, triggerElementName) {
        function ps_checkout_init() {
            // We hide all payment options because we don't know if they are eligible; eligible ones will be enabled
            // in 'payment-option-active' event listener
            content.each(function(_, paymentOption) {
                paymentOption.style.display = 'none'
            });
        }

        // Disable weird 'click' emitted by _dev\js\front\src\components\1_7\payment-options.component.js in renderPaymentOptionItems() method
        $('body').off('click.ps_checkout').on('click.ps_checkout', '[data-module-name=ps_checkout-paypal]', (e) => {
            let stackTrace = JSON.stringify(Error().stack);
            if (stackTrace && stackTrace.match('modules/ps_checkout/views/js/front.js')) {
                console.log('triggered by ps_checkout paypal fundingSource HTMLElement.click(), skip selected payment toggle');
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        });

        ps_checkout_init();
    },

    container: function (element) {

        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="ps_checkout popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);

        // disable this as binary method - we will keep our confirmation button and call popup display by hooking
        // to .submit event of form
        // element.find('input.binary').removeClass('binary');
    },

    all_hooks_content: function (content) {
        // empty
    },

    form: function (element, triggerElementName) {
        if (!payment.isConfirmationTrigger(triggerElementName)) {
            if (debug_js_controller) {
                console.info('[ps_checkout parser] Not confirmation trigger, removing payment form');
            }
            element.remove();
        }
    },

    additionalInformation: function (element) {
        // empty
    }

}