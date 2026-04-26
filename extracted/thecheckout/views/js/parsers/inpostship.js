/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['inpostship'] = function () {
    if (
        $('.delivery-option.inpostship ~ .tr-inpost-box').length &&
        "" == $('.inpostship-main.i-go .point-info').text()
    ) {
        var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
        shippingErrorMsg.text(shippingErrorMsg.text() + ' (Paczkomaty 24)');
        shippingErrorMsg.show();
        scrollToElement(shippingErrorMsg);
        return false;
    } else {
        return true;
    }
}

checkoutShippingParser.inpostship = {
    init_once: function (elements) {
    },

    on_ready: function() {
        setTimeout(function(){
            if ('function' == typeof initInpost && 'function' == typeof inpostBindRadio) {
                $('.delivery-option input').on('click', function(e) {
                    inpostBindRadio($(this), e);
                });
                initInpost($('.delivery-option input' + ":checked"));   
                $('.delivery-options-list button').on('click', function(){
                    var val = $('.tr-inpost-box .inpostship-main .inpost-point').val();
                    if (val == '' && selectedPointInfo == '') {
                        $('#inpostshipmodal').modal();
                        $('#cgv').parent().removeClass('checked');
                        return false;
                    }
                });
            }

            $('#inpostshipmodal .modal-footer button').on('click', function() {
                $('#inpostshipmodal').modal('hide');
            });

            $('#inpostshipmodal .modal-header button').on('click', function() {
                $('#inpostshipmodal').modal('hide');
            });
        },300)
    },

    delivery_option: function (element) {
        // Initial update of warehouse combobox
        // Rest of the code (warehouse change handler, calling saveCart, is in Custom CSS block

        element.append(' \
        <script> \
          $(document).ready( \
             checkoutShippingParser.inpostship.on_ready \
          ); \
        </script> \
    ');

    },

    extra_content: function (element) {
    }

}