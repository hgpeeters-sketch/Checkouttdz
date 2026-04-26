/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['prestatilldrive'] = function() {
  
  if (_checkStoresCarrier() > 0) 
  {
    console.log('check carrier');
    if(parseInt($('#table_box').attr('data-creneau')) == 0){
      var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
      shippingErrorMsg.text(shippingErrorMsg.text() + ' (Click & Collect)');
      shippingErrorMsg.show();
      scrollToElement(shippingErrorMsg);
      return false;
    } else {
      return true;  
    }
  }
  else {
    return true;
  }
}

checkoutShippingParser.prestatilldrive = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-prestatilldrive.js] init_once()');
    }
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-prestatilldrive.js] delivery_option()');
    }
  },

  extra_content: function (element) {
  }

}

function _checkStoresCarrier() {
  var count_stores = 0;
    if($('input[data-id_store]').length > 0)
    {
        $('input[data-id_store]').each(function(){
            if($('.delivery-option input[type=radio]:checked').val() == $(this).val() + "," 
            || $('.delivery-option input[type=radio]:checked').val() == $(this).val())
            {
                count_stores++;
            }
        });
    }
    
    // 2.0.0
    if($('#store_selector_modal .store_list li.active').length == 1)
    {
        count_stores++;
    }
    
    return count_stores;
}