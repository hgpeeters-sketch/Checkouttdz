/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.a4pauthorizenet = {

  after_load_callback: function() {
    $.getScript(tcModuleBaseUrl + '/../a4pauthorizenet/views/js/a4pauthorizenet.js');
  },

  form: function (element) {
    if ($('#a4pauthorizenet_form').length) {
        element.find('.payment-form').attr('action', 'javascript: $("#a4pauthorizenet_form").submit()');
    }
    // Add CSS rule
    var element = document.createElement('style'),sheet;
    document.head.appendChild(element);
    element.sheet.insertRule('#checkout [data-payment-module=a4pauthorizenet] .additional-information { margin: 0; }');
    element.sheet.insertRule('div#a4pauthorizenet_formblock { padding: 0; }');
    element.sheet.insertRule('div#a4pauthorizenet_formblock .form-container { border: none; }');
  }
}


