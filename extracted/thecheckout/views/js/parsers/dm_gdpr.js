/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

if (!$('.form-group.password:visible').length) {
    $('#thecheckout-account .form-group.dm_gdpr_active').hide();
}

$('.form-group.dm_gdpr_active label').addClass('required');

tc_confirmOrderValidations['dm_gdpr'] = function() {
  $('.form-group.dm_gdpr_active .error-msg').remove();
  if (
      $('.form-group.dm_gdpr_active input[type=checkbox]:visible').length  &&
      !$('.form-group.dm_gdpr_active input[type=checkbox]').is(':checked')
  ) {
    $('.form-group.dm_gdpr_active label').after('<div class="field error-msg">'+i18_requiredField+'</div>');
    scrollToElement($('.form-group.dm_gdpr_active'));
    return false;
  } else {
    return true;
  }
}


 