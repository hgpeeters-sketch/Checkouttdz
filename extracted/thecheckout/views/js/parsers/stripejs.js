/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.stripejs_removed = {

    initiatePayment: function() {
        if (typeof StripePubKey !=='undefined') {
            var stripe = Stripe(StripePubKey,{locale: lang_iso_code});
            var stripe_pm = document.getElementById('selected_pm').value;
            var quickPay = ((stripe_pm!=1) ? 1 : 0);

            $('input[name=payment-option]:checked').focus();
            $('#stripe-ajax-loader,#stripe-payment-form').toggle();
            $('#payment-confirmation button[type=submit]').prop("disabled", true);
            var toggle_selector = '#stripe-ajax-loader,#stripe-payment-form';
            var error_selector = '#card-errors';

            handlePI('checkout', function(res_status){
                if(res_status.code==1) {
                    $('#checkout-success').show();
                    stripe.redirectToCheckout({
                        sessionId: res_status.sess_id
                    }).then(function (result) {
                        $('#checkout-success').hide();
                        var err_msg = showStripePayError(toggle_selector, 0, result.error.message, error_selector);
                        alert(result.error.message);
                    });
                }
            });
        }
    },

    after_load_callback: function() {
        // $.getScript(tcModuleBaseUrl + '/../stripejs/views/js/stripe-prestashop.js');

    },

    all_hooks_content: function (content) {

    },

    container: function (element) {

    },

    form: function (element) {
        let form = element.find('form');
        let onSubmitAction = 'javascript:checkoutPaymentParser.stripejs.initiatePayment()';
        form.attr('action', 'javascript:void(0);');
        form.attr('onsubmit', onSubmitAction);
    }
}