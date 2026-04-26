/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['furgonetka'] = function() { 

  if ('undefined' !== typeof furgonetkaCheckMapAjax) {
    var id_delivery = parseInt($('.delivery-options-list input:checked').val());
        if ($('#furgonetka-set-point').is(':visible') && !$('#furgonetka-machine-' + id_delivery).length){
          var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
          shippingErrorMsg.text(shippingErrorMsg.text() + ' (Wybierz punkt odbioru)');
          shippingErrorMsg.show();
          scrollToElement(shippingErrorMsg); 
          return false;
        }
  }

  return true;
}


checkoutShippingParser.furgonetka = {
  init_once: function (elements) {
    
  },

  delivery_option: function (element) {
    
  },

  extra_content: function (element) {
   
  }

}
