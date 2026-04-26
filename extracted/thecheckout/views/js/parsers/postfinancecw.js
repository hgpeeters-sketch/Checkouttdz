/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.postfinancecw_all = {
  all_hooks_content: function (content) {
   
  },

  form: function (element) {
    element.find('script').remove();

    // After content of payment methods is being refreshed, re-attach postfinancecw's handlers
    var additional_script_tag = "<script> \
        $.getScript(tcModuleBaseUrl+'/../postfinancecw/js/frontend.js');\
        </script> \
      ";
    element.append(additional_script_tag);
  },

  additionalInformation: function (element) {

  }

}

// One call even for multiple postfinancecard payment modules is OK - events are attached for all of them at once
checkoutPaymentParser.postfinancecw_postfinancecard = checkoutPaymentParser.postfinancecw_all;

