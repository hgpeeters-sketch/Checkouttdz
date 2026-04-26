/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.cashondeliveryplus = {
  all_hooks_content: function (content) {

  },

  additionalInformation: function (element) { 
    var paymentOption = element.attr('id').match(/payment-option-\d+/)[0];
    var feeEl = element.find('span.price');
    if ('undefined' !== typeof feeEl && feeEl) {
    	var fee = parseFloat(feeEl.text().replace(/[^\d,]/g,'').replace(',','.'));
    	element.last().append('<div class="payment-option-fee hidden" id="'+paymentOption+'-fee">'+fee+'</div>');
    }
  }
}


