/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
// debug_js_controller property is set in front.tpl

// checkoutPaymentParser could be set from other (payment) modules, so let's do not reset it here
if ('undefined' === typeof checkoutPaymentParser) {
    var checkoutPaymentParser = {};
}
var checkoutShippingParser = {};

var tcIsMobileView = false; // we will allways start with false, our markup from server is desktop optimized
var tcMobileViewThreshold = 991;

var tc_confirmOrderValidations = {};

var tc_updatePaymentWithShipping = true;

// Default value; can be overridden from custom JS
var tcGlobal_fetchAgainAfterVoucher = false;

// markup added to .inner-area of checkout blocks on updateHtml, while waiting for ajax response
var tc_loaderHtml = '\
   <div class="tc-ajax-loading">\
    <div class="tc-spinner">\
    <div class="bounce1"></div>\
    <div class="bounce2"></div>\
    <div class="bounce3"></div>\
    </div>\
   </div>';

// 'dirty' flag to mark checkout form prepared to be payment-confirmed, without submitting data again.
var paymentConfirmationPrepared = false;
var paymentLoaderMaxTime = 3000;

$(document).ready(function () {

    if (debug_js_controller) {
        console.info('front.js loaded!');
    }

    $('body').addClass('document-ready');

    initBlocksSelectors();
    getShippingAndPaymentBlocks();
    //getCartSummary();

    setAddressFieldsCountryCSS();

    // Remove default checkout handlers (e.g. country change)
    $('body').off('change', '.js-country');

    // Set handlers
    $('body').on('click', '#expand_other_shipping_options', function (e) {
        // by removing shipping-selected class, styling would take care of showing non-selected shipping options again
        $('.delivery-options-list.shipping-selected').removeClass('shipping-selected');
    });
    $('body').on('click', '#expand_other_payment_options', function (e) {
        // by removing shipping-selected class, styling would take care of showing non-selected payment options again
        $('#checkout-payment-step.payment-selected').removeClass('payment-selected');
    });
    // Check if email was registered
    $('body').on('change', '#thecheckout-account [name=email]', function (e) {
        setTimeout( function() {
            if (!$('.overlay-email').is(':visible') && modalTriggeredToBeShown < 1) {
                checkEmail('form.account-fields', $(this));
            }
        }, 200);
    });

    $('body').on('click', '#tc_save_account', function (e) {
        checkEmail('form.account-fields', $(this), function (jsonData) {
            if (!jsonData.hasErrors) {
                $('#tc_save_account').slideUp();
            }
        });
    });

    $('body').on('change input', '#thecheckout-account .account-fields input', function (e) {
        if ($('#tc_save_account').length) {
            $('#tc_save_account').slideDown();
        }
    });

    $('body').on('change', '.checkout-block input.-error, .checkout-block select.-error', function () {
        $(this).removeClass('-error').addClass('-former-error');
        checkAndHideGlobalError();
    });

    $('body').on('change', '#js-delivery input', function () {
        selectDeliveryOption($('#js-delivery')); // delivery form object as parameter
    });

    $('body').on('change', '.js-gift-checkbox', function () {
        toggleGiftMessage();
    });

    $('body').on('blur', '#gift_message', function () {
        selectDeliveryOption($('#js-delivery'));
    });

    $('body').on('blur', '#delivery_message', function () {
        setDeliveryMessage();
    });

    $('body').on('click', '[data-link-action=x-delete-from-cart]', function () {
        deleteFromCart($(this).data(), $(this));
        return false;
    });

    $('body').on('click', '[data-link-action=x-sign-in]', function () {
        signIn();
        return false;
    });

    $('body').on('click', '[data-link-action=x-forced-email-continue]', function () {
        var enteredEmail = $('[name=forced-email]').val();

        if (!tc_helper_validateEmail(enteredEmail)) {
            $('.error-enter-email').show();
        } else {
            // refreshing of shipping/payment blocks is done in emailCheck, if dummycontainers still exist
            //$('#thecheckout-account [name=email]').val(enteredEmail).trigger('change');
            checkEmail('.overlay-email', $(this), function (jsonData) {
                if (jsonData.hasErrors) {
                    if ('undefined' !== jsonData.errors && 'undefined' !== jsonData.errors['email']) {
                        jsonData.errors['forced-email'] = jsonData.errors['email'];
                    }
                    blockSel = '.overlay-email';
                    printContextErrors(blockSel, jsonData.errors, undefined, true);
                } else {
                    $('body').removeClass('force-email-overlay');
                    if ($('.overlay-email .newsletter-moved').length) {
                        $('.overlay-email .newsletter-moved').removeClass('newsletter-moved').appendTo('#thecheckout-newsletter');
                    }
                    $('#thecheckout-account [name=email]').val(enteredEmail).trigger('change');
                }
            });

        }

        return false;
    });

    // Trigger above defined routine also on Enter keypress
    $('body').on('keyup', '[name=forced-email]', function (event) {
        $('.error-enter-email').hide();
        if (event.key !== "Enter")
            return; // Use `.key` instead.
        $('[data-link-action=x-forced-email-continue]').trigger('click');
        event.preventDefault();
    });


    $('body').on('click', '[data-link-action=x-confirm-order]', function () {
        confirmOrder($(this));
        return false;
    });

    $('body').on('click', '[data-link-action=x-save-account-overlay]', function () {
        confirmOrder($(this));
        return false;
    });

    $('body').on('click', '[data-link-action=x-add-voucher]', function () {
        addVoucher();
        return false;
    });

    $('body').on('click', '[data-link-action=x-remove-voucher]', function () {
        removeVoucher($(this).data());
        return false;
    });

    $('body').on('change', '[data-link-action=x-create-account]', function () {
        if ($(this).prop('checked')) {
            $('#thecheckout-account .form-group.password, #thecheckout-account .form-group.dm_gdpr_active').slideDown('fast', function () {
                $(this).removeClass('hidden')
            });
        } else {
            $('#thecheckout-account .form-group.password, #thecheckout-account .form-group.dm_gdpr_active').slideUp('fast');
        }
        return false;
    });

    $('body').on('change', '[data-link-action=x-ship-to-different-address]', function () {

        if ($('#thecheckout-address-delivery').is(':visible')) {
            $(this).prop('checked', false);
            $('#thecheckout-address-delivery').hide(10, function () {
                //modifyAccountAndAddress($('#thecheckout-address-invoice [name=id_country]'));
                modifyAddressSelection('delivery');
            });

        } else {
            $(this).prop('checked', true);
            $('#thecheckout-address-delivery').show(10, function () {
                //modifyAccountAndAddress($('#thecheckout-address-delivery [name=id_country]'));
                modifyAddressSelection('delivery');
            });

        }
        return false;
    });

    $('body').on('change', '[data-link-action=x-bill-to-different-address]', function () {
        if ($('#thecheckout-address-invoice').is(':visible')) {
            $(this).prop('checked', false);
            $('#thecheckout-address-invoice').hide(10, function () {
                modifyAddressSelection('invoice');
                //modifyAccountAndAddress($('#thecheckout-address-delivery [name=id_country]'));
            });
        } else {
            $(this).prop('checked', true);
            $('#thecheckout-address-invoice').show(10, function () {
                modifyAddressSelection('invoice');
                //modifyAccountAndAddress($('#thecheckout-address-invoice [name=id_country]'));
            });
        }
        return false;
    });

    $('body').on('change', '[data-link-action=x-invoice-addresses]', function () {
        modifyAddressSelection('invoice');
        return false;
    });

    $('body').on('change', '[data-link-action=x-delivery-addresses]', function () {
        modifyAddressSelection('delivery');
        return false;
    });

    $('body').on('change', '[data-link-action=x-i-am-business]', function () {
        var businessFieldsSelector = '#thecheckout-address-invoice .form-group.business-field';
        var businessDisabledFieldsSelector = '#thecheckout-address-invoice .form-group.business-disabled-field';
        if ($(this).prop('checked')) {
            if ($('[data-link-action=x-i-am-private]').prop('checked')) {
                $('[data-link-action=x-i-am-private]').prop('checked', false).change();
            }
            $(businessFieldsSelector).not('.hidden').show();
            $('#thecheckout-address-invoice .business-fields-separator').css('display', 'block');
            $(businessDisabledFieldsSelector).hide();
        } else {
            $(businessFieldsSelector + ', #thecheckout-address-invoice .business-fields-separator').not('.need-dni').hide();
            $(businessDisabledFieldsSelector).not('.hidden').show();
        }
        if ($(businessFieldsSelector + ' .live').length) {
            modifyAccountAndAddress($(businessFieldsSelector + ' .live').first());
        }
        if ($('#dni-placeholder').length && $('#thecheckout-address-invoice .business-field.dni').length) {
            swapElements($('#dni-placeholder'), $('#thecheckout-address-invoice .business-field.dni'));
        }

        return false;
    });

    $('body').on('change', '[data-link-action=x-i-am-business-delivery]', function () {
        var businessFieldsSelector = '#thecheckout-address-delivery .form-group.business-field';
        var businessDisabledFieldsSelector = '#thecheckout-address-delivery .form-group.business-disabled-field';
        if ($(this).prop('checked')) {
            if ($('[data-link-action=x-i-am-private-delivery]').prop('checked')) {
                $('[data-link-action=x-i-am-private-delivery]').prop('checked', false).change();
            }
            $(businessFieldsSelector).not('.hidden').show();
            $('#thecheckout-address-delivery .business-fields-separator').css('display', 'block');
            $(businessDisabledFieldsSelector).hide();
        } else {
            $(businessFieldsSelector + ', #thecheckout-address-delivery .business-fields-separator').not('.need-dni').hide();
            $(businessDisabledFieldsSelector).not('.hidden').show();
        }
        if ($(businessFieldsSelector + ' .live').length) {
            modifyAccountAndAddress($(businessFieldsSelector + ' .live').first());
        }
        if ($('#dni-placeholder-delivery').length && $('#thecheckout-address-delivery .business-field.dni').length) {
            swapElements($('#dni-placeholder-delivery'), $('#thecheckout-address-delivery .business-field.dni'));
        }

        return false;
    });

    $('body').on('change', '[data-link-action=x-i-am-private]', function () {
        var privateFieldsSelector = '#thecheckout-address-invoice .form-group.private-field';
        var privateDisabledFieldsSelector = '#thecheckout-address-invoice .form-group.private-disabled-field';
        if ($(this).prop('checked')) {
            if ($('[data-link-action=x-i-am-business]').prop('checked')) {
                $('[data-link-action=x-i-am-business]').prop('checked', false).change();
            }
            $(privateFieldsSelector).not('.hidden').show();
            $('.private-fields-separator').css('display', 'block');
            $(privateDisabledFieldsSelector).hide();
        } else {
            $(privateFieldsSelector + ', .private-fields-separator').not('.need-dni').hide();
            $(privateDisabledFieldsSelector).not('.hidden').show();
        }
        if ($(privateFieldsSelector + ' .live').length) {
            modifyAccountAndAddress($(privateFieldsSelector + ' .live').first());
        }
        if ($('#dni-placeholder-private').length && $('#thecheckout-address-invoice .private-field.dni').length) {
            swapElements($('#dni-placeholder-private'), $('#thecheckout-address-invoice .private-field.dni'));
        }

        return false;
    });

    $('body').on('change', '[data-link-action=x-i-am-private-delivery]', function () {
        var privateFieldsSelector = '#thecheckout-address-delivery .form-group.private-field';
        var privateDisabledFieldsSelector = '#thecheckout-address-delivery .form-group.private-disabled-field';
        if ($(this).prop('checked')) {
            if ($('[data-link-action=x-i-am-business-delivery]').prop('checked')) {
                $('[data-link-action=x-i-am-business-delivery]').prop('checked', false).change();
            }
            $(privateFieldsSelector).not('.hidden').show();
            $('.private-fields-separator').css('display', 'block');
            $(privateDisabledFieldsSelector).hide();
        } else {
            $(privateFieldsSelector + ', .private-fields-separator').not('.need-dni').hide();
            $(privateDisabledFieldsSelector).not('.hidden').show();
        }
        if ($(privateFieldsSelector + ' .live').length) {
            modifyAccountAndAddress($(privateFieldsSelector + ' .live').first());
        }
        if ($('#dni-placeholder-private-delivery').length && $('#thecheckout-address-delivery .private-field.dni').length) {
            swapElements($('#dni-placeholder-private-delivery'), $('#thecheckout-address-delivery .private-field.dni'));
        }

        return false;
    });


    $('body').on('click', '[data-link-action=toggle-password-visibility]', function () {
        var input = $(this).closest('label').find('input');
        if (input.attr("type") == "password") {
            input.attr("type", "text");
        } else {
            input.attr("type", "password");
        }
        return false;
    });

    $('body').on('click', '[data-link-action=x-add-new-address]', function () {
        $(this).parent('.customer-addresses').find('.addresses-selection')
            .removeClass('hidden')
            .find('select').val(-1).trigger('change');
        $(this).hide();
        return false;
    });


    var quantityInputFieldTimeout;

    $('body').on('input', '[data-link-action=x-update-cart-quantity]', function () {
        if (quantityInputFieldTimeout) {
            clearTimeout(quantityInputFieldTimeout);
        }
        var el = $(this);
        var timeout = (1 == $(this).data('no-wait')) ? 0 : 500;
        quantityInputFieldTimeout = setTimeout(function () {
            updateQuantityFromInput(el);
        }, timeout);
        return false;
    });
    $('body').on('click', '[data-link-action=x-update-cart-quantity-up]', function () {
        var inputEl = $(this).parent().find('[data-link-action=x-update-cart-quantity]');
        inputEl.val(parseInt(inputEl.val()) + 1).data('no-wait', 1); // .trigger('input');
        inputEl.get(0).dispatchEvent(new Event('input', {
            bubbles: true
        }))
        return false;
    });
    $('body').on('click', '[data-link-action=x-update-cart-quantity-down]', function () {
        var inputEl = $(this).parent().find('[data-link-action=x-update-cart-quantity]');
        if (parseInt(inputEl.attr('min')) < parseInt(inputEl.val())) {
            inputEl.val(parseInt(inputEl.val()) - 1).data('no-wait', 1); // .trigger('input');
            inputEl.get(0).dispatchEvent(new Event('input', {
                bubbles: true
            }))
        }
        return false;
    });

    // Remove errors from checkboxes on their modification
    $('body').on('change', '.form-group.checkbox input[type=checkbox], [data-link-action=x-create-account]', function () {
        $(this).closest('.form-group').find('.field.error-msg').remove();
        checkAndHideGlobalError();
        modifyCheckboxOption($(this));
    });

    $('body').on('change', 'input[id^=conditions_to_approve]', function () {
        $(this).closest('.terms-and-conditions').find('.error-msg').hide();
        checkAndHideGlobalError();
        modifyCheckboxOption($(this));
    });

    $('body').on('change', 'input[name=id_gender]', function () {
        $(this).closest('.form-group').find('.field.error-msg').remove();
        checkAndHideGlobalError();
        modifyRadioOption($(this));
    });

    $('body').on('click', '[data-link-action=x-offer-login]', function (event) {
        return openLoginForm();
    });

    $('body').on('click', '.error-msg #sign-in-link', function (event) {
        event.preventDefault();
        return openLoginForm();
    });

    // On *any* modification, hide binary payment and let user save again
    $('body').on('change', 'input', function () {
        payment.hideBinary();
        setConfirmationDirty();
    });

    // triggering 'change' events earlier then on focusOut
    var tc_fieldChangeObserverTimeout = {};
    var tc_inputTriggerChangeTimeoutMillis = 1500;
    $('body').on('input', '.checkout-block .text input, .checkout-block .tel input', function () {
        $self = $(this);
        clearTimeout(tc_fieldChangeObserverTimeout[$self.attr('name')]);
        tc_fieldChangeObserverTimeout[$self.attr('name')] =
            setTimeout(function () {
                $self.trigger('change')
            }, tc_inputTriggerChangeTimeoutMillis);
    });
    $('body').on('change', '.checkout-block .text input', function () {
        $self = $(this);
        clearTimeout(tc_fieldChangeObserverTimeout[$self.attr('name')]);
    });

    $('body').on('blur', '[name=address1]', function () {
        // put space before last number in address:
        var field_value = $(this).val();
        //$(this).val(field_value.replace(/\s*(\d+)$/, "\$1 \$2").replace(/^(\d+(,|st|nd|rd|th)?)\s*/, "\$1 ").trim());

        // Check if number is present in address, if not, add 'missing-street-number' class on parent element
        var pattern = /\d/;
        if (!field_value.match(pattern)) {
            $(this).closest('.form-group').addClass('missing-street-number');
        } else {
            $(this).closest('.form-group').removeClass('missing-street-number');
        }
    });

    $('body').on('change', '[name=firstname], [name=lastname], [name=address1], .orig-field[name=city]', function () {
        $(this).val($(this).val().toCapitalize());
        // In firstname and lastname, as preventive measure, replace dots that are not followed
        // by spaces, with dot+space, so that customer_firstname and customer_lastname validation passes properly.
        if ($(this).attr('name').match(/.*?tname/)) {
            $(this).val(jQuery.trim($(this).val().replace(/\.\s*/g, '. ')));
        }
    });

    $('body').on('change', '[name=postcode], [name=vat_number]', function () {
        var t_fieldVal = jQuery.trim($(this).val().toUpperCase());
        // remove spaces for vat_number and for postcode only when enabled in settings
        if ('postcode' !== $(this).attr('name') || config_postcode_remove_spaces) {
            t_fieldVal = t_fieldVal.replace(/\s|\./g, '');
        }
        $(this).val(t_fieldVal);
    });

    $('body').on('change', '.address-fields .js-country', function () {
        setAddressFieldsCountryCSS();
    });

    var liveFieldTimeout;

    // On these fields modification, address shall be stored and carriers / payments reloaded
    // Register it at the end, so that the other fields-modifications take place earlier
    $('body').on('change', '.live', function () {

        // FIX for autofill, which triggers modifyAccount multiple times in short span of time
        // First, let's wait a moment and execute only last call

        // console.log('-- live change, field', $(this).attr('name'));
        if (liveFieldTimeout) {
            clearTimeout(liveFieldTimeout);
        }
        $self = $(this);

        // In certain cases, make full page reload
        // This will be on rare occasions, so we can allow a fixed timeout here
        setTimeout(function () {
            if ('id_country' === $self.attr('name') && installedModules['mondialrelay']) {
                location.reload(true);
            }
        }, 2000);

        // if change() is triggered by leaving the field focus, let's clear timeout that watches
        // this field and triggers change() after pre-set time
        if ("undefined" !== typeof tc_fieldChangeObserverTimeout &&
            "number" === typeof tc_fieldChangeObserverTimeout[$self.attr('name')]) {
            clearTimeout(tc_fieldChangeObserverTimeout[$self.attr('name')]);
        }

        var timeout = 20;
        liveFieldTimeout = setTimeout(function () {
            modifyAccountAndAddress($self);
        }, timeout);
        return false;


    });

    handleWindowResize($(this)); // Init - (to switch to mobile, if we're on small screen)
    $(window).on('resize', function () {
        handleWindowResize($(this));
    });

    // Show password "red_eye" iconds to switch between password and text field
    $('[data-link-action="toggle-password-visibility"]').removeClass('hidden');

    $(document).ajaxError(function myErrorHandler(event, xhr, ajaxOptions, thrownError) {
        console.info("Ajax error \n\nDetails:\nError thrown: " + thrownError + "\n" +
            'event: ');
        console.info(event);
        console.info("\n" + 'xhr: ');
        console.info(xhr);
        console.info("\n" + 'ajaxOptions: ');
        console.info(ajaxOptions);
    });

    // Modal window on terms and conditions link click
    // We need to .off this click, otherwise in native checkout itself it would be bound twice (+ one more here)
    // And we're also using detection if modal was triggered, because with Chrome's auto-fill, checkEmail is triggering
    //  whenever page is loaded (and email field autofilled) and user immediately clicks T&C link
    var modalTriggeredToBeShown = 0;
    setTimeout( function() {
        $(".js-terms a").off('click');
        $("body#checkout").on("click", ".js-terms a", function (t) {
            modalTriggeredToBeShown++;
            setTimeout(function() { modalTriggeredToBeShown--; }, 1000);

            t.preventDefault();
            var e = $(t.target).closest('a').attr("href");
            e && (e += "?content_only=1",
                $.get(e, function (t) {
                    $("#modal").find(".js-modal-content").html($(t).find("[class*=page-cms]:first").contents())
                }).fail(function (t) {
                    // l.default.emit("handleError", {
                    //     eventType: "clickTerms",
                    //     resp: t
                    // })
                    console.info("terms load failed, check the URL is valid: "+e);
                })),
                $("#modal").modal("show");
        });
    }, 200)

    promoteBusinessAndPrivateFields();

    if (config_force_customer_to_choose_country) {
        tc_confirmOrderValidations['force_customer_to_choose_country'] = function () {
            if (
                $('#thecheckout-shipping .dummy-block-container.disallowed').is(":visible") ||
                $('#thecheckout-payment .dummy-block-container.disallowed').is(":visible")
            ) {
                scrollToElement($('.dummy-block-container.disallowed').first());
                $('.dummy-block-container.disallowed').css('color', 'red');
                return false;
            } else {
                return true;
            }
        };
    }

    // It's also necessary to comment out /modules/cgma/cgma.php, around line 216: Tools::redirect($base . $this->getCartSummaryURL());
    tc_confirmOrderValidations['cgma_minimal_order_amount_by_customer_groups'] = function () {
        if (
            $('.cart-summary #cgma_errors').is(':visible')
        ) {
            scrollToElement($('.cart-summary #cgma_errors').first());
            return false;
        } else {
            return true;
        }
    };
    // Register global events on every ajax request and watch out for property 'customPropAffectedBlocks'
    // in $.ajax settings; and for such property, display loader animation.
    if (config_blocks_update_loader) {
        $(document).ajaxSend(function (event, jqxhr, settings) {
            if ('undefined' !== typeof settings.customPropAffectedBlocks) {
                // attach loader to element specified by selector 'customPropAffectedBlocks'
                // removed: we don't need clean up, default loader serves very well and once it is removed, we do
                // standard attach / remove HTML (tc_loaderHTML)
                //$(settings.customPropAffectedBlocks).find('.inner-area .dummy-block-container .tc-spinner').remove();
                // append loader right before update
                if ($(settings.customPropAffectedBlocks).find('.inner-area .dummy-block-container').length == 0) {
                    $(settings.customPropAffectedBlocks).find('.inner-area').prepend(tc_loaderHtml);
                }
                // Attach also loading-remove handler, when (this) ajax is finished
                jqxhr.always(function() {
                    $(settings.customPropAffectedBlocks).find('.inner-area > .tc-ajax-loading').remove(); 
                });
            }
        });

        // $(document).ajaxComplete(function (event, xhr, settings) {
        //     if ('undefined' !== typeof settings.customPropAffectedBlocks) {
        //         // remove loader from element specified by selector 'customPropAffectedBlocks'
        //         $(settings.customPropAffectedBlocks).find('.inner-area > .tc-ajax-loading:first-child').remove();
        //     }
        // });
    }

    // Amazonpay, change address link initialization
    if ("undefined" !== typeof tcAmazonPaySessionId && "" != tcAmazonPaySessionId &&
        "undefined" !== typeof amazon && "undefined" !== typeof amazon.Pay  && "undefined" !== typeof amazon.Pay.bindChangeAction)
    {
        amazon.Pay.bindChangeAction('#thecheckout-address-delivery .amazonpay-change-address', {
            amazonCheckoutSessionId: tcAmazonPaySessionId,
            changeAction: 'changeAddress'
        });
    }

    // Wrap first 'sticky' element into sticky container and add other 'sticky' elements to it; only if there are multiple 'sticky' elements
    if ($('.checkout-block.sticky').length > 1) {
        $('.checkout-block.sticky').first().wrap('<div class="sticky wrapper"></div>');
        $('.checkout-block.sticky').slice(1).appendTo('.sticky.wrapper');
        $('.sticky.wrapper > .checkout-block.sticky').removeClass('sticky');
    }

});

