/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['kldeliverynppro'] = function () {
    if (
        $('.carrier-extra-content.kldeliverynppro').is(':visible') &&
        "" == $("#js-warehouses").val()
    ) {
        var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
        shippingErrorMsg.text(shippingErrorMsg.text() + ' (NovaPoshta)');
        shippingErrorMsg.show();
        scrollToElement(shippingErrorMsg);
        return false;
    } else {
        return true;
    }
}

checkoutShippingParser.kldeliverynppro = {
    init_once: function (elements) {
    },

    saveSelectedWarehouse: function () {
        var city = $('#js-cities option:selected').text();
        var warehouse = $('#js-warehouses option:selected').text();
        $.ajax({
          url: $('#saveCartUrl').data('value'),
          type: "post",
          dataType: "json",
          data: {
              "city-js": city,
              "warehouse-js":  warehouse,
          }
        }); 

    },

    on_ready: function() {
        setTimeout(function(){
            if ($("#js-warehouses").length && $("[name=city-js]").length) {
                if ("" == $("#js-warehouses").val()){
                    getWarehouses($("[name=city-js]"));
                } else {
                    checkoutShippingParser.kldeliverynppro.saveSelectedWarehouse();
                }
            }
            $(".kldeliverynppro").on("change", "#js-warehouses", checkoutShippingParser.kldeliverynppro.saveSelectedWarehouse);
            $("#tc-payment-confirmation").off("click.novaposhta").on("click.novaposhta", "#confirm_order", checkoutShippingParser.kldeliverynppro.saveSelectedWarehouse);
        },300)
    },

    delivery_option: function (element) {
        // Initial update of warehouse combobox
        // Rest of the code (warehouse change handler, calling saveCart, is in Custom CSS block

        element.append(' \
        <script> \
          $(document).ready( \
             checkoutShippingParser.kldeliverynppro.on_ready \
          ); \
        </script> \
    ');

    },

    extra_content: function (element) {
    }

}