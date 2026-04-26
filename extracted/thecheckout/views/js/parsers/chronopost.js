/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* Compatibility check with chronopost v6.4.0, on 15.3.2023 */

tc_confirmOrderValidations['chronopost'] = function() {
    if (
        typeof CHRONORELAIS_ID !== 'undefined' &&
        $('input[name=chronorelaisSelect]').length &&
        !$('input[name=chronorelaisSelect]:checked').length
    ) {
        var shippingErrorMsg = $('#thecheckout-shipping > .inner-area > .error-msg');
        shippingErrorMsg.append('<span class="err-chronopost-point-relais"> (choisir point relais)</span>');
        shippingErrorMsg.show();
        scrollToElement(shippingErrorMsg);
        return false;
    } else {
        return true;
    }
}

checkoutShippingParser.chronopost = {
    init_once: function (elements) {
    },

    on_ready: function() {
        setTimeout(function(){
            // Return if variable are undefined
            if (typeof CHRONORELAIS_AMBIENT_ID === 'undefined' && typeof CHRONORELAIS_ID === 'undefined' &&
                typeof RELAISEUROPE_ID === 'undefined' && typeof RELAISDOM_ID === 'undefined' &&
                typeof TOSHOPDIRECT_ID === 'undefined' && typeof TOSHOPDIRECT_EUROPE_ID === 'undefined') {
                return false;
            }
            var body = $("body");

            body.on("click", ".gm-style img", function (event) {
                event.preventDefault();

                var deliveryStep = $("#checkout-delivery-step");
                if (!deliveryStep.hasClass("-current")) {
                    deliveryStep.addClass("-current");
                }

                if (!deliveryStep.hasClass("js-current-step")) {
                    deliveryStep.addClass("js-current-step");
                }
            });

            // Clean container on load
            cleanContainers();
            toggleRelaisMap(cust_address_clean, cust_codePostal, cust_city);

            body.on('click', '#js-delivery .custom-radio > input[type=radio], input[name=id_carrier]', function (e) {
                cleanContainers();
                toggleRelaisMap($("#cust_address_clean").val(), $("#cust_codepostal").val(), $("#cust_city").val(), e);

                var value = parseInt($(this).val());
                if (value === parseInt(CHRONORELAIS_AMBIENT_ID) || value === parseInt(CHRONORELAIS_ID) ||
                    value === parseInt(RELAISEUROPE_ID) || value === parseInt(RELAISDOM_ID) ||
                    value === parseInt(TOSHOPDIRECT_ID) || value === parseInt(TOSHOPDIRECT_EUROPE_ID)) {
                    if ($('#chronorelais_container').length) {
                        $('html, body').animate({
                            scrollTop: $('#chronorelais_container').offset().top
                        }, 500);
                    }
                }
            });

            // Listener for postcode change
            body.on('click', '#change_postcode', postcodeChangeEvent);

            body.on('keypress keydown keyup', '#relais_postcode', function (e) {
                if (e.which === 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    postcodeChangeEvent();
                    return false;
                }
            });

            // Listener for BT select in popup
            body.on("click", ".btselect", function (e) {
                btSelect.call(e.target, e);
            });

            // Listener for cart navigation to next step
            body.on('click', 'input[name=processCarrier]', function () {
                if ($('input[name=id_carrier]:checked').val() == carrierID && !$("input[name=chronorelaisSelect]:checked").val()) {
                    alert($("#errormessage").val());
                    $("html, body").animate({scrollTop: $('#relais_txt_cont').offset().top}, 500);
                    return false;
                }
            });

        },300)
    },

    delivery_option: function (element) {
        element.append(' \
        <div id="checkout-delivery-step" class="-current hidden"></div> \
        <script> \
          $(document).ready( \
             checkoutShippingParser.chronopost.on_ready \
          ); \
        </script> \
    ');

    },

    extra_content: function (element) {
    }

}