function initBlocksSelectors() {
    shippingBlockElement = $('#thecheckout-shipping .inner-area');
    paymentBlockElement = $('#thecheckout-payment .inner-area .dynamic-content');
    cartSummaryBlockElement = $('#thecheckout-cart-summary .inner-area');
    invoiceAddressBlockElement = $('#thecheckout-address-invoice .inner-area');
    deliveryAddressBlockElement = $('#thecheckout-address-delivery .inner-area');
}

function handleWindowResize(win) {
    if (win.width() <= tcMobileViewThreshold && !tcIsMobileView) {
        tcIsMobileView = true;
        // Take out all checkout blocks from their desktop layout and put into new container for mobile sorting
        $('.checkout-block').each(function () {
            $(this).appendTo('#tc-container-mobile');
        });
    } else if (win.width() > tcMobileViewThreshold && tcIsMobileView) {
        tcIsMobileView = false;
        // Put .checkout-block containers back to desktop (out of mobile / single column layout)
        $('.checkout-block').each(function () {
            $(this).insertAfter('.tc-block-placeholder.' + $(this).attr('id'));
        });
    }
}

// On init, and on country change, set data-iso-code attribute on address fields, so that we can modify
// checkout form (address section) with CSS rules, based on selected country
function setAddressFieldsCountryCSS() {
    $('.address-fields .js-country option:selected').each(function () {
        const origIso = $(this).closest('.address-fields').attr('data-iso-code');
        $(this).closest('.address-fields').attr('data-iso-code', $(this).data('iso-code'));

        // Hook to this:
        // prestashop.on('thecheckout_updateAddressCountry', function(data) { console.log('country updated!', data); })
        if (origIso !== $(this).data('iso-code')) {
            prestashop.emit('thecheckout_updateAddressCountry', {
                'addressType':  $(this).closest('.address-fields').attr('data-address-type'),
                'origIsoCode': origIso,
                'newIsoCode':  $(this).data('iso-code')
            });
        }
    });
}

