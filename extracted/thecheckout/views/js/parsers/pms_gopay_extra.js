/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.pms_gopay_extra = {


    init_once: function (content, triggerElementName) {

    },

    container: function (element) {

    },

    all_hooks_content: function (content) {

    },

    form: function (element) {
        thisForm = element.find('form');
        newAction = thisForm.attr("action");
        serializedForm = thisForm.serialize();
        thisForm.attr('action', "javascript:inlineFunction('"+newAction+"', '"+serializedForm+"');");

    },

    on_ready: function () {

    },

    additionalInformation: function (element) {

    }

}