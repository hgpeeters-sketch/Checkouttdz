/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.upsservice = {

    after_load_callback: function(deliveryOptionIds) {
        if ("undefined" !== typeof ups_path) {
            $.getScript(tcModuleBaseUrl + '/../upsservice/views/js/map.js'); 
        }
    }

}

