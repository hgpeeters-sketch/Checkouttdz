{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

{block name='shipping_options'}
  <div class="block-header shipping-method-header">{l s='Shipping Method' d='Shop.Theme.Checkout'}</div>
  <div class="inner-wrapper">
    <div class="error-msg">{l s='Please select a shipping method' mod='thecheckout'}</div>
    {if isset($shipping_payment_blocks_wait_for_selection) && $shipping_payment_blocks_wait_for_selection}
      <div class="dummy-block-container disallowed force-country">
        <span>{l s='Please choose delivery country to see shipping options' mod='thecheckout'}</span></div>
    {elseif isset($shipping_block_wait_for_address) && $shipping_block_wait_for_address|count}
      <div class="dummy-block-container disallowed">
        <span>{l s='First, please enter your: ' mod='thecheckout'}
          <ul>
            {foreach $shipping_block_wait_for_address as $field_name}
              <li>{$field_name}</li>
            {/foreach}
          </ul>
        </span>
      </div>
    {elseif isset($force_email_wait_for_enter) && $force_email_wait_for_enter}
      <div class="dummy-block-container disallowed">
        <span>{l s='Please enter your email to see shipping options' mod='thecheckout'}</span></div>
    {elseif isset($wait_for_account) && $wait_for_account}
      <div class="dummy-block-container disallowed">
        <span>{l s='Please Save your Personal Info to see shipping options' mod='thecheckout'}</span></div>
    {else}
      {if isset($shippingAddressNotice) && $shippingAddressNotice|count}
        <div class="shipping-address-notice">{l s='Shipping Address' d='Shop.Theme.Checkout'}: <span
                  class="country-name">{$shippingAddressNotice|join:', '}</span></div>
      {/if}
      <div id="hook-display-before-carrier">
        {$hookDisplayBeforeCarrier nofilter}
      </div>
      <div class="delivery-options-list">
        {if $delivery_options|count}
          <form
                  class="clearfix"
                  id="js-delivery"
                  data-url-update="{url entity='order' params=['ajax' => 1, 'action' => 'selectDeliveryOption']}"
                  method="post"
          >
            <div class="form-fields">
              {block name='delivery_options'}
                <div class="delivery-options">
                  {foreach from=$delivery_options item=carrier key=carrier_id}
                    <div
                            class="delivery-option-row row delivery-option{if isset($carrier.external_module_name) && "" != $carrier.external_module_name} {$carrier.external_module_name}{/if}{if (isset($customerSelectedDeliveryOption) && $carrier_id == $customerSelectedDeliveryOption)} user-selected{/if} carrier-ref-{$carrier.id_reference}">
                      <div class="shipping-radio">
                          <span class="custom-radio float-xs-left">
                            <input type="radio" name="delivery_option[{$id_address}]" id="delivery_option_{$carrier.id}"
                                   value="{$carrier_id}"{if $delivery_option == $carrier_id && (!$forceToChooseCarrier || (isset($customerSelectedDeliveryOption) && $carrier_id == $customerSelectedDeliveryOption))} checked{/if}>
                            <span></span>
                          </span>
                      </div>
                      <label for="delivery_option_{$carrier.id}" class="delivery-option-label delivery-option-2 {if $carrier.logo}has-logo{else}no-logo{/if}">
                        <div class="row">
                          <div class="delivery-option-detail">
                            <div class="row">
                              {if $carrier.logo}
                                <div class="delivery-option-logo">
                                  <img src="{$carrier.logo}" alt="{$carrier.name}"/>
                                </div>
                              {/if}
                              <div class="delivery-option-name">
                                <span class="h6 carrier-name">{$carrier.name}</span>
                              </div>
                            </div>
                          </div>
                          <div class="delivery-option-delay">
                            <span class="carrier-delay">{$carrier.delay}</span>
                          </div>
                          <div class="delivery-option-price">
                            <span class="carrier-price">{$carrier.price}</span>
                          </div>
                        </div>
                      </label>
                    </div>
                    {*Some themes have CSS definition: .carrier-extra-content:not(:empty) { margin-bottom: 2rem; } - so we need to keep no extra spaces here in .carrier-extra-content, if it shall be empty *}
                    <div
                            class="row carrier-extra-content{if "1" === $carrier.is_module} {$carrier.external_module_name}{/if}"{if $delivery_option != $carrier_id} style="display:none;"{/if}>{$carrier.extraContent nofilter}</div>
                    <div class="clearfix"></div>
                  {/foreach}
                </div>
              {/block}
              {if $delivery_options|count > 1}
                <div id="expand_other_shipping_options">
                  <div class="btn btn-secondary"><span>{l s='Other shipping options' mod='thecheckout'}</span></div>
                </div>
              {/if}
              <div class="order-options">
                {if $recyclablePackAllowed}
                  <span class="custom-checkbox">
                    <input type="checkbox" id="input_recyclable" name="recyclable"
                           value="1" {if $recyclable} checked {/if}>
                    <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
                    <label
                            for="input_recyclable">{l s='I would like to receive my order in recycled packaging.' d='Shop.Theme.Checkout'}</label>
                  </span>
                {/if}

                {if $gift.allowed}
                  <span class="custom-checkbox">
                    <input class="js-gift-checkbox" id="input_gift" name="gift" type="checkbox" value="1"
                           {if $gift.isGift}checked="checked"{/if}>
                    <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
                    <label for="input_gift">{$gift.label}</label>
                  </span>
                  <div id="gift" class="collapse{if $gift.isGift} in show{/if}">
                    <label
                            for="gift_message">{l s='If you\'d like, you can add a note to the gift:' d='Shop.Theme.Checkout'}</label>
                    <textarea rows="2" id="gift_message" name="gift_message">{$gift.message}</textarea>
                  </div>
                {/if}

              </div>
            </div>
            {*<button type="submit" class="continue btn btn-primary float-xs-right" name="confirmDeliveryOption" value="1">*}
            {*{l s='Continue' d='Shop.Theme.Actions'}*}
            {*</button> *}
          </form>
        {else}
          <p
                  class="alert alert-danger">{l s='Unfortunately, there are no carriers available for your delivery address.' d='Shop.Theme.Checkout'}</p>
        {/if}
      </div>
      <div id="hook-display-after-carrier">
        {$hookDisplayAfterCarrier nofilter}
      </div>
      <div id="extra_carrier"></div>
      <input type="hidden" name="confirmDeliveryOption" />
    {/if}
  </div>
{/block}
