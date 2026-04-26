/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */
//console.info('back.js loaded');

(function ($) {
    $.fn.fixMe = function () {
        return this.each(function () {
            var $this = $(this),
                $t_fixed;

            function init() {
                $this.wrap('<div class="container" />');
                $t_fixed = $this.clone();
                $t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
                resizeFixed();
            }

            function resizeFixed() {
                $t_fixed.find("th").each(function (index) {
                    $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
                });
            }

            function scrollFixed() {
                var offset = $(this).scrollTop(),
                    tableOffsetTop = $this.offset().top,
                    tableOffsetBottom = tableOffsetTop + $this.height() - $this.find("thead").height();
                if (offset < tableOffsetTop || offset > tableOffsetBottom)
                    $t_fixed.hide();
                else if (offset >= tableOffsetTop && offset <= tableOffsetBottom && $t_fixed.is(":hidden"))
                    $t_fixed.show();
            }

            $(window).resize(resizeFixed);
            $(window).scroll(scrollFixed);
            init();
        });
    };
})(jQuery);

function dataUpdate() {
    var sortedObject = sortable('table.address-fields tbody', 'serialize');
    var json = JSON.stringify(sortedObject[0].container, null, 2);
    $('#TC_invoice_fields').val(json).trigger('change');
    json = JSON.stringify(sortedObject[1].container, null, 2);
    $('#TC_delivery_fields').val(json).trigger('change');
}

function customerFieldsUpdate() {
    var sortedObject = sortable('table.customer-fields tbody', 'serialize');
    var json = JSON.stringify(sortedObject[0].container, null, 2);
    $('#TC_customer_fields').val(json).trigger('change');
}

function extend(obj, src) {
    Object.keys(src).forEach(function (key) {
        obj[key] = src[key];
    });
    return obj;
}

function disableDetailsOnVisibilityChange() {
    $('input[name=visible]').on('change', function () {
        if ($(this).is(':checked')) {
            $(this).closest('tr').find('input').not('[name=visible]').not('[type=hidden]').attr('disabled', false);
        } else {
            $(this).closest('tr').find('input').not('[name=visible]').not('[type=hidden]').attr('disabled', true);
        }
    });
}

function updateLeftRightRatioPct(left_right_ratio) {
    $('.checkout-block-container.left legend').attr('data-content', ' [' + left_right_ratio + '%]');
    $('.checkout-block-container.right legend').attr('data-content', ' [' + (100 - left_right_ratio) + '%]');
}

function expandBlocksClasses() {
    $('.checkout-block-item > [name=classes], .block-classes-info').toggle();
    // Disable drag&drop on input fields, inside of .checkout-block-items
    $('.checkout-block-item').on('mousedown', 'input', function () {
        $(this).parent('.checkout-block-item').attr('draggable', false);
    })
    $('.checkout-block-item').mouseover(function () {
        $(this).attr('draggable', true);
    })
}

var blocksLayoutSortableObject;

function initSortableContainers() {
    blocksLayoutSortableObject = sortable('.checkout-block-sortable-container', {
        placeholderClass: 'ph-class',
        items: '.checkout-block-item',
        hoverClass: 'hvr-class',
        forcePlaceholderSize: true,
        acceptFrom: '.checkout-block-sortable-container',
        containerSerializer: function (serializedContainer) {

            var serialized = {};
            var classes = null;
            var gridPosition = $(serializedContainer.node).closest('.checkout-block-container').find('legend').text();
            $.each($(serializedContainer.node).find('.checkout-block-item'), function () {
                classes = $(this).find('[name=classes]').val();
                blockName = $(this).find('[name=blockName]').val();
                serialized[blockName] = classes
            });
            var result = [];
            result[gridPosition] = serialized;
            return result;
        }
    });
    for (var i = 0; i < blocksLayoutSortableObject.length; i++) {
        blocksLayoutSortableObject[i].addEventListener('sortupdate', blocksLayoutDataUpdate2);
    }
}

