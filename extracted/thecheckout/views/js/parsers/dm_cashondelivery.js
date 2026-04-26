/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.dm_cashondelivery = {
    all_hooks_content: function (content) { 

    },

	container: function(element) {
        var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];
		var feeHtml = element.find('label span').html();
		var fee = payment.parsePrice(feeHtml);
		if (!isNaN(fee)) {
	  		element.last().append('<div class="payment-option-fee hidden" id="'+paymentOption+'-fee">'+fee+'</div>'); 
		}
	},

    additionalInformation: function (element) {
        var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];
        var feeHtml = element.find('section p').html();
        var fee = payment.parsePrice(feeHtml);
        if (!isNaN(fee)) {
        	element.last().append('<div class="payment-option-fee hidden" id="' + paymentOption + '-fee">' + fee + '</div>');
        }
    }
}


 