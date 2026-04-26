/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

// Since payplug v3.6.3, update:
// - These 2 files (same update in both):
//   1. modules/payplug/classes/PayPlugClass.php
//   2. modules/payplug/classes/PaymentClass.php
// - original line: $id_customer = (isset($cart->id_customer)) ? $cart->id_customer : $cart['cart']->id_customer;
// - replace with: 	$id_customer = (isset($cart->id_customer)) ? $cart->id_customer : 0;

// (old) Since payplug v3.1.3, update instead:
// - file: modules/payplug/payplug.php
// - original line: $id_customer = (isset($cart->id_customer)) ? $cart->id_customer : $cart['cart']->id_customer;
// - replace with: 	$id_customer = (isset($cart->id_customer)) ? $cart->id_customer : 0;

// (old) 20.5.2019: For the moment, we won't be using any parsing, we'll just override form submit routine
// IMPORTANT NOTE: It's necessary to update modules/payplug/payplug.php, in method getEmbeddedPaymentOption,
// remove lightbox condition, and to init payment always, like this:
// if (true || (int)Tools::getValue('lightbox') == 1) {

$('#thecheckout-payment').on('submit', '.payplug .payment-form', function () {

  var url = $('#payplug_form_js').data('payment-url');
  // Only for embedd mode, otherwise, let the default action
  if ('undefined' !== typeof Payplug)
  {
  	Payplug.showPayment(url);
  	return false;
  }
});

checkoutPaymentParser.payplug = {}