function blocksLayoutDataUpdate2() {
    // var sortedObject = sortable('.checkout-block-sortable-container', 'serialize');
    // var layout = {};
    // for (var i = 0; i < 4; i++) {
    //   layout = extend(layout, sortedObject[i].container);
    // }
    // json = JSON.stringify(layout, null, 2);
    // $('#TC_blocks_layout').val(json);

    var layout = {};
    layout = traverseBlocksTree($('.blocks-layout.top-level > .checkout-block-container'));
    var json = JSON.stringify(layout, null, 2);
    // console.info(json);
    $('#TC_blocks_layout').val(json).trigger('change');
}

var inner_area = '\
    <div class="inner-area">\
      <a class="split split-vertical" title="Split Vertical"></a>\
      <a class="split split-horizontal" title="Split Horizontal"></a>\
      <a class="remove-split" title="Remove this section"></a>\
      <div class="checkout-block-sortable-container" aria-dropeffect="move"></div>\
    </div>';
var new_fieldset_html = '<fieldset class="checkout-block-container">' + inner_area + '</fieldset>';

function splitTwoBlocks(splitElements, direction) {

    //var instanceKey = splitElements.map(function() { return $(this).attr('id'); }).toArray().join(':');
    var elements = splitElements.toArray();
    var instance = Split(elements, {
        minSize: 50,
        sizes: [
            Math.round(elements[0].dataset.defaultSize),
            100 - Math.round(elements[0].dataset.defaultSize)
        ],
        direction: direction,
        elementStyle: function (dimension, size, gutterSize) {
            return {
                'flex-basis': 'calc(' + size + '% - ' + gutterSize + 'px)'
            }
        },
        onDragStart: function () {
            var isizes = instance.getSizes();
            $(elements[0]).prepend('<span class="size-display">' + Math.round(isizes[0]) + '%</span>');
            $(elements[1]).prepend('<span class="size-display">' + Math.round(isizes[1]) + '%</span>');
            $(elements).addClass('resizing');
        },
        onDrag: function () {
            var isizes = instance.getSizes();
            $(elements[0]).find(".size-display").text(Math.round(isizes[0]) + '%');
            $(elements[1]).find(".size-display").text(Math.round(isizes[1]) + '%');
        },
        onDragEnd: function () {
            $(elements[0]).find(".size-display").remove();
            $(elements[1]).find(".size-display").remove();
            $(elements).removeClass('resizing');
            blocksLayoutDataUpdate2();
        }
    });

    // set instances from both sides, for easier deletion
    var ii = 0;
    splitElements.each(function () {
        split_instances[$(this).attr('id')] = {instance: instance, position: ii++};
    });

}

function splitCheckoutBlockContainer(thisEl, direction) {
    // direction = 'vertical' or 'horizontal'
    var thisContainer = thisEl.closest('.checkout-block-container');
    var thisInnerArea = thisContainer.find('.inner-area');
    thisContainer.prepend(
        '<div class="flex-split-' + direction + '"> ' +
        '<fieldset class="checkout-block-container ' + (('horizontal' === direction) ? 'left' : 'top') + '" data-default-size="50"></fieldset>' +
        new_fieldset_html +
        '</div>'
    );
    thisContainer.find('.checkout-block-container').first().prepend(thisInnerArea);

    $('.checkout-block-container').uniqueId();

    splitTwoBlocks(thisContainer.find('.checkout-block-container'), direction);

    initSortableContainers();
    blocksLayoutDataUpdate2();
    return false;
}

function removeEmptyContainer(thisEl) {
    var thisContainer = thisEl.closest('.checkout-block-container');

    // Allow remove container only on empty containers
    if (thisContainer.find('.checkout-block-item').length) {
        alert('This container is not empty, please move all blocks to another container and then try again');
        return;
    }

    split_instances[thisContainer.attr('id')]['instance'].destroy();
    var splitParent = thisContainer.parent().closest('.checkout-block-container');
    // one of 2 is deleted
    thisContainer.remove();
    // the other one is promoted to higher level
    var siblingContainerHtml = splitParent.find('.checkout-block-container').html();
    splitParent.html(siblingContainerHtml);

    initSortableContainers();
    blocksLayoutDataUpdate2();
}

