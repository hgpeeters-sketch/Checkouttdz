/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['zasilkovna'] = function() { 
  if (
    $('#packetery-widget select[name=name]').is(':visible') && 
    !$('#packetery-widget select[name=name]').val()
    ) {
    var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
    shippingErrorMsg.show();
    scrollToElement(shippingErrorMsg);
    return false; 
  } else {
    return true;
  }
}

checkoutShippingParser.zasilkovna = {
  init_once: function (elements) {
    
  },

  delivery_option: function (element) {
    
  },

  extra_content: function (element) {
    element.after("<script>\
      $(document).ready(function(){\
        if ('undefined' !== typeof initializePacketaWidget &&  $(\".zas-box\").length)\
           initializePacketaWidget();\
        if ('undefined' !== typeof tools){\
          tools.fixextracontent();\
          if ('undefined' !== typeof tools && 'undefined' !== typeof tools.readAjaxFields) {\
              tools.readAjaxFields();\
          }\
          var zasilkovnaEl = $('.carrier-extra-content.zasilkovna');\
          if (zasilkovnaEl.length) {\
            var extra = zasilkovnaEl.parent();\
            if ('undefined' !== typeof packetery && 'undefined' !== typeof packetery.widgetGetCities) {\
              packetery.widgetGetCities(extra);\
            }\
          }\
        }\
      });\
      </script>");
  }

}