function openLoginForm() {
    $('#login-form [name=email]').val($('#thecheckout-account [name=email]').val());
    $('.offer-login').addClass('expanded');
    $('#login-form').fadeIn();
    scrollToElement($('#login-form').closest('.checkout-block'));
    return false;
}

function formatErrors(errors, tag) {
    if ('undefined' === typeof tag) {
        tag = 'div';
    }
    var errMsg = "";
    $.each(errors, function (index, value) {
        if ("" !== jQuery.trim(value)) {
            errMsg += "<" + tag + ">";
            if ("" !== jQuery.trim(index) && isNaN(index)) {
                errMsg += index + ': ';
            }
            errMsg += value + "</" + tag + ">\n";
        }
    });
    return errMsg;
}

function checkAndHideGlobalError() {
    if (0 == $('.field.error-msg:visible').length) {
        $('#tc-payment-confirmation > .error-msg').hide();
    }
}

function showGlobalError() {
    $('#tc-payment-confirmation > .error-msg').show();
    scrollToError();
}

function scrollToError() {
    scrollToElement($('.error-msg:visible').closest('.form-group'));
}

function scrollToElement(element) {
    var scrollOffset = ("undefined" !== typeof globalScrollOffset) ? globalScrollOffset : -100;
    if (element.length) {
        var actions = computeScrollIntoView(element.get(0), {
            behavior: 'smooth',
            scrollMode: 'if-needed',
            block: 'center'
        });
        if ("undefined" !== typeof actions[0]) {
            window.scrollTo({
                top: actions[0].top - scrollOffset,
                behavior: "smooth"
            });
        }
    }
}

function showError(element) {
    $(element).show();
}

function hideError(element) {
    $(element).hide();
    checkAndHideGlobalError();
}

function removeError(element) {
    $(element).remove();
    checkAndHideGlobalError();
}

// Modify checkout option (typically checkbox) and send it to backend to be remembered in session (cookie)
function modifyCheckboxOption(element) {
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=modifyCheckboxOption" +
            "&name=" + element.attr('name') +
            "&isChecked=" + element.is(':checked') +
            "&token=" + static_token,
        success: function (jsonData) {

        }
    });
}

// Modify checkout option (typically checkbox) and send it to backend to be remembered in session (cookie)
function modifyRadioOption(radioElements) {
    var elName = radioElements.attr('name');
    var checkedElement = $('[name=' + elName + ']:checked');
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=modifyRadioOption" +
            "&name=" + checkedElement.attr('name') +
            "&checkedValue=" + checkedElement.val() +
            "&token=" + static_token,
        success: function (jsonData) {

        }
    });
}