var jtl = $('.blocks-layout.top-level > .checkout-block-container');

var containersTree = {};

function traverseBlocksTree(checkoutBlockContainerNode) {
    var result = {};
    checkoutBlockContainerNode.children('[class^=flex-split], .inner-area').each(function () {
        // console.info($(this));
        if ('flex-split-horizontal' === $(this).attr('class') ||
            'flex-split-vertical' === $(this).attr('class')) {
            result[$(this).attr('class')] = [
                traverseBlocksTree($(this).children('.checkout-block-container').eq(0)),
                traverseBlocksTree($(this).children('.checkout-block-container').eq(1))
            ];
        } else {
            var blocks = $(this).find('.checkout-block-sortable-container .checkout-block-item');
            var blocks_res = [];
            var block_detail = {};
            blocks.each(function () {
                block_detail[$(this).find('.block-name').text()] = $(this).find('[name=classes]').val();
                blocks_res.push(block_detail);
                block_detail = {};
            });
            result['blocks'] = blocks_res;
        }
        // Update size of actual container in JSON generated code
        var split_instance = split_instances[$(this).closest('.checkout-block-container').attr('id')];
        if ("undefined" !== typeof split_instance) {
            result['size'] = split_instance['instance'].getSizes()[split_instance['position']];
        } else {
            result['size'] = 100;
        }

    });
    return result;
}

var split_instances = {};

function fontChangeHandler($fontNameEl) {

    var fontName = $fontNameEl.val().replace(/\+/g, '-');
    var weightOptionsName = 'font-weight-' + fontName;

    var weightOptionsStr = $('[name=' + weightOptionsName + ']').val();

    if ('undefined' !== typeof weightOptionsStr) {
        var weightOptions = weightOptionsStr.split(',');

        for (var i = 0, len = weightOptions.length; i < len; i++) {
            var weightValues = weightOptions[i].split(' ');
            // console.info(weightValues);
        }

        var selectEl = $('#TC_fontWeight');
        var oldVal = selectEl.val();

        selectEl.children().remove();

        $.each(weightOptions, function (i, item) {

            var weightValues = weightOptions[i].split(' ');

            $(selectEl).append($('<option>', {
                value: $.trim(weightValues[1]),
                text: $.trim(weightValues[0]) + ' ' + $.trim(weightValues[1])
            }));

            /* try to set reasonable default, first try old value, then 400, 500, 300, and fallback to first (=default action) */
            if (selectEl.find('option[value=' + oldVal + ']').length) {
                selectEl.val(oldVal);
            } else if (selectEl.find('option[value=400]').length) {
                selectEl.val(400);
            } else if (selectEl.find('option[value=500]').length) {
                selectEl.val(500);
            } else if (selectEl.find('option[value=300]').length) {
                selectEl.val(300);
            }

        });
    }
}

function resetDefaultConfiguration(resetActionName) {
    $.ajax({
        type: 'POST',
        cache: false,
        dataType: "json",
        data: "&ajax_request=1&action=" + resetActionName,
        success: function (jsonData) {
            location.reload();
        }
    });
}

function setSilentRegistrationState(makeInactive) {
    if (makeInactive) {
        $('[name=TC_register_guest_on_blur]').closest('.form-group').addClass('inactive');
    } else {
        $('[name=TC_register_guest_on_blur]').closest('.form-group').removeClass('inactive');
    }
}

function setBusinessFieldsState(makeInactive) {
    if (makeInactive) {
        $('[name=TC_business_fields]').closest('.form-group').addClass('inactive');
        $('[name=TC_business_disabled_fields]').closest('.form-group').addClass('inactive');
    } else {
        $('[name=TC_business_fields]').closest('.form-group').removeClass('inactive');
        $('[name=TC_business_disabled_fields]').closest('.form-group').removeClass('inactive');
    }
}

function setPrivateFieldsState(makeInactive) {
    if (makeInactive) {
        $('[name=TC_private_fields]').closest('.form-group').addClass('inactive');
        $('[name=TC_private_disabled_fields]').closest('.form-group').addClass('inactive');
    } else {
        $('[name=TC_private_fields]').closest('.form-group').removeClass('inactive');
        $('[name=TC_private_disabled_fields]').closest('.form-group').removeClass('inactive');
    }
}

