/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

 /* (!)
  postfinancecheckout v1.2.3 - by Customweb
  in modules/postfinancecheckout/views/js/frontend/checkout.js, change (!) on 2 places: 
  
  if (current_method.data("module-name") == "postfinancecheckout") {
  
  to

  if (current_method.data("module-name").startsWith("postfinancecheckout")) {

 */

checkoutPaymentParser.postfinancecheckout = {
  all_hooks_content: function (content) {
    var element = document.createElement('style'),sheet;
    document.head.appendChild(element);
    element.sheet.insertRule('.postfinancecheckout-payment-form .postfinancecheckout-loader { display: none; }');
    element.sheet.insertRule(':not(.popup-payment-form) .hide-in-payment-options { display: none!important; }');
  },

  after_load_callback: function() {
    if (typeof postFinanceCheckoutCheckoutUrl !== 'undefined') {
        $.getScript(tcModuleBaseUrl+'/../postfinancecheckout/views/js/frontend/checkout.js')
        .done(
          function() { 
            setTimeout(function() { $('input[name=payment-option]:checked').click(); }, 500); 
          });
    }
  },

  container: function (element) {
    // Only for credit card payment option: 
    if (element.find('img[src*="credit-debit-card.svg"]').length) {
      payment.setPopupPaymentType(element); 
      element.closest('.tc-main-title').find('.js-additional-information').addClass('hide-in-payment-options');
    }
    // var inputEl = element.find('input'); 
    // inputEl.attr('data-module-name', inputEl.attr('data-module-name').replace(/-\d+$/,''));
  },

  waitForInit: function (formEl) {
    setTimeout(() => {
      if ($(formEl).find(".postfinancecheckout-loader").length === 0) {
        setTimeout(() => {
          $(formEl).attr("onsubmit", "")
          $(formEl).submit();  
        }, 600)
      } else {
        $(formEl).submit();  
      }
    }, 200); 

    return false;
  },

  form: function (element) {
    element.find("form").attr('onsubmit', 'return checkoutPaymentParser.postfinancecheckout.waitForInit(this)');
  },

  additionalInformation: function (element) {

  }

}