function printContextErrors(blockSel, errors, triggerElement, dontShowGlobal) {

    var highlightOnElements = [];
    if ("undefined" !== typeof triggerElement
        && !isMainConfirmationButton(triggerElement)
        && !isSaveAccountOverlayConfirmation(triggerElement)) {
        highlightOnElements.push(triggerElement.attr('name'));
        removeError(blockSel + ' [name=' + triggerElement.attr('name') + '] ~ .field.error-msg');
        // With country change, re-validate postcode, if it's filled in
        if ("id_country" === triggerElement.attr('name') && "" != $(blockSel + ' [name=postcode]').val()) {
            highlightOnElements.push('postcode');
            $(blockSel + ' [name=postcode]').removeClass('-error');
            removeError(blockSel + ' [name=postcode] ~ .field.error-msg');
        }
    } else {
        removeError(blockSel + ' .field.error-msg');
        $(blockSel + ' .error').removeClass('-error');
    }

    var switchToStep = 0; // 0 = no switch
    step_error_loop:
    if (typeof tc_steps !== 'undefined') {
        const selectorBlocks = blockSel.match(/#thecheckout-([a-zA-Z0-9-_]*)/g);
        for (const blockNameFull of selectorBlocks) {
            const blockName = blockNameFull.replace('#thecheckout-', '');
            for (tc_step of tc_steps) {
                if (tc_step.blocks.includes(blockName)) {
                    switchToStep = tc_step.step;
                    break step_error_loop;
                }
            }
        }
    }

    $.each(errors, function (index, value) {
        if ("" !== jQuery.trim(value) && (0 == highlightOnElements.length || highlightOnElements.indexOf(index) > -1)) {
            if (switchToStep > 0 && typeof setHash === 'function') {
                setHash(switchToStep);
            }
            $(blockSel + ' [name=' + index + ']').addClass('-error');
            if ($(blockSel + ' [name=' + index + ']').is(':checkbox') || $(blockSel + ' [name=' + index + ']').is(':radio')) {
                $(blockSel + ' [name=' + index + ']').closest('.form-group').append('<div class="field error-msg">' + value + '</div>');
            } else if ($(blockSel + ' [name=' + index + ']').length > 0) {
                $(blockSel + ' [name=' + index + ']').after('<div class="field error-msg">' + value + '</div>');
            } else {
                $('[name=' + index + ']').closest('.form-group').append('<div class="field error-msg">' + value + '</div>');
            }

            if (0 == highlightOnElements.length && ('undefined' === typeof dontShowGlobal || !dontShowGlobal)) {
                showGlobalError();
            }
        }
    });

}

function swapElements(el1, el2) {
    var tempNode = $('<div id="swap-elements-temp"></div>');
    el1.after(tempNode);
    el2.after(el1);
    tempNode.after(el2);
    tempNode.remove();
}

function promoteBusinessAndPrivateFields() {
    // Group and put in front the business fields, if "I am a business" checkbox is ticked
    if (config_show_i_am_business) {
        // Special treatment of .need-dni, which can be displayed for consumer and business, but on different position
        if ($('#thecheckout-address-invoice .business-field.dni').length) {
            $('#thecheckout-address-invoice .business-field.dni').after('<div id="dni-placeholder"></div>');
        }
    }
    if (config_show_i_am_business_delivery) {
        // Special treatment of .need-dni, which can be displayed for consumer and business, but on different position
        if ($('#thecheckout-address-delivery .business-field.dni').length) {
            $('#thecheckout-address-delivery .business-field.dni').after('<div id="dni-placeholder-delivery"></div>');
        }
    }

    if (config_show_i_am_private) {
        if ($('#thecheckout-address-invoice .private-field.dni').length) {
            $('#thecheckout-address-invoice .private-field.dni').after('<div id="dni-placeholder-private"></div>');
        }
    }
    if (config_show_i_am_private_delivery) {
        if ($('#thecheckout-address-delivery .private-field.dni').length) {
            $('#thecheckout-address-delivery .private-field.dni').after('<div id="dni-placeholder-private-delivery"></div>');
        }
    }
    if (config_show_i_am_business) {
        // To save the order of fields, we'd create placeholder and move the placeholder only to business section
        // After #i_am_business is ticked, placeholder will be replaced by field and field by placeholder
        $('#thecheckout-address-invoice .form-group.business-field, #dni-placeholder').not('.dni').prependTo($('#thecheckout-address-invoice .business-fields-container'));
    }
    if (config_show_i_am_business_delivery) {
        $('#thecheckout-address-delivery .form-group.business-field, #dni-placeholder-delivery').not('.dni').prependTo($('#thecheckout-address-delivery .business-fields-container'));
    }
    if (config_show_i_am_private) {
        $('#thecheckout-address-invoice .form-group.private-field, #dni-placeholder-private').not('.dni').prependTo($('#thecheckout-address-invoice .private-fields-container'));
    }
    if (config_show_i_am_private_delivery) {
        $('#thecheckout-address-delivery .form-group.private-field, #dni-placeholder-private-delivery').not('.dni').prependTo($('#thecheckout-address-delivery .private-fields-container'));
    }

    // If company fields are filled in (and thus #i_am_business ticked), we'll right away swap .need-dni with placeholder
    if ($('#i_am_business').is(':checked')) {
        swapElements($('#dni-placeholder'), $('#thecheckout-address-invoice .business-field.dni'));
    }
    if ($('#i_am_business_delivery').is(':checked')) {
        swapElements($('#dni-placeholder-delivery'), $('#thecheckout-address-delivery .business-field.dni'));
    }

    $('#i_am_business').prop('disabled', false);
    $('#i_am_business_delivery').prop('disabled', false);

    if ($('#i_am_private').is(':checked')) {
        swapElements($('#dni-placeholder-private'), $('#thecheckout-address-invoice .private-field.dni'));
    }
    if ($('#i_am_private_delivery').is(':checked')) {
        swapElements($('#dni-placeholder-private-delivery'), $('#thecheckout-address-delivery .private-field.dni'));
    }

    $('#i_am_private').prop('disabled', false);
    $('#i_am_private_delivery').prop('disabled', false);
}

function addVoucher() {
    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=addVoucher" +
            "&addDiscount=1" +
            "&discount_name=" + $('.checkout-block .cart-voucher [name=discount_name]').val() +
            "&token=" + static_token,
        success: function (jsonData) {

            if (jsonData.hasErrors) {

                var errMsg = formatErrors(jsonData.cartErrors, 'span');
                $('.promo-code > .alert-danger > .js-error-text').html(errMsg);
                $('.promo-code > .alert-danger').slideDown();

            } else {
                if (tcGlobal_fetchAgainAfterVoucher) {
                    // Shipping is cached in PS core, and our actual jsonData -> carriers here has pre-voucher value,
                    // so we need to fetch this again; only enable if voucher affect shipping cost
                    getShippingAndPaymentBlocks();
                } else {
                    updateCheckoutBlocks(jsonData, true, false, false);
                }
            }
        }
    });
}

function removeVoucher(data) {
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=removeVoucher" +
            "&deleteDiscount=" + data["discountId"] +
            "&token=" + static_token,
        success: function (jsonData) {

            if (jsonData.hasErrors) {

                var errMsg = formatErrors(jsonData.cartErrors, 'span');
                $('.promo-code > .alert-danger > .js-error-text').html(errMsg);
                $('.promo-code > .alert-danger').slideDown();

            } else {
                if (tcGlobal_fetchAgainAfterVoucher) {
                    getShippingAndPaymentBlocks();
                } else {
                    updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);
                }
            }
        }
    });
}

/* Prepare checkout form, so that once payment methods are loaded in payment block, they can be used immediately */
function prepareConfirmOrder() {

}

function confirmOrder(confirmButtonEl) {

    // typically, shipping modules can attach to tc_confirmOrderValidations, their respective
    // callbacks will be called here and should they not pass, order confirmation will be stopped
    var validationFailed = false;

    // clear shipping error before validations
    $('#thecheckout-shipping .error-msg').hide();

    $.each(tc_confirmOrderValidations, function (validationName, validationCallback) {
        if (!validationCallback()) {
            if (debug_js_controller) {
                console.info('validation did not pass for: ' + validationName);
            }
            validationFailed = true;
        }
    });

    if (validationFailed) {
        showGlobalError();
        return;
    }

    modifyAccountAndAddress(confirmButtonEl, function (jsonData) {
        // callback method, called when account/address validation was successful

        // check selected carrier and payment method (additionally if they have some selection requirements)
        var selectedDeliveryEl = $('[name^=delivery_option]:checked');
        var selectedPaymentEl = $('[name=payment-option]:checked');
        var cartSummaryErrorVisible = $('#thecheckout-cart-summary .error-msg:visible').length;

        if (!selectedDeliveryEl.length && !jsonData.isVirtualCart) {
            var shippingErrorMsg = $('#thecheckout-shipping .inner-wrapper > .error-msg');
            shippingErrorMsg.show();
            scrollToElement(shippingErrorMsg);
            showGlobalError();
            return;
        }

        if (!selectedPaymentEl.length && !config_separate_payment) {
            var paymentErrorMsg = $('#thecheckout-payment .inner-wrapper > .error-msg');
            paymentErrorMsg.show();
            scrollToElement(paymentErrorMsg);
            showGlobalError();
            return;
        }

        if (cartSummaryErrorVisible) {
            showGlobalError();
            return;
        }

        // Do we have any unchecked T&C?
        if ($('input[id^=conditions_to_approve]').not(':checked').length) {
            $('.terms-and-conditions > .error-msg').show();
            showGlobalError();
            return;
        }

        if (debug_js_controller) {
            console.info('delivery: ' + selectedDeliveryEl.val());
            console.info('payment: ' + selectedPaymentEl.attr('id'));
            console.info('*VALIDATION OK* Call payment method');
        }

        // Confirmation processing effect

        showConfirmButtonLoader(confirmButtonEl, true);
        // should there be an issue in Payment method form, handled by payment module only, rather safely set
        // timeout to hide loader after few seconds.
        setTimeout(function () {
            hideConfirmButtonLoader(confirmButtonEl)
        }, paymentLoaderMaxTime);
        if (isMainConfirmationButton(confirmButtonEl)) {
            if (!config_separate_payment) {
                payment.confirm();
            } else {
                if (debug_js_controller) {
                    console.info(' ==== REDIRECT TO p3i ==== ');
                }
                location.href = insertUrlParam(separate_payment_key);
            }

            // Maybe: for some payment modules, call confirmButtonEl.find('button').click();
        } else {
            // binary payment method, just hide save account overlay
            payment.hideSaveAccountOverlay();
        }


    });
}


function updateQuantityFromInput(el) {
    var data = el.data();
    qtyWanted = parseInt(el.val());
    qtyChange = qtyWanted - parseInt(data["qtyOrig"]);
    if (isNaN(qtyWanted) || isNaN(qtyChange)) {
        return;
    }
    data["qtyOrig"] = qtyWanted; // To allow rapid type-in changes in input field, e.g. modifying from single digit to 2-digit number
    if (qtyWanted < 1 || qtyChange == 0) {
        return;
    }
    el.prop('disabled', true);

    var additionalData = '';

    // AWP module support (also template - cart-detailed-product-line.tpl - modification is necessary!)
    var awpSpecialInstructions = data.updateUrl.match('special_instructions.*');
    additionalData += (awpSpecialInstructions)?'&'+awpSpecialInstructions:'';

    // Anvanto an_productfields module support (also template - cart-detailed-product-line.tpl - modification is necessary!)
    var anGroupId = data.updateUrl.match('an_group_id.*');
    additionalData += (anGroupId)?'&'+anGroupId:'';

    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=updateQuantity" +
            "&update=1" +
            "&qty=" + Math.abs(qtyChange) +
            "&op=" + ((qtyChange > 0) ? "up" : "down") +
            "&id_product=" + data["idProduct"] +
            "&id_product_attribute=" + data["idProductAttribute"] +
            "&id_customization=" + data["idCustomization"] +
            "&token=" + static_token + additionalData,
        success: function (jsonData) {

            // Removed, 5.6.2019: Now errors will go directly to cart-summary.tpl
            // $('#thecheckout-cart-summary > .error-msg').remove();
            // if (jsonData.hasErrors) {
            //   var errMsg = formatErrors(jsonData.cartErrors, 'span');
            //   $('#thecheckout-cart-summary').prepend('<div class="error-msg">' + errMsg + '</div>')
            //   $('#thecheckout-cart-summary > .error-msg').show();
            // }

            updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);
        }
    });
}

function dynamicToken() {
    if (typeof prestashop !== "undefined" && typeof prestashop.token !== "undefined" && prestashop.token !== "") {
        token = prestashop.token
    } else {
        token = $('#thecheckout-account [name=token]').val()
    }
    return "&token=" + token
}

