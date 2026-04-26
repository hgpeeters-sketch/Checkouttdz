/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

var smartform = smartform || {};
// To disable, set in custom JS: var smartformValidateEmail = false;
var smartformValidateEmail = (typeof smartformValidateEmail !== 'undefined') ? smartformValidateEmail : true;
// To change, set in custom JS: var msg_SmartformInvalidEmail = 'Email je špatne (custom msg.)';
var msg_SmartformInvalidEmail = (typeof msg_SmartformInvalidEmail !== 'undefined') ? msg_SmartformInvalidEmail : 'Špatně zadaná e-mailová adresa.';

smartform.beforeInit = function () {
    smartform.setClientId(tc_smartformClientId);
    smartform.enableSetAutocomplete(false); // Smartform is setting autocomplete to 'off' which seems to be ignored by Chrome

    // ---------------- SMARTFORM VALIDATE EMAIL -----------------
    if (smartformValidateEmail) {
        const el = $(`#thecheckout-account .form-group.email input.form-control`);
        el.addClass('smartform-email');
        // smartform.getInstance().emailControl.addValidationCallback(tc_emailValidationCallback);
    }
}

smartform.afterInit = function () {
    tc_smartformLoadedCallback();
}

$.getScript({
    url: 'https://client.smartform.cz/v2/smartform.js',
    cache: true
})

function tc_smartformLoadedCallback() {
    console.log('[tc_smartform] smartform initiated');

    const emailValidationCallback = (response) => {
        console.log(`[tc_smartform] Validation result for '${response?.result?.inputEmail}': ${response?.result?.resultType}, upToDate: ${response?.upToDate}, flags: ${response?.result?.flags}`);
        if (response && response?.upToDate && response?.result?.resultType === 'NOT_EXISTS') {
            const _tc_smartFormEmailError = msg_SmartformInvalidEmail + ` ${response?.result?.flags}`;
            const blockSel = '#thecheckout-account';
            printContextErrors(blockSel, { email: _tc_smartFormEmailError }, undefined, true);
        } else {
            $(`#thecheckout-account .form-group.email input.form-control`).removeClass('-error');
            checkAndHideGlobalError();
        }
    }

    const addressSelected = (element, text, fieldType, suggestion) => {
        // console.log('addressSelected callback called', element, text, fieldType, suggestion);
        if (fieldType == 'smartform-address-street-and-number') {
            // Check if number is present in address, if not, add 'missing-street-number' class on parent element
            var pattern = /\d/;
            if (!text.match(pattern)) {
                $(element).closest('.form-group').addClass('missing-street-number');
            } else {
                $(element).closest('.form-group').removeClass('missing-street-number');
            }
        }
        return true;
    }

    const attachClass = (addrType, tcField, smartformField, unbind) => {
        // console.log(`$('[data-address-type=${addrType}] .form-group.${tcField} input.form-control').addClass('smartform-instance-${addrType} smartform-address-${smartformField}')`);
        const el = $(`[data-address-type=${addrType}] .form-group.${tcField} input.form-control`);
        const cls = `smartform-instance-${addrType} smartform-address-${smartformField}`
        if (unbind) {
            el.removeClass(cls)
        } else {
            // console.log('setting up autocomplete to nothing for ', el)
            el.addClass(cls).attr('autocomplete', 'completion-disabled');
        }
    }

    const attachFieldsForAddress = (addrType, unbind, isoCode = 'CZ') => {
        // console.log(` - ${unbind ? 'detach' : 'attach'} classes for '${addrType}'`)
        attachClass(addrType, 'address1', 'street-and-number', unbind);
        attachClass(addrType, 'city', 'city', unbind);
        attachClass(addrType, 'postcode', 'zip', unbind);
    }

    const reInitAddresses = () => {
        const smartformInstances = []
        $('.address-fields .js-country option:selected').each(function () {
            const isoCode = $(this).closest('.address-fields').attr('data-iso-code');
            const addrType = $(this).closest('.address-fields').attr('data-address-type');
            console.log(`[tc_smartform] re-init '${addrType}' with country filter '${isoCode}'`)
            if (['CZ', 'SK'].includes(isoCode)) {
                smartformInstances.push({ addrType, unbind: false, isoCode })
                attachFieldsForAddress(addrType, false, isoCode);
            } else {
                smartformInstances.push({ addrType, unbind: true, isoCode })
                attachFieldsForAddress(addrType, true);
            }
        });

        smartform.rebindAllForms(function() {
            smartformInstances.forEach( ({ addrType, unbind, isoCode }) => {
                if (!unbind) {
                    const addressControl = smartform.getInstance(`smartform-instance-${addrType}`)?.addressControl;
                    addressControl.setCountry(isoCode);
                    addressControl.setSelectionCallback(addressSelected);
                }
            });
            // ---------------- SMARTFORM VALIDATE EMAIL -----------------
            if (smartformValidateEmail) {
                smartform.getInstance().emailControl.addValidationCallback(emailValidationCallback);
            }
        });
    }

    reInitAddresses();

    prestashop.on('thecheckout_updateAddressCountry', function(data) {
        reInitAddresses();
    });
}

