/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['packetery'] = function() { 
  if (
    $('#packetery-widget').is(':visible') &&
    "" == $('#packeta-branch-id').val()
    ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false; 
  } else {
    return true;
  }
}

checkoutShippingParser.packetery = {
  init_once: function (elements) {
    
  },

  delivery_option: function (element) {
    
  },

  extra_content: function (element) {
    element.after("<script>\
      var country = 'cz,sk'; /* Default countries */\
      $(document).ready(function(){\
        if ('undefined' !== typeof initializePacketaWidget &&  $(\".zas-box\").length)\
           initializePacketaWidget();\
        if ('undefined' !== typeof tools){\
          tools.fixextracontent(country);\
          if ('undefined' !== typeof tools && 'undefined' !== typeof tools.readAjaxFields) {\
              tools.readAjaxFields();\
          }\
          var packeteryEl = $('.carrier-extra-content.packetery');\
          if (packeteryEl.length) {\
            var extra = packeteryEl.parent();\
            if ('undefined' !== typeof packetery && 'undefined' !== typeof packetery.widgetGetCities) {\
              packetery.widgetGetCities(extra);\
            }\
          }\
        }\
      });\
      </script>");
  }

}
