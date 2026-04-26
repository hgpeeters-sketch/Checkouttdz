/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* 
   ***** INSTALLATION OF einvoicingprestalia + TheCheckout module *****

   Please refer to readme_EN.pdf and manually add this code to template /modules/thecheckout/views/templates/front/block/address-invoice.tpl at the end of <section class="form-fields">:

  {block name='form_field'}
      {widget name="einvoicingprestalia"}
  {/block}

*/

tc_confirmOrderValidations['einvoicingprestalia'] = function() {
  
  if (installedModules['einvoicingprestalia']) {

    var einvoicingprestalia_requried_fields = new Array('prestalia_pec', 'prestalia_sdi');
    var einvoicingprestalia_errors = {};

    $.each(einvoicingprestalia_requried_fields, function(index, einvoicingprestalia_field_name) 
    {
      
        if (
                $('[name='+einvoicingprestalia_field_name+']').length && 
                (
                    '' == jQuery.trim($('[name='+einvoicingprestalia_field_name+']').val()) ||
                    (
                        jQuery.trim($('[name='+einvoicingprestalia_field_name+']').val()).length <7 ||
                        jQuery.trim($('[name='+einvoicingprestalia_field_name+']').val()).length >7
                    )
                ) &&
                $('[name='+einvoicingprestalia_field_name+']').closest('.form-group').find('.required:visible').length
            )
        {
            einvoicingprestalia_errors[einvoicingprestalia_field_name] = i18_sdiLength;
        }

    });

    if (!$.isEmptyObject(einvoicingprestalia_errors)) {
      printContextErrors('#thecheckout-address-invoice', einvoicingprestalia_errors);
      return false;
    } else {
      return true;
    }

  }//if (installedModules['einvoicingprestalia'])

  return true;
}//tc_confirmOrderValidations

checkoutShippingParser.einvoicingprestalia = {
  init_once: function (elements) {

  },

  delivery_option: function (element) {

  },

  extra_content: function (element) {
  }

}
