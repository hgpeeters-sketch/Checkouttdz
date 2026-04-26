/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.atos = {
  all_hooks_content: function (content) {
    // Remove 'accept TOS warning'
    content.find('.js-payment-binary .alert.alert-warning.accept-cgv').remove();
    content.find('.js-payment-binary.js-payment-atos.disabled').removeClass('disabled');
  },

  form: function (element) {

  }

}
