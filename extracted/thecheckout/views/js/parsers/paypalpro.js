/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.paypalpro = {

    after_load_callback: function() {
        // This is not necessary, it's enough to call the script once in header hook
        // console.log('after_load_callback');
        // if (typeof ppp_payment_page !== 'undefined' && $('[name=ppp_form]').length) {
        //     // $.getScript(tcModuleBaseUrl+'/../paypalpro/views/js/front/paypalpro.js')
        // }
    },

    form: function (element) {
        element.find('script').remove();

        element.find('.payment-form').attr('onsubmit', '$("#paypalpro-dummy-payment-confirmation").click(); return false;');

        // After content of payment methods is being refreshed, re-attach postfinancecw's handlers
        var additional_script_tag = "<div id='payment-confirmation' style='display: none;'> \
            <button id='paypalpro-dummy-payment-confirmation'></button> \
            </div> \
          ";
        element.append(additional_script_tag);
    },

}