function modifyAddressSelection(addressType) {
    // Send to server information about expanded/collapsed second address
    // And additionally ID of selected address from combobox (for logged-in users)

    var addressesDropdown = $('[data-link-action=x-' + addressType + '-addresses]');
    var newAddressId = 0;
    if (addressesDropdown.length) {
        newAddressId = addressesDropdown.val();
    }


    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary, #thecheckout-address-' + addressType,
        url: insertUrlParam('modifyAddressSelection'),
        type: 'POST',
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=modifyAddressSelection" +
            "&addressType=" + addressType +
            "&addressId=" + newAddressId +
            "&invoiceVisible=" + $('#thecheckout-address-invoice form:visible').length +
            "&deliveryVisible=" + $('#thecheckout-address-delivery form:visible').length +
            dynamicToken(),
        success: function (jsonData) {
            updateAddressBlock(addressType, jsonData.newAddressBlock, jsonData.newAddressSelection);
            updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);
        }
    });


    // Returned value - whole address block; simply replace, and also update other blocks - cart, shipping, payment

    // for non-logged in users, simply call modifyAccountAndAddress
    // modifyAccountAndAddress($('#thecheckout-address-' + addressType + ' [name=id_country]'));
}

function showConfirmButtonLoader(buttonEl, showLoadingAnimation) {
    if (showLoadingAnimation) {
        buttonEl.addClass('confirm-loading')
    }
    buttonEl.prop('disabled', true);
    if (debug_js_controller) {
        console.info('[thecheckout] show confirm loader at ' + new Date().getSeconds() + ':' + new Date().getMilliseconds());
    }
}

function hideConfirmButtonLoader(buttonEl) {
    buttonEl.removeClass('confirm-loading').prop('disabled', false);
    if (debug_js_controller) {
        console.info('[thecheckout] hide confirm loader at ' + new Date().getSeconds() + ':' + new Date().getMilliseconds());
    }
}

function isMainConfirmationButton(element) {
    return ("x-confirm-order" === element.data()["linkAction"]);
}

function isSaveAccountOverlayConfirmation(element) {
    return ("x-save-account-overlay" === element.data()["linkAction"]);
}

function checkEmail(accountFormSelector, triggerEl, callback) {
    // url - implicitly using current
    // fix potential email errors (accented chars)

    // Commented out, as it did not work for accented domains (which are allowed, and in chrome replaced to xn-- format
    // var unaccented = element.val().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // if (element.val() !== unaccented || element.val().match('xn--')) {
    //     element.val(unaccented);
    // }
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=checkEmail" +
            "&triggerEl=" + encodeURIComponent(triggerEl.attr('id')) +
            "&account=" + serializeVisibleFields(accountFormSelector) +
            dynamicToken() +
            _getExtraAccountParams(),
        success: function (jsonData) {
            if (jsonData.hasErrors) {
                blockSel = ':is(#thecheckout-account, #thecheckout-data-privacy, #thecheckout-psgdpr)';
                printContextErrors(blockSel, jsonData.errors, undefined, true);
            } else {
                updateAccountToken(jsonData.newToken);
                updateStaticToken(jsonData.newStaticToken);
                // if out of some reason, shipping/payment blocks are still disallowed, maybe entering email
                // would allow them (e.g. if forced-email-overlay was active)
                if ($('.dummy-block-container.disallowed').length) {
                    getShippingAndPaymentBlocks();
                }

                displayStaticCustomerInfoAndNav(jsonData.customerSignInArea);
                updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);
            }
            // call 'callback' method to let caller know we're ready
            if ('function' === typeof callback) {
                callback(jsonData);
            }
        }
    });
}

function updateNoticeStatus(status) {
    if ('undefined' === typeof status) {
        status = '-';
    }
    // url - implicitly using current
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=saveNoticeStatus" +
            "&noticeStatus=" + status +
            dynamicToken(),
        success: function (jsonData) {
            if (jsonData.hasErrors) {
                console.info('notice status update failed');
            } else {
                console.info('notice status update succeeded');
            }
        }
    });
}

function updateAccountToken(token) {
    if ("undefined" !== typeof token) {
        $('#thecheckout-account input[type=hidden][name=token]').val(token);
    }
}

function updateStaticToken(token) {
    if ("undefined" !== typeof token) {
        static_token = token;
        if ('undefined' !== typeof prestashop) {
            prestashop.static_token = token;
        }
    }
}

function serializeVisibleFields(formSelector) {
    return encodeURIComponent($(formSelector).find('input:visible, [type=hidden], .orig-field:visible, .custom-checkbox [type=checkbox]').serialize());
}

function setConfirmationDirty() {
    if (debug_js_controller) {
        console.info('[form-change-flag] confirmation dirty!');
    }

    // Check, if everything 'required' to trigger confirmation is filled in
    // If yes, then trigger it, but without visual feedback

    paymentConfirmationPrepared = false;
}

function setConfirmationPrepared() {
    if (debug_js_controller) {
        console.info('[form-change-flag] confirmation prepared!');
    }
    paymentConfirmationPrepared = true;
}

function displayStaticCustomerInfoAndNav(customerSignInArea)
{
    if ('undefined' !== typeof customerSignInArea) {
        if ('undefined' !== typeof customerSignInArea.staticCustomerInfo) {
            $('#static-customer-info-container').replaceWith(customerSignInArea.staticCustomerInfo);

            // Disable email field and hide password when somebody logged in
            $('.account-fields').find('.firstname, .lastname, .password, .email').hide();
            $('#thecheckout-login-form, .login-block-moved, #create_account, .form-group.dm_gdpr_active').hide();
            $('body').addClass('logged-in');
        }

        if ('undefined' !== typeof customerSignInArea.displayNav2) {
            var userInfoEl = null;
            if ($('#_desktop_user_info').length) {
                userInfoEl = $('#_desktop_user_info');
            } else if ($('.userinfo-selector.popup-over').length) {
                userInfoEl = $('.userinfo-selector.popup-over');
            } else if ($('#header .user-info').length) {
                userInfoEl = $('#header .user-info');
            } else if ($('.quick_login.dropdown_wrap').length) {
                userInfoEl = $('.quick_login.dropdown_wrap');
            }
            if (null !== userInfoEl) {
                userInfoEl.replaceWith(customerSignInArea.displayNav2);
            }
        }
    }
}

function _getExtraAccountParams() {
    // Extra fields added through hooks, tepmplate updates or JS injections
    var extraAccountAndAddressFields = $('.account-fields, .address-fields').find('input, select, textarea').not('.orig-field').not('.not-extra-field');
    var extraAccountParams = '';

    if (extraAccountAndAddressFields.length) {
        extraAccountAndAddressFields.each(function () {
            extraAccountParams += '&' + $(this).attr('name') + '=' + encodeURIComponent($(this).val());
        })
    }

    // Exceptions for certain modules, that hooks in checkout fields, but need field to be sent separately
    var extraAccountSeparateFields = $('#thecheckout-account [type=checkbox]').not('[name=optin]').not('[name=create-account]');

    if (extraAccountSeparateFields.length) {
        extraAccountSeparateFields.each(function () {
            if ($(this).is(':checked')) {
                extraAccountParams += '&' + $(this).attr('name') + '=' + encodeURIComponent($(this).val());
            }
        })
    }

    // allinonerewards sponsorship field support
    if ($('input[name=sponsorship]').length) {
        extraAccountParams += '&sponsorship=' + encodeURIComponent($('input[name=sponsorship]').val());
    }
    // Colissimo pick-up module
    if ($('[name=id_colissimo_pickup_point]').length) {
        extraAccountParams += '&id_colissimo_pickup_point=' + encodeURIComponent($('[name=id_colissimo_pickup_point]').val());
    }
    if ($('[name=colissimo_pickup_mobile_phone\\[full\\]]').length && 'undefined' !== typeof iti) {
        extraAccountParams += '&colissimo_pickup_mobile_phone[full]=' + encodeURIComponent(iti.getNumber());
    }
    if ($('[name=colissimo_is_mobile_valid]').length) {
        extraAccountParams += '&colissimo_is_mobile_valid=' + encodeURIComponent($('[name=colissimo_is_mobile_valid]').val());
    }
    // djtalbrazilianregister (CPF/CNPJ fields module)
    if ($('[name=document_type]').length && $('[name=document_number]').length) {
        $('input[name=document_type]:checked, input[name=document_number], input[name=rg], input[name=ie]').each( (key, item) => {
            extraAccountParams += '&' + $(item).attr('name') + '=' + encodeURIComponent($(item).val());
        });
    }
    // glsshipping module
    if ($('#parcel_codigo').length === 1) {
        extraAccountParams += '&parcel[codigo]=' + encodeURIComponent($('#parcel_codigo').val());
    }
    return extraAccountParams;
}

