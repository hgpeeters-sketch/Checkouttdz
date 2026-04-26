/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.checkoutcom = {

    container: function(element) {
        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="checkoutcom popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);
    },

    popup_onopen_callback: function() {

        $.when(
            $.getScript( 'https://cdn.checkout.com/js/framesv2.min.js' ),
            $.getScript( tcModuleBaseUrl+'/../checkoutcom/views/js/card.js' ),
            $.Deferred(function( deferred ){
                $( deferred.resolve );
            })
        ).done(function(){

            // wait a little so that markup (checkoutcom-multi-frame) initiates
            setTimeout( function() {
                if (typeof CheckoutcomFramesPay === 'function')
                    CheckoutcomFramesPay(document.getElementById('checkoutcom-card-form'));
            }, 100)

        });

        // $('#payment-confirmation .btn').off('click.confirm_popup').on('click.confirm_popup', () => { $('.popup-payment-form > .js-payment-option-form form').submit(); })
    },

    after_load_callback: function() {

    },

    form: function (element) {
        // Add CSS rule
        var element = document.createElement('style'),sheet;
        document.head.appendChild(element);
        element.sheet.insertRule('form#checkoutcom-card-form .cvvVerification { display: none; }');
    },

}

