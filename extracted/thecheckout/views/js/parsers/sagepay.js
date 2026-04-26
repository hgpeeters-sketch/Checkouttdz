/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.sagepay = {
  all_hooks_content: function (content) {

  },

  additionalInformation: function (element) {
    var additional_script_tag = '<script> \
      if ($("#sgp_iframe").length) {\
        $("#sgp_iframe").css("height", 442 + sgp_card_types_count * 48 + "px");\
      }\
      </script>\
    ';

    element.append(additional_script_tag);
  }
}


