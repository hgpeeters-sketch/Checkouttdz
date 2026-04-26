/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

 /**************** IMPORTANT NOTICE *****************/
 /* Tested with Klarnapayments v2.1.11 (16.9.2022)
    Please modify:

    1/ in public function getAvailablePaymentCategories($response), add before return statement: 

      usort($klarna_payment_categories, function($a, $b) {
          return $a['identifier'] < $b['identifier'];
      });

    2/ in function hookPaymentOptions($params), add before line $payment_options = $this->setIframeOption($available_payment_categories); this:

      usort($available_payment_categories, function($a, $b) {
          return $a['identifier'] < $b['identifier'];
      }); 
 */

checkoutPaymentParser.klarnapaymentsofficial = {

  all_hooks_content: function (content) {
      $(content).find('input[data-module-name^=klarnapayments_]').each(function() { 
        var klarna_payment_module_name = $(this).attr('data-module-name');
        var klarna_payment_id = $(this).attr('id');
        if (klarna_payment_module_name.length > 10) {
          var matches = klarna_payment_module_name.match(/klarnapayments_(.*)_module/);
          if ('undefined' !== matches[1]) {
            $(content).find('#pay-with-'+klarna_payment_id+'-form form').attr('onsubmit', 'setTimeout(function() {setupKlarnaAuthCall("'+matches[1]+'");},2000); return false;');
          }
        }
      });
  },

  after_load_callback: function() {
    $.getScript(tcModuleBaseUrl + '/../klarnapaymentsofficial/views/js/klarna.js');
  },

  additionalInformation: function (element) {

    // By default, Klarna in document.ready calls methods to attach event handlers on payment method change; so we need to call this attachment manually
    //element.find('script').remove();
    // Also, we need to generate 'click' event, so that Klarna expands on payment list reload
    var additional_script_tag = "<script> \
      if ('undefined' === typeof klarna_options) { \
          var klarna_options = $('.klarna-container'); \
      } \
      for (let i = 0; i < klarna_options.length; i++) { \
          let payment_category = klarna_options[i].id.substring(26, klarna_options[i].id.length); \
          $('input[data-module-name^=klarnapayments_' + payment_category + '_module]').click(function() { \
              initiateKlarnaWidget(kp_client_token, '#' + klarna_options[i].id, payment_category); \
          }); \
      } \
        $(document).ready(function() { \
          setTimeout(function() {$('input[data-module-name^=klarnapayments]:checked').click();},500); \
        }); \
        </script> \
      ";
    element.append(additional_script_tag);
  }

}