function setPaymentRelatedOptions(makeInactive) {
    if (makeInactive) {
        $('[name=TC_default_payment_method], [name=TC_payment_required_fields]').closest('.form-group').addClass('inactive');
        $('.checkout-block-item > .payment.block-name').addClass('inactive');
    } else {
        $('[name=TC_default_payment_method], [name=TC_payment_required_fields]').closest('.form-group').removeClass('inactive');
        $('.checkout-block-item > .payment.block-name').removeClass('inactive');
    }
}

function setStepsState(makeInactive) {
    if (makeInactive) {
        $('.config-step-wrapper .form-group, #set-steps-sample').addClass('inactive');
    } else {
        $('.config-step-wrapper .form-group, #set-steps-sample').removeClass('inactive');
    }
}

function setForceEmailOverlay(makeInactive) {
    if (makeInactive) {
        $('[name=TC_force_email_overlay]').closest('.form-group').addClass('inactive');
    } else {
        $('[name=TC_force_email_overlay]').closest('.form-group').removeClass('inactive');
    }
}

function setHash(hash) {
    if ("onhashchange" in window) {
        window.location.hash = '#' + hash;
        // $(window).trigger('hashchange');
    }
    var newFormAction = $('#module_form').attr('action').replace(/(#.*)?$/, '#' + hash);
    $('#module_form').attr('action', newFormAction);
}

function setConfigTabs() {
    $('#module_form > .panel').addClass('collapsed')

    $('#content').off('click.tabs').on('click.tabs', '#tab-handles > div', function() {
        var panelId = $(this).data('section-id');
        $('#module_form > .panel').addClass('collapsed');
        $('#'+panelId).removeClass('collapsed');
        $('#tab-handles > div').removeClass('highlighted');
        $(this).addClass('highlighted');
        setHash(panelId);
        // setTimeout(function() { window.scrollTo({ top: 0, left: 0, behavior: 'smooth'}) }, 100);
    })


    $('.page-head:first').append('<div id="tab-handles"></div>')
    $('#module_form > .panel').each(function() {
        var label = $.trim($(this).find('.panel-heading').text());
        $('#tab-handles').append('<div data-section-id="'+$(this).attr('id')+'">'+label+'</div>');
    })

    if (window.location.hash && window.location.hash.match(/^#fieldset_/)) {
        var sectionId = window.location.hash.replace(/^#/, '');
        $('[data-section-id=' + sectionId + ']').click();
        // console.log('>> hash', window.location.hash);
    } else {
        $('#tab-handles > div:first').click();
    }
}

// ===============================================================================
// READY
// ===============================================================================

$(document).ready(function () {

    sortable('.customer-fields tbody', {
        items: "tr",
        placeholderClass: 'ph-class',
        hoverClass: 'hvr-class',
        forcePlaceholderSize: true,
        handle: '.js-handle',
        containerSerializer: function (serializedContainer) {

            var serialized = {};
            var width = null;
            $.each(serializedContainer.node.children, function () {
                width = $(this).find('[name=width]').val();
                serialized[$(this).find('[name=field-name]').val()] = {
                    'visible': $(this).find('[name=visible]').is(':checked'),
                    'required': $(this).find('[name=required]').is(':checked'),
                    'width': (isNaN(parseInt(width)) || width < 0 || width > 100) ? 100 : width
                }
            });
            return serialized;
        }
    });
    sortable('.customer-fields tbody')[0].addEventListener('sortupdate', customerFieldsUpdate);

    $('.customer-fields input').on('change', customerFieldsUpdate);


    sortable('.address-fields tbody', {
        items: "tr",
        // placeholder: "<tr><td colspan=\"4\"><span class=\"center\">The row will appear here</span></td></tr>",
        placeholderClass: 'ph-class',
        hoverClass: 'hvr-class',
        forcePlaceholderSize: true,
        handle: '.js-handle',
        containerSerializer: function (serializedContainer) {

            var serialized = {};
            var width = null;
            $.each(serializedContainer.node.children, function () {
                width = $(this).find('[name=width]').val();
                serialized[$(this).find('[name=field-name]').val()] = {
                    'visible': $(this).find('[name=visible]').is(':checked'),
                    'required': $(this).find('[name=required]').is(':checked'),
                    'width': (isNaN(parseInt(width)) || width < 0 || width > 100) ? 100 : width,
                    'live': $(this).find('[name=live]').is(':checked')
                }
            });
            return serialized;
        }
    });
    sortable('.address-fields tbody')[0].addEventListener('sortupdate', dataUpdate);
    sortable('.address-fields tbody')[1].addEventListener('sortupdate', dataUpdate);

    $('.address-fields input').on('change', dataUpdate);

    $('.js-handle').on('mouseover', function () {
        $(this).closest('tr').addClass('is-hover');
    }).on('mouseout', function () {
        $(this).closest('tr').removeClass('is-hover');
    });

    disableDetailsOnVisibilityChange();

    initSortableContainers();

    $('.checkout-block-container input').on('change', blocksLayoutDataUpdate2);

    // set unique-id for every block that can be part of splitting
    $('.checkout-block-container').uniqueId();

    $('[class^=flex-split]').each(function () {
        splitTwoBlocks($(this).children('.checkout-block-container'), $(this).attr('class').substring("flex-split-".length));
    });


    // new sub-blocks will be left-right
    $(document).on('click', '.split-horizontal', function () {
        return splitCheckoutBlockContainer($(this), 'horizontal');
    });

    // new sub-blocks will be top-bottom
    $(document).on('click', '.split-vertical', function () {
        return splitCheckoutBlockContainer($(this), 'vertical');
    });

    $(document).on('click', '.remove-split', function () {
        return removeEmptyContainer($(this));
    });

    // Initial font-weight selection set-up
    fontChangeHandler($('#TC_font'));

    $('#TC_font').on('change', function () {
        fontChangeHandler($(this));
    });

    $(document).on('click', '.reset-link', function () {
        // thecheckout_reset_conf_for is set in hookDisplayBackOfficeHeader()
        var retVal = confirm(thecheckout_reset_conf_for + " [" + $(this).data('section') + '] ?');
        if (retVal == true) {
            resetDefaultConfiguration($(this).data('action'));
        }
    });

    //$('#TC_social_login_google_on, #TC_social_login_btn_style').closest('.form-group').before('<div class="config-sep"></div>');

    // thecheckout_video_tutorial, thecheckout_video_tutorial_sub1 are set in hookDisplayBackOfficeHeader()
    $('#TC_social_login_fb_app_id').closest('.form-group').before('<label class="control-label col-lg-4"> </label><div class="col-lg-6 howto fb-api"><a target="_blank" href="//theonetechnologies.com/blog/post/how-to-get-facebook-application-id-and-secret-key"><span class="video-tutorial">' + thecheckout_video_tutorial + ':</span> ' + thecheckout_video_tutorial_sub1 + '</a></div>');
    $('#TC_social_login_google_client_id').closest('.form-group').before('<label class="control-label col-lg-4"> </label><div class="col-lg-6 howto google-api"><a target="_blank" href="//theonetechnologies.com/blog/post/how-to-get-google-app-client-id-and-client-secret"><span class="video-tutorial">' + thecheckout_video_tutorial + ':</span> ' + thecheckout_video_tutorial_sub2 + '</a></div>');
    $('#TC_google_maps_api_key').closest('.form-group').before('<label class="control-label col-lg-4"> </label><div class="col-lg-6 howto google-api"><a target="_blank" href="//developers.google.com/maps/documentation/javascript/get-api-key"><span class="video-tutorial">' + thecheckout_video_tutorial + ':</span> ' + thecheckout_tutorial_maps_api + '</a></div>');

    // $('.tinymce-on-demand').closest('.translatable-field').parent().closest('.form-group').find('.control-label').append('<div class="init-html-editor-container"><span class="init-on-demand-html-editor">' + thecheckout_init_html_editor + '</span></div>');
    $('.tinymce-on-demand').closest('.form-group:not(.translatable-field)').find('.control-label').append('<div class="init-html-editor-container"><span class="init-on-demand-html-editor">' + thecheckout_init_html_editor + '</span></div>');

    $('.form-group').on('click', '.init-on-demand-html-editor', function () {
        $(this).closest('.form-group').addClass('about-to-init-tinymce');
        tinySetup({selector: '.about-to-init-tinymce .tinymce-on-demand', forced_root_block: ''});
        $(this).closest('.form-group').removeClass('about-to-init-tinymce');
        $(this).fadeOut();
    });

    setSilentRegistrationState($('[name=TC_force_email_overlay]:checked').val());
    $(document).on('change', '[name=TC_force_email_overlay]', function () {
        setSilentRegistrationState($('[name=TC_force_email_overlay]:checked').val());
    });
    setBusinessFieldsState(!$('[name=TC_show_i_am_business]:checked').val() && !$('[name=TC_show_i_am_business_delivery]:checked').val());
    $(document).on('change', '[name^=TC_show_i_am_business]', function () {
        setBusinessFieldsState(!$('[name=TC_show_i_am_business]:checked').val() && !$('[name=TC_show_i_am_business_delivery]:checked').val());
    });
    setPrivateFieldsState(!$('[name=TC_show_i_am_private]:checked').val() && !$('[name=TC_show_i_am_private_delivery]:checked').val());
    $(document).on('change', '[name^=TC_show_i_am_private]', function () {
        setPrivateFieldsState(!$('[name=TC_show_i_am_private]:checked').val() && !$('[name=TC_show_i_am_private_delivery]:checked').val());
    });
    setPaymentRelatedOptions($('[name=TC_separate_payment]:checked').val());
    $(document).on('change', '[name=TC_separate_payment]', function () {
        setPaymentRelatedOptions($('[name=TC_separate_payment]:checked').val());
    });

    function isPasswordRequired() {
        let isPasswordRequired = JSON.parse($('#TC_customer_fields').val()).password.required;
        return isPasswordRequired;
    }

    setForceEmailOverlay(isPasswordRequired());
    $(document).on('change', '#customer_fields [name=required]', function () {
        setForceEmailOverlay(isPasswordRequired());
    });


    // Fix for big header on config page
    window.onscroll = function () {
        scrollFunction()
    };

    function scrollFunction() {
        if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
            $('.bootstrap .page-head').addClass('scrolled');
        } else {
            $('.bootstrap .page-head').removeClass('scrolled');
        }
    }

    $('#module_form input, #module_form select, #module_form textarea').on('change', function () {
        // $('#module_form_submit_btn').addClass('floating-save');
        // $('[id^=module_form_submit_btn_]').fadeOut(3000);
    });

    $('[data-toggle="tooltip"]').tooltip();

    console.log('ready called');
    [1,2,3,4].forEach(function(i){
        $('.form-group.config-step-'+i).wrapAll('<div class="config-step-wrapper" data-step="' + i + '" />')
    });

    setStepsState(!$('[name=TC_checkout_steps]:checked').val());
    $(document).on('change', '[name=TC_checkout_steps]', function () {
        setStepsState(!$('[name=TC_checkout_steps]:checked').val());
    });

    setConfigTabs();
    setTimeout(function() { $('.bootstrap .module_confirmation').fadeOut(1000); }, 2000);

    // create 'increment CSS/JS cache version' button
    $('#TC_ps_css_cache_version').closest('.form-group').before('' +
        '<div class="form-group">' +
        '<label class="control-label col-lg-4">Increment CSS/JS cache version</label>' +
        '<div class="col-lg-6"><a class="btn btn-default" id="increment_css_js_cache">CSS/JS cache version + 1</a>' +
        '</div>' +
        '</div>');

    $('body').off('click.inc').on('click.inc', '#increment_css_js_cache', function() {
        $('#TC_ps_css_cache_version').val(parseInt($('#TC_ps_css_cache_version').val()) + 1);
        $('#TC_ps_js_cache_version').val(parseInt($('#TC_ps_js_cache_version').val()) + 1);
        $(this).closest('form').submit();
    });

    $('body').off('click.steps').on('click.steps', '#set-steps-sample a', function() {
        var retVal = confirm($(this).attr('data-confirm-msg'));
        if (retVal === true) {
            $('#TC_blocks_layout').val('{  "flex-split-vertical": [    {      "blocks": [        {          "login-form": ""        }      ],      "size": 50    },    {      "flex-split-vertical": [        {          "flex-split-horizontal": [            {              "blocks": [                {                  "shipping": ""                },                {                  "payment": ""                },                {                  "account": ""                },                {                  "address-delivery": "no-header"                },                {                  "address-invoice": ""                },                {                  "order-message": ""                }              ],              "size": 60            },            {              "blocks": [                {                  "cart-summary": "sticky"                }              ],              "size": 40            }          ],          "size": 50        },        {          "flex-split-vertical": [            {              "flex-split-horizontal": [                {                  "blocks": [],                  "size": 60                },                {                  "blocks": [                    {                      "data-privacy": ""                    },                    {                      "psgdpr": ""                    },                    {                      "newsletter": ""                    },                    {                      "confirm": ""                    }                  ],                  "size": 40                }              ],              "size": 50            },            {              "blocks": [                {                  "html-box-1": ""                },                {                  "html-box-2": ""                },                {                  "html-box-3": ""                },                {                  "html-box-4": ""                },                {                  "required-checkbox-1": ""                },                {                  "required-checkbox-2": ""                }              ],              "size": 50            }          ],          "size": 50        }      ],      "size": 50    }  ],  "size": 100}');
            $('#TC_checkout_steps_on').prop('checked', true);
            $('[id^=TC_step_label_1_]').val('Nákupní košík');
            $('#TC_step_blocks_1').val('cart-summary');
            $('[id^=TC_step_label_2_]').val('Doprava a platba');
            $('#TC_step_blocks_2').val('shipping,payment,cart-summary');
            $('[id^=TC_step_label_3_]').val('Dodací údaje');
            $('#TC_step_blocks_3').val('login-form,account,newsletter,psgdpr,data-privacy,address-invoice,address-delivery,order-message,confirm,cart-summary');
            $('#TC_step_validation_3').val('$(\'.payment-options [name=payment-option]:checked\').length > 0 && $(\'.delivery-options [name^=delivery_option]:checked\').length > 0 && ((typeof tc_confirmOrderValidations?.shaim_shipping_modules === \'function\') ? tc_confirmOrderValidations?.shaim_shipping_modules() : true)');
            $('[id^=TC_step_validation_error_3_]').val('Prosím zvolte způsob přepravy a platby');
            $('#TC_custom_css').val($('#TC_custom_css').val() + '\n\n/* Steps sample */\n' + '.checkout-step-1 .checkout-area-4 {\n  display: block;\n}\n\n:is(.checkout-step-2, .checkout-step-3) #shaim_crosseling_17 {\n  display: none;\n}\n\nmain, .st-container, .st-content, .st-content-inner {\n  overflow: visible;\n}\n\n.checkout-step-1 .cart-summary-line.please-select-shipping {\n  display: none;\n}\n');
            $('#TC_compact_cart_on').prop('checked', true);
            $(this).closest('form').submit();
        }
    });

    if (typeof thecheckout_available_layout_blocks !== "undefined") {
        $('[id^=TC_step_blocks_]').selectize({
            maxItems: null,
            valueField: 'id',
            labelField: 'title',
            searchField: 'title',
            options: JSON.parse(thecheckout_available_layout_blocks),
            create: false,
            plugins: ["remove_button"]
        });
    }

    if (typeof thecheckout_available_address_fields !== "undefined") {
        $('#TC_business_fields, #TC_business_disabled_fields, #TC_private_fields, #TC_shipping_required_fields, #TC_payment_required_fields').selectize({
            maxItems: null,
            valueField: 'id',
            labelField: 'title',
            searchField: 'title',
            options: JSON.parse(thecheckout_available_address_fields),
            create: false,
            plugins: ["remove_button"]
        });
    }
});
