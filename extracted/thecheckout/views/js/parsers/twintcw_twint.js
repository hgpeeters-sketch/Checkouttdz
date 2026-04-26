/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutPaymentParser.twintcw_twint = {

  form: function (element) {

    // handlers re-attach when called this emit event
    // we just need to ensure this is called *after* markup modification
    var additional_script_tag = "<script> \
    	$(document).ready(function() { prestashop.emit('steco_event_updated')}); \
      ";
    element.append(additional_script_tag); 
  }

}