function modifyAccountAndAddress(triggerElement, callback) {
    var triggerSection = triggerElement.closest('.checkout-block').attr('id');
    // url - implicitly using current


    if ('prepare_confirmation' == triggerElement.attr('id')) {
        // after calling modifyAccountAndAddress($('#prepare_confirmation'), setConfirmationPrepared);
        triggerSection = 'thecheckout-prepare-confirmation';
        // Disable (silently) confirmation button
        $('[data-link-action=x-confirm-order]').prop('disabled', true).css('cursor', 'wait');

    } else if (paymentConfirmationPrepared && isMainConfirmationButton(triggerElement)) {
        // do not repeat Ajax request, if form wasn't modified since last data refresh and just call callback()
        if ("function" === typeof callback) {
            callback();
            return;
        }
    } else if (isSaveAccountOverlayConfirmation(triggerElement)) {
        showConfirmButtonLoader($('[data-link-action=x-save-account-overlay]'), true);
    } else {
        // Add loader (2nd param) only when confirmation button was pressed by user; otherwise, just disable button for a moment
        showConfirmButtonLoader($('[data-link-action=x-confirm-order]'), isMainConfirmationButton(triggerElement));
    }

    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        url: insertUrlParam('modifyAccountAndAddress'),
        type: 'POST',
        cache: false,
        dataType: "json",
        data: "modifyAccountAndAddress=1&ajax_request=1&action=modifyAccountAndAddress&trigger=" + triggerSection +
            "&account=" + serializeVisibleFields('form.account-fields') +
            "&invoice=" + encodeURIComponent($('#thecheckout-address-invoice form :visible').serialize()) +
            "&delivery=" + encodeURIComponent($('#thecheckout-address-delivery form :visible').serialize()) +
            "&passwordVisible=" + $('#thecheckout-account input[name=password]:visible').length +
            "&passwordRequired=" + $('#thecheckout-account input[name=create-account]:checked').length +
            "&invoiceVisible=" + $('#thecheckout-address-invoice form:visible').length +
            "&deliveryVisible=" + $('#thecheckout-address-delivery form:visible').length +
            dynamicToken() +
            _getExtraAccountParams(),
        success: function (jsonData) {

            var noErrors = true;
            // We can't clean all errors here, e.g. if we're updating delivery address only and have errors in invoice
            // this would clean also invoice errors (which we don't wont unless we update invoice address too)



            // Go through account, invoice and delivery errors, show them all
            if ("undefined" !== typeof jsonData.account && null !== jsonData.account) {
                blockSel = ':is(#thecheckout-account, #thecheckout-data-privacy, #thecheckout-psgdpr)';
                printContextErrors(blockSel, jsonData.account.errors);

                if (jsonData.account.hasErrors) {
                    if (debug_js_controller) {
                        var errMsg = formatErrors(jsonData.account.errors, triggerElement);
                        console.info('modifyAccountAndAddress: account has errros');
                        console.info(errMsg);
                    }

                    // account.errors could contain also firstname / lastname errors, in that case, we need to push this to
                    // invoice address error highlight also
                    var customerProps = ['firstname', 'lastname'];
                    var customerProp;
                    for (ci = 0; ci < customerProps.length; ci++) {
                        customerProp = customerProps[ci];
                        if ('undefined' !== typeof jsonData.account.errors &&
                            'undefined' !== typeof jsonData.invoice &&
                            null !== jsonData.invoice &&
                            'undefined' !== typeof jsonData.invoice.errors &&
                            '' != jsonData.account.errors[customerProp] &&
                            0 == $('.account-fields input[name='+customerProp+']:visible').length) {
                            jsonData.invoice.errors[customerProp] = jsonData.account.errors[customerProp];
                        }
                    }

                    noErrors = false;
                } else {
                    // Update token only when customer account ID or password is changed
                    if (debug_js_controller) {
                        console.info('account created, customerId=' + jsonData.account.customerId);
                        console.info('updating token from: ' + $('#thecheckout-account input[type=hidden][name=token]').val() + ', to: ' + jsonData.account.newToken);
                        console.info('isGuest?' + jsonData.account.isGuest);
                    }

                    displayStaticCustomerInfoAndNav(jsonData.customerSignInArea);

                    updateAccountToken(jsonData.account.newToken);
                    updateStaticToken(jsonData.account.newStaticToken);

                }
            }// End of jsonData.account handling

            if ("undefined" !== typeof jsonData.invoice && null !== jsonData.invoice) {
                blockSel = '#thecheckout-address-invoice';
                printContextErrors(blockSel, jsonData.invoice.errors, triggerElement);

                if (jsonData.invoice.hasErrors) {
                    if (debug_js_controller) {
                        var errMsg = formatErrors(jsonData.invoice.errors);
                        console.info('modifyAccountAndAddress: invoice has errros');
                        console.info(errMsg);
                    }
                    noErrors = false;
                }
            }

            if ("undefined" !== typeof jsonData.delivery && null !== jsonData.delivery) {
                blockSel = '#thecheckout-address-delivery';
                printContextErrors(blockSel, jsonData.delivery.errors, triggerElement);

                if (jsonData.delivery.hasErrors) {
                    if (debug_js_controller) {
                        var errMsg = formatErrors(jsonData.delivery.errors);
                        console.info('modifyAccountAndAddress: delivery has errros');
                        console.info(errMsg);
                    }
                    noErrors = false;
                }
            }

            // Handle states and refresh blocks regardless of errors status
            if ("thecheckout-address-invoice" === triggerSection || "thecheckout-address-delivery" === triggerSection) {
                var addressType = triggerSection.substring("thecheckout-address-".length);
                if ('undefined' !== typeof jsonData[addressType].states) {
                    handleStates($('[id=' + triggerSection + '] [name=id_state]'), jsonData[addressType].states);
                }
                if ('undefined' !== typeof jsonData[addressType].needZipCode) {
                    handlePostcode($('[id=' + triggerSection + '] [name=postcode]'), jsonData[addressType].needZipCode);
                }
                if ('undefined' !== typeof jsonData[addressType].needDni) {
                    handleNeedDni($('[id=' + triggerSection + '] [name=dni]'), jsonData[addressType].needDni);
                }
                if ('undefined' !== typeof jsonData[addressType].callPrefix) {
                    handleCallPrefix($('[id=' + triggerSection + '] [name^=phone]'), jsonData[addressType].callPrefix);
                }
            }

            updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);

            hideConfirmButtonLoader($('[data-link-action=x-confirm-order]'));
            hideConfirmButtonLoader($('[data-link-action=x-save-account-overlay]'));

            if ("undefined" !== typeof jsonData.shippingErrors && null !== jsonData.shippingErrors && "undefined" !== typeof jsonData.shippingErrors.errors) {
                var errorsTxt = jsonData.shippingErrors.errors.join(', ');
                $('<div class="error-msg shipping-errors">'+errorsTxt+'</div>').prependTo($('#thecheckout-shipping .inner-wrapper')).show();
                noErrors = false;
                showGlobalError();
            }

            if ('thecheckout-prepare-confirmation' == triggerSection) {
                $('[data-link-action=x-confirm-order]').prop('disabled', false).css('cursor', 'pointer');
            }

            if ("undefined" !== typeof jsonData && "undefined" !== typeof jsonData.cartQuantityError && jsonData.cartQuantityError) {
                noErrors = false;
                showGlobalError();
            }

            if (noErrors && "function" === typeof callback) {
                callback(jsonData);
            }

        }
    });
}

function signedInUpdateForm() {
    $('[data-link-action=x-sign-in], .forgot-password').hide();
    $('.successful-login.hidden').show();
    // simply reload the checkout page with new context; take care of cart/checkout redirection, do not display
    // cart summary again!
    window.location.reload();
}

function signIn() {
    // recover from (possible) previous login attempts
    $('#errors-login-form').slideUp();
    $('[data-link-action=x-sign-in]').prop('disabled', true).css('cursor', 'wait');

    // url - implicitly using current
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=signIn&" +
            $('#login-form').serialize() +
            dynamicToken(),
        success: function (jsonData) {

            $('[data-link-action=x-sign-in]').prop('disabled', false).css('cursor', 'pointer');

            if (jsonData.hasErrors) {

                var errMsg = formatErrors(jsonData.errors);

                $('#errors-login-form').html(errMsg).slideDown();

            } else {
                signedInUpdateForm();
            }

        }
    });
}

function deleteFromCart(data, self) {
    // AWP module support (also template - cart-detailed-product-line.tpl - modification is necessary!)
    var additionalData = '';
    if ('undefined' !== typeof data.deleteUrl) {
        var awpSpecialInstructions = data.deleteUrl.match('special_instructions.*');
        additionalData = (awpSpecialInstructions)?'&'+awpSpecialInstructions:'';
    }

    // Avanto an_productfields module support
    var anGroupId = $(self).attr('href').match('an_group_id.*');
    additionalData += (anGroupId)?'&'+anGroupId:'';
    
    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=deleteFromCart" +
            "&delete=1" +
            "&id_product=" + data["idProduct"] +
            "&id_product_attribute=" + data["idProductAttribute"] +
            "&id_customization=" + data["idCustomization"] +
            "&token=" + static_token + additionalData,
        success: function (jsonData) {

            updateCheckoutBlocks(jsonData, true, true, tc_updatePaymentWithShipping);

        }
    });
}

// Fill in states to combobox after address change/update
function handleStates(selectEl, states) {

    var oldVal = selectEl.val();
    //var shallResetPointer = selectEl.find('option:selected').index() > states.length;
    selectEl.children('option:not(:first)').remove();

    $.each(states, function (i, item) {
        if ("1" === item.active || 1 === item.active) {
            $(selectEl).append($('<option>', {
                value: item.id_state,
                text: item.name
            }));
        }
    });

    if (selectEl.find('option[value=' + oldVal + ']').length) {
        selectEl.val(oldVal);
    } else {
        selectEl.val(null);
    }


    if (states.length > 0) {
        selectEl.closest('.form-group').show();
    } else {
        selectEl.closest('.form-group').hide();
    }
}

// Show/hide postcode input field based on country selected
function handlePostcode(postcodeEl, needZipCode) {
    if (needZipCode) {
        postcodeEl.closest('.form-group').show();
    } else {
        postcodeEl.closest('.form-group').hide();
    }
}

// Show/hide DNI input field based on country selected (we'll done with CSS)
function handleNeedDni(dniEl, needDni) {
    if (needDni) {
        dniEl.closest('.form-group').addClass('need-dni').show();
    } else {
        dniEl.closest('.form-group').removeClass('need-dni');
    }
}

function handleCallPrefix(phoneFieldsEl, callPrefix) {

    phoneFieldsEl.each(function () {
        $(this).closest('label').find('.country-call-prefix').html('+' + callPrefix);

        if (debug_js_controller) {
            console.info($(this).attr('name') + ' prefix set to: +' + callPrefix);
        }
    });

}

function parseShippingMethods(shippingModulesList, html) {

    var parsers = {};
    var doParse = false;
    $.each(shippingModulesList, function (moduleName, deliveryOptionId) {
        if ("undefined" !== typeof checkoutShippingParser[moduleName]) {
            parsers[moduleName] = checkoutShippingParser[moduleName];

            if (
                "undefined" !== typeof parsers[moduleName].init_once ||
                "undefined" !== typeof parsers[moduleName].delivery_option ||
                "undefined" !== typeof parsers[moduleName].extra_content ||
                "undefined" !== typeof parsers[moduleName].all_hooks_content) {
                doParse = true;
            }

        }
    });

    if (doParse) {
        var parsed = $('<div id="shipping-parser-wrapper">' + html + '</div>');

        $.each(parsers, function (moduleName, parser) {

            // Call once per payment module
            if ("undefined" !== typeof parser.init_once) {
                parser.init_once($('.delivery-option.' + moduleName + ', .carrier-extra-content.' + moduleName, parsed));
            }

            // Call once per payment option (payment module may have multiple options)
            $('.delivery-option.' + moduleName, parsed).each(function (i, containerSelector) {
                if ("undefined" !== typeof parser['delivery_option']) {
                    parser['delivery_option']($(containerSelector));
                }
            });
            $('.carrier-extra-content.' + moduleName, parsed).each(function (i, containerSelector) {
                if ("undefined" !== typeof parser['extra_content']) {
                    parser['extra_content']($(containerSelector));
                }
            });

            if ("undefined" !== typeof parser.all_hooks_content) {
                //parser.all_hooks_content($('>*:last-child', parsed));
                parser.all_hooks_content(parsed);
            }

        });
        html = parsed.html();
    }

    return html;
}

