/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.saferpaycw_creditcard = {
  all_hooks_content: function (content) {
   
  },

  form: function (element) {
    element.find('script').remove();

    // After content of payment methods is being refreshed, re-attach saferpaycw's handlers
    var additional_script_tag = "<script> \
        $.getScript(tcModuleBaseUrl+'/../saferpaycw/js/frontend.js');\
        </script> \
      ";
    element.append(additional_script_tag);
  },

  additionalInformation: function (element) {

  }

}


