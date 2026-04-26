/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

tc_confirmOrderValidations['gmparcellocker'] = function () {
    if (
        $('.chosen-parcel:visible').length &&
        "---" == $('.chosen-parcel:visible').html()
    ) {
        var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
        shippingErrorMsg.text(shippingErrorMsg.text().replace(' (InPost)', '') + ' (InPost)');
        shippingErrorMsg.show();
        scrollToElement(shippingErrorMsg);
        return false;
    } else {
        return true;
    }
}

// checkoutShippingParser.gmparcellocker = {
//
//     after_load_callback: function() {
//         console.info('[gmparcellocker parser] after load callback');
//         if (typeof window.easyPack !== 'undefined' && typeof window.easyPack.dropdownWidget !== 'undefined') {
//             window.easyPack.dropdownWidget('easypack-widget', function (point) {
//                 var pointData = point.name + '| ' + point.address.line1 + '| ' + point.address.line2;
//                 $.ajax({
//                     url: gmParcelLockerAjaxUrl,
//                     type: 'POST',
//                     crossDomain: true,
//                     data: {cartId: gmCartId, pointData: pointData},
//                     async: true,
//                     dataType: "json",
//                     headers: {"cache-control": "no-cache"},
//                     success: function (data) {
//                         //console.log(data);
//                         if (data.msg == 'OK') {
//                             $('.chosen-parcel').html(pointData.split('|').join(','));
//                         }
//                     },
//                     error: function (jqXHR, textStatus) {
//                         console.log(jqXHR.responseText);
//                     }
//                 });
//             });
//         }
//
//     }
//
// }