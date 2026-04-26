/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


checkoutPaymentParser.zipmoneypayment = {

    form: function (element) {
        let form = element.find('form');
        form.attr('action', 'javascript:checkoutPaymentParser.zipmoneypayment.confirm()');
    },

    additionalInformation: function (element) {
        var zip_pay_button = '<button id="zip-pay" style="display: none" />';
        element.append(zip_pay_button); 
    },

    confirm: function () {
        Zip.Checkout.attachButton('#zip-pay', {
            redirect: true,
            checkoutUri: "index.php?fc=module&module=zipmoneypayment&controller=payment",
            redirectUri: "index.php?fc=module&module=zipmoneypayment&controller=validation"
        });
        $("#zip-pay").click();
    }

}


