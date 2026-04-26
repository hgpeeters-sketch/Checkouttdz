/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.mollie = {

    form: function (element) {
        var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];

        var potentialFeeEl = element.find('[name=payment-fee-price]');
        if (potentialFeeEl.length == 1) {
            var fee = payment.parsePrice(potentialFeeEl.val());
            var container = element.parent('.tc-main-title').find('.payment-option');
            container.last().append('<div class="payment-option-fee hidden" id="' + paymentOption + '-fee">' + fee + '</div>');

            var potentialFeeLabelEl = element.find('[name=payment-fee-price-display]');
            if (potentialFeeLabelEl.length == 1) {
                container.find('label span.h6').append(' <span class="fee">(' + potentialFeeLabelEl.val() + ')</span>');
            }
        }
    },

}


