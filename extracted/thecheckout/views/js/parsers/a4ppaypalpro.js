/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.a4ppaypalpro = {
  all_hooks_content: function (content) {
   
  },

  form: function (element) {
    element.find('script').remove();

    element.find('.payment-form').attr('action', 'javascript: $("form[name=a4ppaypalpro_form]").submit()');

    // After content of payment methods is being refreshed, re-attach postfinancecw's handlers
    var additional_script_tag = "<script> \
        $.getScript(tcModuleBaseUrl+'/../a4ppaypalpro/views/js/a4ppaypalpro.js');\
        </script> \
      ";
    element.append(additional_script_tag);
  },

  additionalInformation: function (element) {

  }

}

 