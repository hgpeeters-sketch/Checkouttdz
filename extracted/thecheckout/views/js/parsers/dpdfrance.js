/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

/* Compatibility check with dpdfrance v6.1.3, on 31.3.2023 */
/* (!) README
  dpdfrance requires logged-in user (multiple places, getCurrentRelaisDatasSearchAndRelaisList(), checkAjaxAuthValidity(), so make following changes:
  1/ In checkout module configuration, enable 'Show "Save" button in Personal Info'
  2/ In modules/dpdfrance/dpdfrance.php, add to hookDisplayAfterCarrier method condition, like this:

    public function hookDisplayAfterCarrier(array $params)
    {
        // Break if customer ID is not yet set
        if (!$this->context->customer->id) {
            return;
        }
        ...
 */

checkoutShippingParser.dpdfrance = {

  init_once: function (elements) {
    if (debug_js_controller) {
      console.info('[thecheckout-dpdfrance.js] init_once()');
    }
    if (elements && elements.length) {
      $(elements[0]).append(' \
      <script> \
        $(document).ready( \
           checkoutShippingParser.dpdfrance.on_ready \
        ); \
      </script> \
      ');
    }
  },

  on_ready: function() {
    if (typeof dpdFranceDisplayMethodBlock !== 'function') {
      return;
    }

    dpdFranceDisplayMethodBlock();

    /**
     * Handle relay points behavior on click and register relau points delivery address
     */
    $('#dpdfrance_relais_point_table').on('click', 'tr.dpdfrance_lignepr', function(event) {
      dpdFranceRegisterPudo($(this).data("relayId"));
      event.preventDefault();
    });

    /**
     * [ALL DELIVERY OPTIONS] EVENT LISTENER
     * If the delivery option has changed
     */
    document.querySelectorAll("input[name*='delivery_option[']").forEach(function(element) {
      element.addEventListener("change", function() {
        uncheckAllDeliveryOptions();
        element.setAttribute('checked', 'checked');
        dpdFranceDisplayMethodBlock();
      });
    });

    /**
     * PREDICT
     */
    let predictBlock = document.querySelector('#div_dpdfrance_predict_block');
    if (predictBlock) {
      /**
       * Validate the format of the phone number, if empty return empty value else display number and error message
       */
      let gsmNumbersFormatValidation = new RegExp(/^[\+]?[(]?[0-9]{0,3}[)]?[-\s\.]?[0-9]{0,3}[-\s\.]?[0-9]+$/,'im');
      let gsmBasicFormatValidation = new RegExp(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/,'im');

      // let selectedAddressId = $("article.address-item.selected").attr('id').replace('id-address-delivery-address-', '');

      let selectedAddressId = 0;
      let customerAddresses = Object.keys(prestashop.customer.addresses);
      if (customerAddresses && customerAddresses.length) {
        selectedAddressId = customerAddresses[0];
      }

      let predictGsmButton = $("#dpdfrance_predict_gsm_button");
      let predictError = $("#dpdfrance_predict_error");
      let gsmFormatError = false;

      let gsmDeliveryMobilePhone = '' // dpdfranceGetGsmFromSelectedAddress(selectedAddressId);

      dpdfrance_checkGSM(document.querySelector("input#input_dpdfrance_predict_gsm_dest"));

      // if (gsmDeliveryMobilePhone && gsmDeliveryMobilePhone !== false) {
      //   gsmDeliveryMobilePhone = gsmDeliveryMobilePhone.replace(/\s+/g, '');
      //   if (gsmNumbersFormatValidation.test(gsmDeliveryMobilePhone)) {
      //     if (!gsmBasicFormatValidation.test(gsmDeliveryMobilePhone)) {
      //       gsmFormatError = true;
      //     } else {
      //       /**
      //        * The validation process continues only if the shipping method is predict
      //        */
      //       let gsmShippingMethod = $("input[name*='delivery_option[']:checked");
      //       //Check if the selected input element exist
      //       if (gsmShippingMethod.length === 0) {
      //         console.log("Veuillez sélectionner une methode de livraison");
      //       } else {
      //         let gsmShippingMethodValue = gsmShippingMethod.val().slice(0, -1);
      //         if (gsmShippingMethodValue === dpdfrancePredictCarrierId) {
      //           dpdfrance_checkGSM(gsmDeliveryMobilePhone);
      //         }
      //       }
      //     }
      //   } else {
      //     gsmFormatError = true;
      //   }
      // } else {
      //   gsmFormatError = true;
      //   gsmDeliveryMobilePhone = '';
      // }

      /**
       * Display error message if gsm number is incorrect
       */
      if (gsmFormatError) {
        predictGsmButton.css('background-color', '#424143');
        predictGsmButton.html('>');
        predictError.show();

        //Prevent disabling the order button if the gsm number is not provided when not using the predict carrier
        let predictBlockDisplay = $("#div_dpdfrance_predict_block").css('display');
        if (predictBlockDisplay !== 'none') {
          dpdFranceHandleOrderButtonStatus(false);
        }
      }

      /**
       * ? Assign phone number to Predict block input phone number
       */
      // document.querySelector("input[name='dpdfrance_predict_gsm_dest']").value = gsmDeliveryMobilePhone;

      /**
       * If click on confirm address, assign phone number to predict input field
       * TODO: not working perfectly
       */
      // document.querySelector('button[name="confirm-addresses"]').addEventListener('click', ()=>{
      //       document.querySelector("input[name='dpdfrance_predict_gsm_dest']").value = gsmDeliveryMobilePhone;
      //     }
      // );

      /**
       * [PREDICT] EVENT LISTENER
       * On the key press in the Predict block phone number input field, check the phone number
       */
      $('body').on('keyup', "input#input_dpdfrance_predict_gsm_dest", function() {
        dpdfrance_checkGSM($(this).get(0));
      });
      // document.querySelector("input#input_dpdfrance_predict_gsm_dest").addEventListener('keyup', ()=>{
      //       dpdfrance_checkGSM();
      //     }
      // );
    }
  },

  delivery_option: function (element) {
    if (debug_js_controller) {
      console.info('[thecheckout-dpdfrance.js] delivery_option()');
    }
  },

  extra_content: function (element) {
  }

}