function afterShippingLoadCallbacks(shippingModulesList, html, triggerElementName) {
    $.each(shippingModulesList, function (moduleName, shippingMethodId) {
        if ("undefined" !== typeof checkoutShippingParser[moduleName]) {
            if (
                "undefined" !== typeof checkoutShippingParser[moduleName].after_load_callback
            ) {
                //setTimeout(checkoutShippingParser[moduleName].after_load_callback, 200);
                deliveryOptionIds = shippingMethodId.map((x) => { return parseInt(x) });
                checkoutShippingParser[moduleName].after_load_callback(deliveryOptionIds);
            }
        }
    });
}

function afterPaymentLoadCallbacks(paymentModulesList, html, triggerElementName) {
    $.each(paymentModulesList, function (key, moduleName) {
        if ("undefined" !== typeof checkoutPaymentParser[moduleName]) {
            if (
                "undefined" !== typeof checkoutPaymentParser[moduleName].after_load_callback
            ) {
                //setTimeout(checkoutPaymentParser[moduleName].after_load_callback, 200);
                checkoutPaymentParser[moduleName].after_load_callback();
            }
        }
    });
}

function parsePaymentMethods(paymentModulesList, html, triggerElementName) {

    var parsers = {};
    var doParse = false;
    $.each(paymentModulesList, function (key, moduleName) {
        if ("undefined" !== typeof checkoutPaymentParser[moduleName]) {
            parsers[moduleName] = checkoutPaymentParser[moduleName];

            if (
                "undefined" !== typeof parsers[moduleName].init_once ||
                "undefined" !== typeof parsers[moduleName].container ||
                "undefined" !== typeof parsers[moduleName].additionalInformation ||
                "undefined" !== typeof parsers[moduleName].form ||
                "undefined" !== typeof parsers[moduleName].all_hooks_content) {
                doParse = true;
            }

        }
    });

    if (doParse) {
        var parsed = $('<div id="payments-parser-wrapper">' + html + '</div>')

        $.each(parsers, function (moduleName, parser) {

            // Call once per payment module
            if ("undefined" !== typeof parser.init_once) {
                parser.init_once($('.tc-main-title[data-payment-module=' + moduleName + ']', parsed), triggerElementName);
            }

            // Call once per payment option (payment module may have multiple options)
            $('.tc-main-title[data-payment-module=' + moduleName + '] .payment-option', parsed).each(function (i, containerSelector) {

                var optId = $(containerSelector).attr('id').slice(0, -10); // remove '-container' suffix

                // we need to prepare 3 selectors: container, additionalInformation, form
                var selectors = {
                    container: $(containerSelector),
                    additionalInformation: $(containerSelector).nextAll('[id*=' + optId + '-additional-information]'),
                    form: $(containerSelector).nextAll('[id*=' + optId + '-form]')
                };

                $.each(selectors, function (sectionName, element) {
                    if ("undefined" !== typeof parser[sectionName]) {
                        parser[sectionName](element, triggerElementName);
                    }
                });

                if ("undefined" !== typeof parser.all_hooks_content) {
                    //parser.all_hooks_content($('>*:last-child', parsed));
                    parser.all_hooks_content(parsed);
                }
            });
        });
        html = parsed.html();
    }


    return html;
}

var shippingBlockChecksum = 0;
var paymentBlockChecksum = 0;
var cartSummaryBlockChecksum = 0;

var shippingBlockElement = '';
var paymentBlockElement = '';
var cartSummaryBlockElement = '';
var invoiceAddressBlockElement = '';
var deliveryAddressBlockElement = '';

var deliveryOptionSelector = '[type=radio][name^=delivery_option]:checked';

function updateHtmlBlock(el, html) {
    el.html(html);
    if (debug_js_controller) {
        el.parent().addClass('debug-flash');
        setTimeout(function () {
            el.parent().removeClass('debug-flash');
        }, 3000);
    }
}

function highlightSelectedShippingMethod() {
    $('.delivery-option-row').removeClass('selected');
    var checkedEl = $('.delivery-options .shipping-radio [name^=delivery_option]:checked');
    if (checkedEl.length) {
        checkedEl.closest('.delivery-option-row').addClass('selected');
        checkedEl.closest('.delivery-options-list').addClass('shipping-selected');
    }
}

function highlightSelectedPaymentMethod() {
    $('.payment-options .tc-main-title').removeClass('selected');
    var checkedEl = $('.payment-options .tc-main-title .payment-option [name^=payment-option]:checked');
    if (checkedEl.length) {
        checkedEl.closest('.tc-main-title').addClass('selected');
        checkedEl.closest('#checkout-payment-step').addClass('payment-selected');
    }
}

function updateShippingBlock(shippingModulesList, html, checksum, triggerElementName) {
    if ('undefined' !== html && null !== html && shippingBlockChecksum != checksum) {
        html = parseShippingMethods(shippingModulesList, html);
        updateHtmlBlock(shippingBlockElement, html);
        shippingBlockChecksum = checksum;

        afterShippingLoadCallbacks(shippingModulesList, html, triggerElementName);

        // Hook to this:
        // prestashop.on('thecheckout_updateShippingBlock', function() { console.log('carriers updated!'); })
        prestashop.emit('thecheckout_updateShippingBlock', {
            reason: 'update',
        });

        // if force-country is enabled, and no country is selected, hide states
        if ($('<div id="shipping-parser-wrapper">' + html + '</div>').find('.force-country.disallowed').length)
        {
            $('.form-group.id_state').addClass('force-country-disallowed');
            if (config_force_customer_to_choose_country) {
                $('[name=id_country]:visible').trigger('change');
            }
        } else {
            $('.form-group.id_state').removeClass('force-country-disallowed');
        }

        // Some shipping modules are not extra carriers (in modules list), so we cannot parse
        // them based on their name and thus need general trick to trigger their JS methods.
        // E.g. packzkomaty (sensbitpaczkomatymap) needs to trigger radio button change in order
        // to display list of pickup points; Chronopost and Mondial relay need it as well
        // forceRefreshShipping: If ="1", it will always reload shipping methods, so we need to avoid triggering click to avoid endless loop
        if ($(deliveryOptionSelector).length && !payment.isConfirmationTrigger(triggerElementName) && !forceRefreshShipping) {
            $(deliveryOptionSelector).prop('checked', false).trigger('click');
            return true;
        } else {
            // when content of shipping html changes and collapse shipping is enabled, on confirmation it won't collapse again, so we need to call it here as well.
            highlightSelectedShippingMethod();
            return false;
        }
    } else {
        return false;
    }
    //return value says if shipping method's 'setDeliveryMethod' might have been called
}

function selectPaymentOption(optionId, paymentFee) {
    highlightSelectedPaymentMethod();
    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-cart-summary',
        url: insertUrlParam('selectPaymentOption'),
        type: 'POST',
        cache: false,
        dataType: "json",
        data: "optionId=" + optionId + "&payment_fee=" + paymentFee + "&ajax_request=1&action=selectPaymentOption" + "&token=" + static_token,
        success: function (jsonData) {
            updateCartSummaryBlock(jsonData.cartSummaryBlock, jsonData.cartSummaryBlockChecksum, jsonData.isVirtualCart);
        }
    });
}

// payment options is klarnapayments_pay_later_module, but payment module name is klarnapaymentsofficial
var doNotRefreshOnPaymentMethods = ['klarnapayments', 'pts_stripe', 'paypal_plus'];

function updatePaymentBlock(paymentModulesList, html, checksum, triggerElementName) {
    if ('undefined' !== html && null !== html && (paymentBlockChecksum != checksum || 'thecheckout-confirm' == triggerElementName)) {

        // Temporarily store: a/ selected payment method; b/ filled-in fields

        // get selected options prior to refresh; firstly try from data-module-name, if unavailable, try element id
        var selectedOption = payment.getSelectedOptionModuleName();

        if ("undefined" !== typeof selectedOption && "" !== selectedOption) {
            selectedOption = '[data-module-name=' + selectedOption + ']'; // select by module-name
        } else {
            selectedOption = payment.getSelectedOption();
            if ("undefined" !== typeof selectedOption && "" !== selectedOption) {
                selectedOption = '#' + payment.getSelectedOption(); // select by ID
            } else {
                selectedOption = "#none";
            }

        }

        // save payment form text input fields and select boxes, so we can restore them after hook update
        var payment_fields_values = {};
        // Shall be input[type=hidden] added here? It did not work with add_gopay_new
        // then, we need an exception: .not('[data-payment-module=add_gopay_new] input[type=hidden]')
        // Exception for hidden fields: input[name="issuer"] = mollie payments
        paymentBlockElement.find('input[type=text], select, input[name="issuer"], input[name="transferGateway"], form input[type=radio]:checked, textarea').each(function () {
            if ("undefined" !== typeof $(this).attr('id') && !$(this).is(':radio') && $(this).attr('name') !== 'pmethod') {
                payment_fields_values['[id=' + $(this).attr('id') + ']'] = $(this).val();
            } else if ("undefined" !== typeof $(this).attr('name')) {
                payment_fields_values['[name="' + $(this).attr('name') + '"]'] = $(this).val();
            }
        });

        // Store iframe payment forms, if they are already pre-filled and do not need to reload when user data changes
        // if ($('#thecheckout-payment #stripe-payment-form').length) {
        //   $('#payment_forms_persistence #stripe-payment-form').remove();
        //   $('#thecheckout-payment #stripe-payment-form').appendTo($('#payment_forms_persistence'));
        // }

        html = parsePaymentMethods(paymentModulesList, html, triggerElementName);

        // Make exception for some modules that init some code directly in payment hook
        var shallSkip = false;
        if (
            paymentBlockChecksum == checksum &&
            'thecheckout-confirm' == triggerElementName
        ) {
            $.each(doNotRefreshOnPaymentMethods, function (index, value) {
                if (selectedOption.match(value)) {
                    shallSkip = true;
                }
            });
        }

        if (shallSkip) {
            return;
        }

        updateHtmlBlock(paymentBlockElement, html);
        paymentBlockChecksum = checksum;

        afterPaymentLoadCallbacks(paymentModulesList, html, triggerElementName);

        prestashop.emit('thecheckout_updatePaymentBlock', {
            reason: 'update',
        });

        // restore payment for input and select fields values
        $.each(payment_fields_values, function (index, value) {
            if ($(index).is(':radio')) {
                $(index+'[value='+value+']').prop('checked', true);
            } else {
                $(index).val(value);
            }
        });

        // Special molliepayments update - where we need to restore not only input/select value, but also special <button> (which replaces dropdown)
        if ($('#mollie-issuer-dropdown-button').length && $('input[name="issuer"]').length && '' != $('input[name="issuer"]').val()) {
            var selectedMolliePayment = $('input[name="issuer"]').val(); 
            var aMollieEl = $('a[data-ideal-issuer='+selectedMolliePayment+']');
            if (aMollieEl.length) {
                $('#mollie-issuer-dropdown-button').text(aMollieEl.text());
            }
        }        
    }

    // Init PS Checkout render
    // This will happen always after appending the payment options HTML.
    // If this variable doesn't exist or is not true at this moment,
    // it means that ps_checkout is not loaded as module.
    // if (window.tc_ps_checkout.init) {
    //     window.ps_checkout.renderCheckout();
    // }

    var paymentBlockUpdated = false;

    // Reinit payments always, as there might have been no change in markup but we still need to update
    // COD amount in shopping cart
    if (!config_separate_payment) {
        payment.init(selectedOption, selectPaymentOption); // from file payment.js
        paymentBlockUpdated = true;
    }

    return paymentBlockUpdated;
}

