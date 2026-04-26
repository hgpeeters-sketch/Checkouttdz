/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.omniva = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[omniva] init_once()');
    }

    var additional_script_tag = "<script> \
        if ('function' === typeof initOmniva) {\
            initOmniva(); \
            if (!$('[name=omniva_terminal]').val() && $('[name=omniva_city]').length) { $('[name=omniva_city]').val(''); } \
            $('[name=omniva_city]').on('change', function() { omnivaSelectedCity = $('[name=omniva_city]').val(); }); \
            $('[name=omniva_terminal]').on('change', function() { omnivaSelectedTerminalId = $('[name=omniva_terminal]').val(); }); \
        }\
        </script> \
      ";
    elements.last().append(additional_script_tag);

  }
}