/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.amazonpay = {

  container: function (element) {
    // since amazonpay v4.0.2 (17.5.2021), popup mode no longer works
    // var removeSubmitBtn = true;
    // payment.setPopupPaymentType(element, removeSubmitBtn);
    console.info('[amazonpay] remove binary option, redirect');
    element.find('input[name=payment-option]').removeClass('binary');
  },

  additionalInformation: function (element, triggerElementName) {
    // 19.5.2020: from now on, payment button will be hidden with CSS and shown in popup only
    // if (!payment.isConfirmationTrigger(triggerElementName)) {
    //   if (debug_js_controller) {
    //     console.info('[amazonpay] Not confirmation trigger, removing payment\'s additionalInformation div');
    //   }
    //   element.remove();
    // }
  }

} 