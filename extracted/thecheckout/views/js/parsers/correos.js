/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

checkoutShippingParser.correos = {
  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-correos.js] init_once()');
    }
  },

  correos_init: function () {
    // Select the node that will be observed for mutations
    var targetNode = document.getElementsByClassName('carrier-extra-content correos')[0];

    // Options for the observer (which mutations to observe)
    var config = {attributes: true, childList: false, subtree: false};

    var alreadyInit = false;

    // Callback function to execute when mutations are observed
    var callback = function (mutationsList, observer) {
      if (!alreadyInit) {
        for (var i = 0; i < mutationsList.length; i++) {
          var mutation = mutationsList[i];
          if (mutation.type == 'childList') {
            console.log('A child node has been added or removed.');
          } else if (mutation.type == 'attributes' && $(targetNode).is(":visible") && !alreadyInit) {
            console.log('The ' + mutation.attributeName + ' attribute was modified.');
            Correos.checkOfficeContent();
            alreadyInit = true;
            break;
            observer.disconnect();
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-correos.js] delivery_option()');
    }


    // Init Correos map widget
    element.after("<script>checkoutShippingParser.correos.correos_init();</script>");
  },

  extra_content: function (element) {
  }

}
