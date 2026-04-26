/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.codfee = {
    all_hooks_content: function (content) {

    },

    form: function (element) {
        var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];
        var fee = element.find('[name^=codfee_fee]').val();
        if ('undefined' !== typeof fee) {
            fee = fee.replace(/[^0-9.,-]+/g, "").replace(/\.*$/,""); // 2nd replacement due to Arabic currency (containing dots)
        }
        element.last().append('<div class="payment-option-fee hidden" id="' + paymentOption + '-fee">' + fee + '</div>');
    }
}


