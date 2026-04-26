/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['sendcloud'] = function() {
  if (
      /*$('#mondialrelay_widget').is(':visible')*/
      $('.delivery-option.sendcloud input[type=radio]').is(':checked') &&
      !$('.sendcloudshipping-point-details').is(':visible') &&
      !$('.sendcloud-spp__selection-details').is(':visible')
  ) {
    $('.err-sendcloud-point').remove();
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.append('<span class="err-sendcloud-point"> (Sendcloud pickup point)</span>');
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false;
  } else {
    return true;
  }
}

var sendcloud_tc_initialized = false;

checkoutShippingParser.sendcloud = {
  init_once: function (elements) {

  },

  delivery_option: function (element) {

  },

  extra_content: function (element) {
    if (!sendcloud_tc_initialized && 'undefined' !== typeof sendcloud_script && sendcloud_script != '') {
      $.getScript(sendcloud_script);
      sendcloud_tc_initialized = true;
    }
  }

}
