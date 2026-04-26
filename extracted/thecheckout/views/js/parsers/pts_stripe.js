/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


checkoutPaymentParser.pts_stripe = {

    all_hooks_content: function (content) {

    },

    on_ready: function() {
        if ("undefined" !== typeof AppPTSS && !$('#stripe-card.StripeElement').length) {
            AppPTSS.init();
        }
    },

    container: function (element) {

        //payment.setPopupPaymentType(element);
        // Add logos to payment method
        // Img path:
        var stripe_base_url = '';
        if ('undefined' !== typeof prestashop && 'undefined' !== prestashop.urls && 'undefined' !== prestashop.urls.base_url) {
            stripe_base_url = prestashop.urls.base_url;
        }

        element.find('label').append('<img style="max-height: 45px;position: absolute;margin-top: -10px;" src="' + stripe_base_url + '/modules/pts_stripe/views/img/pts_stripe.jpg">');

        // Init pts_stripe
         var additional_script_tag = " \
                <script> \
                $(document).ready( \
                    checkoutPaymentParser.pts_stripe.on_ready \
                ); \
                </script> \
            ";


        element.append(additional_script_tag); 
    
    },


    form: function (element) {

        // First, set the 'form' action to be our background confirmation button click
        // On this background confirmation button, stripe action is hooked
        let form = element.find('form');
        let onSubmitAction = 'javascript:AppPTSS.processPayment();';
        form.attr('action', 'javascript:void(0);');
        form.attr('onsubmit', onSubmitAction);

    }

}


