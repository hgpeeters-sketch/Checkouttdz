/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['prestatillhomedelivery'] = function() {
	
	if (_checkIdEC())
	{
		console.log('check hd carrier');
		if(parseInt($('#hd_box').attr('data-creneau')) == 0){
			var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
			shippingErrorMsg.text(shippingErrorMsg.text() + ' (Choose a slot)');
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

checkoutShippingParser.prestatillhomedelivery = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-prestatillhomedelivery.js] init_once()');
    }
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-prestatillhomedelivery.js] delivery_option()');
    }
  },

  extra_content: function (element) {
  }

}

function _checkIdEC() {
        if($('.delivery-option input[type=radio]:checked').length > 0)
        {
            var id_selected_carrier = $('.delivery-option input[type=radio]:checked').val();
            id_selected_carrier = id_selected_carrier.replace(/,/g,"");
            
            if($('body').find('#hd_id_carrier_'+id_selected_carrier).length > 0)
                return true;
                
            return false;
        }
    }