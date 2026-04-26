/*
 * NOTICE OF LICENSE
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 * @author    Peter Sliacky (Zelarg)
 * @copyright Peter Sliacky (Zelarg)
 * @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 * Copyright (c) 2021-2022
 */

var debug_steps = true

// Returns true if any block in the given step has rendered HTML content.
// Used to auto-skip steps that are empty for the current user (e.g., the account
// step is empty for guests because those fields are embedded inside address-delivery).
function stepHasContent(stepId) {
    if (typeof tc_steps === 'undefined' || !tc_steps) {
        return true;
    }
    var stepConfig = null;
    for (var i = 0; i < tc_steps.length; i++) {
        if (tc_steps[i].step === stepId) { stepConfig = tc_steps[i]; break; }
    }
    if (!stepConfig) {
        return true;
    }
    var blocks = stepConfig.blocks.split(',');
    for (var b = 0; b < blocks.length; b++) {
        var $innerArea = $('#thecheckout-' + blocks[b].trim() + ' .inner-area');
        if ($innerArea.length && $.trim($innerArea.html()).length > 0) {
            return true;
        }
    }
    return false;
}

function validateStep(stepId) {
    // $('.delivery-options input[name^=delivery_option]:checked').length
    // $('input[name="payment-option"]:checked').length
    if (debug_steps) {
        console.log('validateStep(' + stepId + ')');
    }
    if (typeof tc_steps !== 'undefined' && tc_steps) {
        var validationFunc = tc_steps.find(x => x.step === stepId)?.validation;
        if (debug_steps) {
            console.log('validationFunc is', validationFunc);
        }
        if (typeof validationFunc === 'function') {
            return validationFunc();
        }
    }

    return true
}

function _showStep(stepId) {
    stepId = parseInt(stepId)

    if (!validateStep(stepId)) {
        var errorMessage = tc_steps.find(x => x.step === stepId)?.errorMsg;
        // coreJquery.Toast(i18_validationError, errorMessage, "error", { has_progress: true, timeout: 3000 })
        Toastify({
            text: errorMessage,
            className: "steps-toast",
            close: true,
            duration: 3000,
            gravity: "bottom",
        }).showToast();
        // return one step back
        if (stepId > 1) {
            setHash(stepId - 1)
        }
        return;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (debug_steps) {
        console.log('showStep(' + stepId + ')');
    }
    $('body#checkout').removeClass((function (index, className) {
        return (className.match (/(^|\s)checkout-step-\S+/g) || []).join(' ');
    })).addClass('checkout-step-'+stepId);

    $('.prev-next-container .step-back').attr('data-step', (stepId -1));
    $('.prev-next-container .step-continue').attr('data-step', (stepId + 1));

    $('.prev-next-container').removeClass('first-step').removeClass('last-step');
    var numberOfSteps = $('#checkout-step-btn-container > .checkout-step-btn').length;
    if (stepId == 1) {
        $('.prev-next-container').addClass('first-step')
    }
    if (stepId == numberOfSteps) {
        $('.prev-next-container').addClass('last-step')
    }
}

function setHash(hash) {
    // User wishes to 'continue shopping'
    if (hash == 0) {
        window.location.href = document.referrer;
        return;
    }
    var base_url = window.location.href.replace(/#.*$/,'');
    window.history.pushState({}, "", base_url + '#' + hash);
    _showStep(hash);
}

$(document).ready(function () {

    // Top navigation
    $('body').off('click.checkoutstep').on('click.checkoutstep', '.checkout-step-btn', function () {
        setHash($(this).attr('data-step-id'));
    });

    // Bottom buttons
    $('body').off('click.checkoutstepcontinue').on('click.checkoutstepcontinue', '.step-back, .step-continue', function () {
        setHash($(this).attr('data-step'));
    });

    if ("onhashchange" in window) {
        if (debug_steps) {
            console.info('register hashchange');
        }
        $(window).on('hashchange', function () {
            var hash = window.location.hash.replace(/^#/, '');
            // console.info('hashchange - ' + hash);
            //if (visible_step != hash) {
            if (!isNaN(hash)) _showStep(hash);
            //}
        });
    }

    var initStep = location.hash.substring(1);

    if (initStep == '') {
        // Find the first step that has rendered content; skip empty steps (e.g., the
        // account step when its fields have been moved into address-delivery for guests).
        var startStep = 1;
        if (typeof tc_steps !== 'undefined' && tc_steps) {
            for (var i = 0; i < tc_steps.length; i++) {
                if (stepHasContent(tc_steps[i].step)) {
                    startStep = tc_steps[i].step;
                    break;
                }
            }
        }
        setHash(startStep);
    } else {
        // window.location.hash = '';
        setHash(initStep);
    }

});