function updateCartSummaryBlockAndRestoreInputs(cartSummaryBlockElement, html, activeQtyButtonCls, qtyControl) {
    updateHtmlBlock(cartSummaryBlockElement, html);
    // Restore focused input field, if any
    if ('undefined' !== typeof activeQtyButtonCls) {
        // Active element could be quantity up/down link
        $('[data-qty-control="' + qtyControl + '"] .' + activeQtyButtonCls).focus();
    } else {
        // or, input field
        if ('undefined' !== typeof jQuery && 'undefined' !== typeof jQuery.fn.putCursorAtEnd && $('[data-qty-control="' + qtyControl + '"] input').length)
            $('[data-qty-control="' + qtyControl + '"] input').putCursorAtEnd().focus();
    }
}

function updateCartSummaryBlock(html, checksum, isVirtualCart) {
    if ('undefined' !== html && null !== html && cartSummaryBlockChecksum != checksum) {

        // We try to store either focused or disabled input element (i.e. user was just making modifications there)
        // Later on, we'll try to re-focus.
        var activeEl = $(document.activeElement);
        var el = activeEl;
        if (el.is('.cart-line-product-quantity-up') || el.is('.cart-line-product-quantity-down')) {
            // Active element could be quantity up/down link
            var qtyControl = el.parent().data('qty-control');
            var activeQtyButtonCls = el.attr('class');
        } else if (el.is('input.cart-line-product-quantity')) {
            var qtyControl = el.parent().data('qty-control');
        } else {
            el = $('input.cart-line-product-quantity:disabled');
            var qtyControl = el.parent().data('qty-control');
        }



        // ! This is async, and with error message, we need sync information about error, so we need to disable
        // refresh_minicart temporarily if we observe .error-msg in cart summary
        if (config_refresh_minicart && !$(html).find('.error-msg').length) {
            prestashop.on('updatedCart', function () {
                updateCartSummaryBlockAndRestoreInputs(cartSummaryBlockElement, html, activeQtyButtonCls, qtyControl);
            });
            // For Panda themes, 'updatedCart' event is not being emitted; instead 'stUpdatedCart' is.
            prestashop.on('stUpdatedCart', function () {
                updateCartSummaryBlockAndRestoreInputs(cartSummaryBlockElement, html, activeQtyButtonCls, qtyControl);
            });
        } else {
            updateCartSummaryBlockAndRestoreInputs(cartSummaryBlockElement, html, activeQtyButtonCls, qtyControl);
        }

        $('.cart-total-weight>.value').html(cartTotalWeight + ' kg');

        // Hook to this:
        // prestashop.on('thecheckout_updateCart', function() { console.log('cart updated!'); })
        if ('undefined' !== typeof prestashop && 'undefined' !== typeof  prestashop.emit) {
            prestashop.emit('thecheckout_updateCart', {
                reason: 'update',
            });
        }

        cartSummaryBlockChecksum = checksum;

        if ("undefined" !== typeof isVirtualCart && isVirtualCart === true) {
            $('body').addClass('is-virtual-cart');
        } else {
            $('body').removeClass('is-virtual-cart');
        }
    }
}

function updateAddressBlock(addressType, html, htmlAddressDropdown) {
    if ('undefined' !== html && null !== html) {
        if ("invoice" === addressType) {
            updateHtmlBlock(invoiceAddressBlockElement, html);
        } else {
            updateHtmlBlock(deliveryAddressBlockElement, html);
        }
        if (typeof tc_reInitGooglePlaces === 'function') { tc_reInitGooglePlaces(); }
    }
    if ('undefined' !== htmlAddressDropdown && null !== htmlAddressDropdown) {
        if ("invoice" === addressType) {
            deliveryAddressBlockElement.find('.customer-addresses').replaceWith(htmlAddressDropdown);
        } else {
            invoiceAddressBlockElement.find('.customer-addresses').replaceWith(htmlAddressDropdown);
        }
    }

    // Hook to this:
    // $(document).on('thecheckout_Address_Modified', function(event, { addressType }) {
    //     console.log('Address modified!', addressType);
    // });
    $(document).trigger('thecheckout_Address_Modified', { addressType });
    promoteBusinessAndPrivateFields();
    setAddressFieldsCountryCSS();
}

var cartTotalWeight = 0; // will be changed in updateCheckoutBlocks and then used in updateCartSummaryBlock

function updateCheckoutBlocks(jsonData, updateSummary, updateShipping, updatePayment) {
    if ("undefined" !== typeof jsonData.emptyCart && jsonData.emptyCart === true) {
        $('body').addClass('is-empty-cart');
        // if ("undefined" !== typeof prestashop && "undefined" !== typeof prestashop.urls) {
        //   location.href = prestashop.urls.base_url;
        // } else {
        //   location.href = 'index.php';
        // }
    }

    if ("undefined" !== typeof jsonData.minimalPurchaseError && jsonData.minimalPurchaseError === true) {
        $('#confirm_order .minimal-purchase-error-msg').html(jsonData.minimalPurchaseMsg);
        $('#confirm_order').addClass('minimal-purchase-error');
    } else {
        $('#confirm_order').removeClass('minimal-purchase-error');
    }
    var shippingBlockUpdated = false;
    var paymentBlockUpdated = false;

    if ('undefined' !== typeof updateShipping && updateShipping) {
        shippingBlockUpdated = updateShippingBlock(jsonData.externalShippingModules, jsonData.shippingBlock, jsonData.shippingBlockChecksum, jsonData.triggerElementName);
    }

    // When shipping block is updated, it triggers setDeliveryMethod which will re-update payment methods
    // one more time; so it's not necessary to updatePayments initially, only when shipping block did not update
    if (('undefined' !== typeof updatePayment && updatePayment) || !shippingBlockUpdated) {
        paymentBlockUpdated = updatePaymentBlock(jsonData.paymentMethodsList, jsonData.paymentBlock, jsonData.paymentBlockChecksum, jsonData.triggerElementName);
    }
    // update cart summary block only when updateShipping is not set (because update shipping would call update summary)
    if ('undefined' !== typeof updateSummary && updateSummary && !paymentBlockUpdated && !shippingBlockUpdated) {
        updateCartSummaryBlock(jsonData.cartSummaryBlock, jsonData.cartSummaryBlockChecksum, jsonData.isVirtualCart);
    }
    cartTotalWeight = jsonData.totalWeight;
}

function getShippingAndPaymentBlocks() {
    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-shipping, #thecheckout-payment, #thecheckout-cart-summary',
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=getShippingAndPaymentBlocks" + "&token=" + static_token,
        success: function (jsonData) {

            updateCheckoutBlocks(jsonData, true, true, false);

        }
    });
}

function toggleGiftMessage() {
    if ($('.order-options #gift.in').length) {
        $('.order-options #gift').slideUp('fast', function () {
            $(this).removeClass('in').removeClass('show');
        });
    } else {
        $('.order-options #gift').slideDown('fast', function () {
            $(this).addClass('in show')
        });
    }
}

function selectDeliveryOption(deliveryForm) {

    highlightSelectedShippingMethod();
    // To support mondial relay v3.0+, allow a bit of time for widget markup appear in extra content
    setTimeout(function () {
        var selectedDeliveryOptionExtra = $(deliveryOptionSelector).closest('.delivery-option-row').next('.carrier-extra-content');
        $('.carrier-extra-content').not(selectedDeliveryOptionExtra).hide();
        if (selectedDeliveryOptionExtra.height()) {
            selectedDeliveryOptionExtra.slideDown();
        }
    }, 100);

    // url - implicitly using current
    $.ajax({
        customPropAffectedBlocks: '#thecheckout-cart-summary, #thecheckout-payment',
        url: insertUrlParam('selectDeliveryOption'),
        type: 'POST',
        cache: false,
        dataType: "json",
        data: deliveryForm.serialize() + "&selectDeliveryOption=1&ajax_request=1&action=selectDeliveryOption" + "&token=" + static_token,
        success: function (jsonData) {
            prestashop.emit('thecheckout_updateDeliveryOption', {
                reason: 'update',
            });
            $('#thecheckout-shipping .error-msg').hide();
            updateCheckoutBlocks(jsonData, true, (forceRefreshShipping ? true : false), true);
            // highlightSelectedShippingMethod();
            checkAndHideGlobalError();
        }
    });
}

function setDeliveryMessage() {
    // url - implicitly using current
    $.ajax({
        type: 'POST',
        url: removeUrlParams(),
        cache: false,
        dataType: "json",
        data: 'delivery_message=' + encodeURIComponent($('#delivery_message').val()) + "&ajax_request=1&action=setDeliveryMessage" + "&token=" + static_token,
        success: function (jsonData) {
            // No action necessary, we just set it on backend to checkout_session
        }
    });
}
