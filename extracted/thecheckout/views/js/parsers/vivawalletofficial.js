/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

// (!) important, update also vivawalletofficial\views\js\vivawallet-front-checkout.js
// 1. Remove const and let declarations from properties
// 2. Change .text() to .html() on 3 places (submitInitialText = , disableSubmit(), enableSubmit())
// 3. Add validation in if (areInputsValid() === false) { ..., like: $('form#vw-charge-token .form-control').blur(); // show errors
// 4. Replace .click handler with .off.on('click'): 
//     from: $prestashopSubmit.click(async event => {
//     to:   $prestashopSubmit.off('click').on('click', async event => {

checkoutPaymentParser.vivawalletofficial = {

    after_load_callback: function() {
        if ("undefined" !== vivawallet_amount) {
            $.getScript(tcModuleBaseUrl + '/../vivawalletofficial/views/js/vivawallet-front-checkout.js')
        }
    },

    container: function(element) {

        // Create additional information block, informing user that payment will be processed after confirmation
        var paymentOptionId = element.attr('id').match(/payment-option-\d+/);

        if (paymentOptionId && 'undefined' !== typeof paymentOptionId[0]) {
            paymentOptionId = paymentOptionId[0];
            element.after('<div id="'+paymentOptionId+'-additional-information" class="vivawalletofficial popup-notice js-additional-information definition-list additional-information ps-hidden" style="display: none;"><section><p>'+i18_popupPaymentNotice+'</p></section></div>')
        }

        payment.setPopupPaymentType(element);
    }

}

