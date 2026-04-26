/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

var payment = (function () {

    var self = this;

    self.confirmationSelector = '#tc-payment-confirmation';
    self.paymentSelector = '#payment-section';
    self.conditionsSelector = '#conditions-to-approve';
    self.conditionAlertSelector = '.js-alert-payment-conditions';
    self.additionalInformationSelector = '.js-additional-information';
    self.optionsForm = '.js-payment-option-form';
    self.saveAccountOverlay = $('.save-account-overlay');
    self.confirmationButton = $('#tc-payment-confirmation #confirm_order');


    function init(selectedOption, selectPaymentOptionCallback) {

        self.selectPaymentOptionCallback = selectPaymentOptionCallback;

        if (debug_js_controller) {
            console.info('payment.js parsing re-init');
        }

        $(self.paymentSelector + ' input[type="checkbox"][disabled]').attr('disabled', false);

        if ("undefined" !== typeof selectedOption) {
            setSelectedOption(selectedOption);
            prestashop.emit('thecheckout_setSelectedPaymentOption', {
                reason: 'update',
            });
        }

        var $body = $('body');

        // $body.on('change', self.conditionsSelector + ' input[type="checkbox"]', $.proxy(self.toggleOrderButton, self));
        $body.off('change.payments').on('change.payments', 'input[name="payment-option"]', $.proxy(toggleOrderButton, self));
        // $body.on('click', self.confirmationSelector + ' button', $.proxy(self.confirm, self));

        toggleOrderButton();

        /* stripe_official uses button click handler directly, no necessary with thecheckout module. */
        $('#tc-payment-confirmation button').off('click');

        $('#tc-payment-confirmation > #payment_binaries').html('');
        $('.js-payment-binary').appendTo($('#tc-payment-confirmation > #payment_binaries'));

    }

    function collapseOptions(selectedOption) {
        $(self.additionalInformationSelector + ', ' + self.optionsForm).not(selectedOption).stop().hide();
    }

    function getSelectedOption() {
        return $('input[name="payment-option"]:checked').attr('id');
    }

    function setSelectedOption(selectedOption) {
        if (0 == $(selectedOption).length) {
            // Only now try to select by default set in checkout options
            // Changed to 'starts with' selector, e.g. paypal module has data-module-name=paypal_plus
            selectedOption = '[data-module-name^=' + config_default_payment_method + ']';
        }
        if (0 == $(selectedOption).length) {
            selectedOption = '.' + config_default_payment_method + ' [name=payment-option]:first';
        }

        return $(selectedOption).eq(0).prop('checked', true);
    }

    function getSelectedOptionModuleName() {
        return $('input[name="payment-option"]:checked').data('moduleName')
    }

    function hideConfirmation() {
        $(this.confirmationSelector).hide();
    }

    function showConfirmation() {
        $(this.confirmationSelector).show();
    }

    function hideSaveAccountOverlay() {
        self.saveAccountOverlay.addClass('hidden');
    }

    function showSaveAccountOverlay() {
        self.saveAccountOverlay.removeClass('hidden');
    }

    function parsePrice(text) {
        var price = 0;
        if ('undefined' !== typeof text) {
            price = Number(text.replace(',', '.').replace(/[^0-9\.]+/g, ""));
        }
        return price;
    }

    function isPopupPaymentType(option) {
        return $('#' + option).hasClass('popup-payment')
    }

    function shallRemoveSubmitBtn(option) {
        return $('#' + option).hasClass('remove-submit-btn')
    }

    function toggleOrderButton() {

        $('#thecheckout-payment .error-msg').hide();
        checkAndHideGlobalError();

        var selectedOption = getSelectedOption();

        var selectedAdditionalInfoSelector = '#' + selectedOption + '-additional-information';
        var selectedPaymentFormSelector = '#pay-with-' + selectedOption + '-form';
        var selectedPaymentFeeSelector = '#' + selectedOption + '-fee';

        if (isPopupPaymentType(selectedOption)) {
            // Attention, side effect; this will make .js controller believe there's no 'form' selector
            // for selected payment method and thus it won't appear (which is desired action)
            selectedPaymentFormSelector = '#no-selected-option';
        }

        collapseOptions(selectedAdditionalInfoSelector + ',' + selectedPaymentFormSelector);

        if ($(selectedAdditionalInfoSelector).height()) {
            $(selectedAdditionalInfoSelector).slideDown();
        }

        if ($(selectedPaymentFormSelector).height()) {
            $(selectedPaymentFormSelector).slideDown();
        }

        $('.js-payment-binary').hide();
        if ($('#' + selectedOption).hasClass('binary')) {
            // For binary payment modules, show save-account-overlay:
            // 20.1.2019 - disabled right now, we'll be solving this by replacing main order confirmation button with
            // binary content (Atos, Sagepay)
            /*
            var additionalInformationEl = $('.binary').closest('.payment-option').parent().next('.additional-information');
            if (additionalInformationEl.length) {
              additionalInformationEl.prepend(self.saveAccountOverlay);
              self.saveAccountOverlay.removeClass('hidden');
            }
            */
        } else {
            showConfirmation();
            self.saveAccountOverlay.addClass('hidden');
        }
        // Check if there's Fee set by TheCheckout or Legacy fee modules

        var feeAmount = 0;

        var feeEl = $(selectedPaymentFeeSelector);
        if (feeEl.length) {
            var feeAmount = parsePrice(feeEl.text());
            if (feeAmount.isNan) {
                feeAmount = 0;
            }
        }

        self.selectPaymentOptionCallback(selectedOption, feeAmount);
    }

    function getPaymentOptionSelector(option) {
        var moduleName = $('#' + option).data('module-name').replace(/-\d+/,'');

        return '.js-payment-' + moduleName;
    }

    function showBinary(option, dont_remove_confirmation_button = false) {
        var paymentOption = getPaymentOptionSelector(option);
        $(paymentOption).slideDown();
        if (!dont_remove_confirmation_button) {
            self.confirmationButton.hide();
        }
    }

    function hideBinary() {
        self.confirmationButton.show();
        $('#payment_binaries .js-payment-binary').hide();
    }

    function openPopupPayment(option) {
        var selectedPaymentFormSelector = '#pay-with-' + option + '-form';
        var selectedPaymentAdditionalInformationSelector = '#' + option + '-additional-information';
        var popupContainer = $('.popup-payment-content');
        var paymentMethodName = $(selectedPaymentFormSelector).closest('.tc-main-title').attr('data-payment-module');
        popupContainer.attr('data-payment-module', '');
        if ('undefined' !== typeof paymentMethodName) {
            popupContainer.attr('data-payment-module', paymentMethodName);
        }
        // Attach loader; through CSS transition, height is animated with delay, so let's immediately change height
        // and let CSS take care of smooth delay / remove curtain
        popupContainer.prepend(tc_loaderHtml);

        // todo: remove after new stripe_official version
        setTimeout(function () {
            $('.popup-payment-content .tc-ajax-loading').css('height', 0);
            $('.popup-payment-content .tc-ajax-loading').hide();
        }, 1000);

        // Some modules, e.g. checkout.com does disable confirmation button once clicked, and it won't be re-enabled
        // automatically, so let's take care of that
        $('.popup-payment-content').off('click.reenable').on('click.reenable', '#payment-confirmation button.btn', function(el) {
            setTimeout( function() {
                $(el.currentTarget).removeClass('disabled');
            }, 1000)
        })

        var popupPaymentForm = popupContainer.find('.popup-payment-form');
        if (shallRemoveSubmitBtn(option)) {
            popupContainer.find('.popup-payment-button').hide();
        } else {
            popupContainer.find('.popup-payment-button').show();
        }
        popupPaymentForm.html('');
        $(selectedPaymentFormSelector).show().appendTo(popupPaymentForm);
        if ($(selectedPaymentAdditionalInformationSelector).not('.popup-notice').length) {
            $(selectedPaymentAdditionalInformationSelector).show().appendTo(popupPaymentForm);
        }
        // Update 'pay-amount' on action button
        if ('undefined' !== typeof prestashop.cart &&
            'undefined' !== typeof prestashop.cart.totals &&
            'undefined' !== typeof prestashop.cart.totals.total_including_tax) {
            $('#payment-confirmation .pay-amount').html(prestashop.cart.totals.total_including_tax.value);
        }

        // E.g. Amazon is disabling confirmation button, and it can remain disabled also for other payment methods
        // so let's re-enable it
        $('.popup-payment-button button[type=submit]').prop('disabled', false);

        // try to load popup library again (if it's not yet; on some themes, $.fn.paymentpopup method was discarded between initial call and now)
        loadPaymentPopupLibrary(function() {
            popupContainer.paymentpopup({
                onopen: function () {
                    popupCallback(paymentMethodName)
                },
                onclose: function() {
                    popupCloseCallback(paymentMethodName);
                    if ($('.popup-payment-button ~ #payment_binaries').length) {
                        $('.popup-payment-button ~ #payment_binaries').appendTo($('#tc-payment-confirmation'));
                    }
                    hideBinary();
                },
                autoopen: true,
                opacity: 0.75,
                blur: false,
                escape: false,
                closeelement: '.popup-payment-content .popup-close-icon, #ps_checkout-card-buttons-container button[type=submit]'
            });
        });

        // if popup payment is also binary (ps_checkout or amazonpay for instance), let's replace confirmation button
        if ($('#' + option).hasClass('binary')) {
            // var confirmation_container = $('.popup-payment-button #payment-confirmation');
            // confirmation_container.html('');
            // var data_mod_name = $('#' + option).attr('data-module-name');
            // $('.js-payment-binary.js-payment-'+data_mod_name).appendTo(confirmation_container);
            //confirmation_container.find('.js-payment-binary').show();

            $('.popup-payment-button').after($('#payment_binaries'));
            $('#payment-confirmation').hide();
            showBinary(option, true);

            // var paymentOption = getPaymentOptionSelector(option);
            //
            // setTimeout(function() {
            //     $('.popup-payment-button #payment-confirmation').html($(paymentOption));
            //     $(paymentOption).show();
            // }, 2000);
        } else {
            $('#payment-confirmation').show();
        }
    }

    function popupCallback(paymentMethodName) {
        if ('undefined' !== typeof checkoutPaymentParser[paymentMethodName]
            && 'undefined' !== typeof checkoutPaymentParser[paymentMethodName].popup_onopen_callback) {
            console.info('popup open callback for ' + paymentMethodName + ' called');
            checkoutPaymentParser[paymentMethodName].popup_onopen_callback();
        }
    }

    function popupCloseCallback(paymentMethodName) {
        if ('undefined' !== typeof checkoutPaymentParser[paymentMethodName]
            && 'undefined' !== typeof checkoutPaymentParser[paymentMethodName].popup_onclose_callback) {
            console.info('popup close callback for ' + paymentMethodName + ' called');
            checkoutPaymentParser[paymentMethodName].popup_onclose_callback();
        }
    }

    function confirm() {
        var option = getSelectedOption();
        if (option) {
            if (isPopupPaymentType(option)) {
                if (debug_js_controller) {
                    console.info('opening popup payment for: ' + option);
                }
                openPopupPayment(option);

            } else if ($('#' + option).hasClass('binary')) {
                // Do not confirm form, rather replace "Confirm my order" with binary content; maybe highlight it a bit
                // Also take care of replacing it back in case of any modification in address, shipping, payment
                if (debug_js_controller) {
                    console.info('binary payment confirmation for: ' + option);
                }
                showBinary(option);
            } else {
                if (debug_js_controller) {
                    console.info('standard redirect/submit payment for: ' + option);
                }
                setTimeout(function () {
                    $('#pay-with-' + option + '-form form').submit();
                }, 1000);
                //$('#pay-with-' + option + '-form form').submit();
            }
        }
    }

    // Shared routines, used in parsers
    // private
    function loadPaymentPopupLibrary(callback) {
        if ('undefined' === typeof $.fn.paymentpopup) {
            $.getScript(tcModuleBaseUrl + '/lib/jquery.popupoverlay.min.js', callback);
        } else {
            callback();
        }
    }

    // public
    function isConfirmationTrigger(triggerElementName) {
        return ('undefined' !== typeof triggerElementName && 'thecheckout-confirm' === triggerElementName);
    }

    function setPopupPaymentType(element, removeSubmitBtn) {
        loadPaymentPopupLibrary(function (data, textStatus, jqxhr) {});
        element.find('input[name=payment-option]').addClass('popup-payment');
        if ('undefined' !== typeof removeSubmitBtn && removeSubmitBtn) {
            element.find('input[name=payment-option]').addClass('remove-submit-btn');
        }
    }

    return {
        init: init,
        confirm: confirm,
        getSelectedOption: getSelectedOption,
        getSelectedOptionModuleName: getSelectedOptionModuleName,
        hideSaveAccountOverlay: hideSaveAccountOverlay,
        showSaveAccountOverlay: showSaveAccountOverlay,
        hideBinary: hideBinary,
        parsePrice: parsePrice,
        isConfirmationTrigger: isConfirmationTrigger,
        setPopupPaymentType: setPopupPaymentType
    }

}());


