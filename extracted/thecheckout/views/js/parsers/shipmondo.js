/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */


tc_confirmOrderValidations['shipmondo'] = function() {
    if (
        $('#hidden_chosen_shop').length > 0 &&
        $('.shipmondo-shipping-field-wrap:visible').length &&
        $('input[name=shipmondo]').length &&
        '' === $('input[name=shipmondo]').val()
    ) {
        var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
        shippingErrorMsg.append('<span class="err-shipmondo"> (vælg PakkeShop)</span>');
        shippingErrorMsg.show();
        scrollToElement(shippingErrorMsg);
        return false;
    } else {
        return true;
    }
}

checkoutShippingParser.shipmondo = {
    after_load_callback: function (deliveryOptionIds) {
        $('.delivery-option input:checked').trigger('click');
    }
}