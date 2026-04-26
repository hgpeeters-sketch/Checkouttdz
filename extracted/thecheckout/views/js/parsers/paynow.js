/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.paynow = {
    after_load_callback: function() {
        $.getScript(tcModuleBaseUrl+'/../paynow/views/js/front.js')
            .done(
                function() {
                    setTimeout(function() {
                        if (typeof enableBlikSupport !== 'undefined') { enableBlikSupport(); }
                        if (typeof enablePblSupport !== 'undefined') { enablePblSupport(); }
                    }, 300);
                });
        // if ("undefined" !== typeof enableBlikSupport) {
        //     setTimeout(300, function() { enableBlikSupport(); })
        // }
    },

    form: function (element) {
        var blikPayButtonSelector = "form.paynow-blik-form .paynow-payment-option-container button.btn-primary";
        if (element.find('.paynow-blik-form').length) {
            element.find('.payment-form').attr('onsubmit', '$("'+blikPayButtonSelector+'").click(); return false;');
        }

        // Add CSS rule to hid blickPayButton
        var element = document.createElement('style'),sheet;
        document.head.appendChild(element);
        element.sheet.insertRule(blikPayButtonSelector + '{ display: none; }');
    },
}

 