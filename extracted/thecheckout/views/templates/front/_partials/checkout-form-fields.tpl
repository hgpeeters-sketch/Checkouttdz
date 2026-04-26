{**
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Academic Free License 3.0 (AFL-3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/AFL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to http://www.prestashop.com for more information.
 *
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright PrestaShop SA
 * @license   https://opensource.org/licenses/AFL-3.0 Academic Free License 3.0 (AFL-3.0)
 * International Registered Trademark & Property of PrestaShop SA
 *}
{if $field.type == 'hidden'}

  {block name='form_field_item_hidden'}
    <input type="hidden" class="orig-field" name="{$field.name}" value="{$field.value}">
  {/block}

{else}

  {assign var="passwordShallBeVisible" value=false} {* default value, which we may change below *}
  {assign var="class" value="{if (true == $field.live)} live{/if}"}
  {if $field.type === 'password' && isset($parentTplName) && $parentTplName === 'account'}
    {assign var=show_create_account_checkbox value=$ps_config.PS_GUEST_CHECKOUT_ENABLED && $tc_config->create_account_checkbox && (!$customer.is_logged || $customer.is_guest)}
    {if $show_create_account_checkbox}
      {assign var="passwordShallBeVisible" value=(isset($opc_form_checkboxes['create-account']) && 'true' == $opc_form_checkboxes['create-account'])}
      <div id="create_account" class="form-group checkbox">
        <label>
        <span class="custom-checkbox">
          <input type="checkbox" name="create-account" class="orig-field" data-link-action="x-create-account"
            {if $passwordShallBeVisible}
              checked="checked"
            {else}
              {$field.visible=false}{*hide password field, when $show_create_account_checkbox=YES && checkboxes['create-account']=NO*}
            {/if}
          >
          <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
          <span class="label">
            {l s='Choose a password to create an account and save time on your next order (optional)' mod='thecheckout'}
          </span>
          </span>
        </label>
      </div>
    {/if}
  {/if}

  {capture name="form_group_classes"}
    form-group
    {$field.name}
    {if isset($checkoutSection) && ('invoice' === $checkoutSection || 'delivery' === $checkoutSection) && in_array($field.name, $businessFieldsList)}business-field{/if}
    {if isset($checkoutSection) && ('invoice' === $checkoutSection || 'delivery' === $checkoutSection) && in_array($field.name, $privateFieldsList)}private-field{/if}
    {if isset($checkoutSection) && ('invoice' === $checkoutSection || 'delivery' === $checkoutSection) && in_array($field.name, $businessDisabledFieldsList)}business-disabled-field{/if}
    {$field.type}
    {if (false == $field.visible) && !($field.type === 'password' && $passwordShallBeVisible)} hidden{/if}
    {if !empty($field.errors)} has-error{/if}
    {if $field.type === 'select' && empty($field.availableValues)} hidden{/if}
    {if $field.name==='address1' && $field.value|strlen>3 && !'/\d+/'|preg_match:$field.value}missing-street-number{/if}
    {if $field.css_class} {$field.css_class}{/if}
  {/capture}

  <div
    class="{$smarty.capture.form_group_classes|strip|trim}"
    style="flex-basis: {$field.width}%"
  >

    {if $field.type === 'radio-buttons' || $field.type === 'checkbox' || $field.type === 'date' || $field.type === 'birthday'}
      {assign var="effectType" value=""}
    {else}
      {assign var="effectType" value="has-float-label"}
    {/if}


    <label class="{$effectType}{if $field.required && $field.css_class != 'need-dni'} required{/if}"
           {if $field.name==='address1'}data-missing-street-nr-notice="{l s='Missing street number?' mod='thecheckout'}"{/if}
    >


      {if $field.type === 'select'}

        {block name='form_field_item_select'}
          <select class="form-control orig-field form-control-select{$class}" name="{$field.name}"
                  {if $field.required}required{/if}>
            <option value disabled selected>{l s='-- please choose --' d='Shop.Forms.Labels'}</option>
            {foreach from=$field.availableValues key="value" item="label"}
              <option value="{$value}" {if $value eq $field.value} selected {/if}>{$label}</option>
            {/foreach}
          </select>
        {/block}

      {elseif $field.type === 'countrySelect'}

        {block name='form_field_item_country'}
          <select
            class="form-control orig-field form-control-select js-country{$class}"
            name="{$field.name}"
            {if $field.required}required{/if}
          >
            <option value disabled selected>{l s='-- please choose --' d='Shop.Forms.Labels'}</option>
            {foreach from=$field.availableValues key="option_value" item="label"}
              {if is_array($label)}
                {assign var="label_label" value=$label.label}
                {assign var="option_data" value=$label.option_data}
              {else}
                {assign var="label_label" value=$label}
                {assign var="option_data" value=""}
              {/if}
              <option {$option_data} value="{$option_value}" {if $option_value eq $field.value} selected {/if}>{$label_label}</option>
            {/foreach}
          </select>
        {/block}

      {elseif $field.type === 'radio-buttons'}

        {block name='form_field_item_radio'}
          <span class="field-label">
            {$field.label}
          </span>
          <div class="available-values {$field.name}">
            {foreach from=$field.availableValues item="label" key="value"}
              <label class="radio-inline">
              <span class="custom-radio">
                <input
                  name="{$field.name}"
                  type="radio"
                  value="{$value}"
                  class="orig-field"
                  {if $field.required}required{/if}
                  {if $value eq $field.value} checked {/if}
                >
                <span></span>
              </span>
                {$label}
              </label>
            {/foreach}
          </div>
        {/block}

      {elseif $field.type === 'checkbox'}

        {block name='form_field_item_checkbox'}
          <span class="custom-checkbox">
            <input class="orig-field" name="{$field.name}" type="checkbox" value="1"
                   {if $field.value}checked="checked"{/if} {if $field.required}required{/if}>
            <span><i class="material-icons rtl-no-flip checkbox-checked check-icon">&#xE5CA;</i></span>
            {*
              Although validator is complaining, very same syntax with 'nofilter' is used also in
              ./themes/classic/templates/_partials/form-fields.tpl; this is to allow HTML in checkbox label
            *}
            <span class="label js-terms">{$field.label nofilter}</span>
          </span>
        {/block}

      {elseif $field.type === 'date'}

        {block name='form_field_item_date'}
          <input name="{$field.name}" class="form-control orig-field" type="date" value="{$field.value}"
                 placeholder="{if isset($field.availableValues.placeholder)}{$field.availableValues.placeholder}{/if}">
          {if isset($field.availableValues.comment)}
            <span class="form-control-comment">
              {$field.availableValues.comment}
            </span>
          {/if}
        {/block}

      {elseif $field.type === 'birthday'}
        {block name='form_field_item_birthday'}
          <div class="js-parent-focus">
            {$field.label}
            {html_select_date
            field_order=DMY
            time={$field.value}
            field_array={$field.name}
            prefix=false
            reverse_years=true
            field_separator='<br>'
            day_extra='class="form-control orig-field form-control-select"'
            month_extra='class="form-control orig-field form-control-select"'
            year_extra='class="form-control orig-field form-control-select"'
            day_empty={l s='-- day --' d='Shop.Forms.Labels'}
            month_empty={l s='-- month --' d='Shop.Forms.Labels'}
            year_empty={l s='-- year --' d='Shop.Forms.Labels'}
            start_year={'Y'|date}-100 end_year={'Y'|date}
            }
          </div>
        {/block}

      {elseif $field.type === 'password'}

        {block name='form_field_item_password'}
          <input
            class="form-control orig-field"
            name="{$field.name}"
            type="password"
            value=""
            pattern=".{literal}{{/literal}5,{literal}}{/literal}"
            placeholder=" "
            {if $field.required}required{/if}
          >
          <span data-link-action="toggle-password-visibility" class="icon-remove-red-eye"></span>
        {/block}

      {else} {* standard text inputs *}

        {if $field.name === 'birthday' && isset($field.availableValues.placeholder)}
          {assign var='placeholder' value="{$field.availableValues.placeholder}" }
        {else}
          {assign 'placeholder' ' '}
        {/if}

        {* Placeholder definition samples
        {if $field.name === 'address1'}
          {assign 'placeholder' {l s='Rue de Avengers 14' mod='thecheckout'}}
        {/if}
        {if $field.name === 'phone'}
          {assign 'placeholder' {l s='0911235669' mod='thecheckout'}}
        {/if}
        *}

        {* Remove call prefix from phone number - for display purposes, if prefix is shown separately *}
        {* Part 1 *}
        {if $tc_config->show_call_prefix && ($field.name === 'phone' || $field.name === 'phone_mobile')}
          {assign 'callPrefix' '+'|cat:$field.custom_data['call_prefix']}
          {$field.value = $field.value|replace:{$callPrefix}:''}
        {/if}

        {block name='form_field_item_other'}
          <input
            class="form-control orig-field{$class}"
            name="{$field.name}"
            type="{$field.type}"
            value="{$field.value}"
            placeholder="{$placeholder}"
            {if $field.autoCompleteAttribute}autocomplete="{$field.autoCompleteAttribute}"{/if}
            {if $field.maxLength}maxlength="{$field.maxLength}"{/if}
            {if $field.required}required{/if}
          >
        {/block}

        {* Part 2, displayed after input field, due to 'modern' theme, which uses placeholder shown CSS selectors *}
        {if $tc_config->show_call_prefix && ($field.name === 'phone' || $field.name === 'phone_mobile')}
          <span class="country-call-prefix">{$callPrefix}</span>
        {/if}

      {/if}

      <span class="effects-helper"></span>


      {if $field.type !== 'checkbox' && $field.type !== 'radio-buttons' && $field.type !== 'birthday'}
        <span class="field-label"{if !$field.required} data-optional-label="{l s='(optional)' mod='thecheckout'}"{/if}>
          {$field.label}
        </span>
      {/if}


    </label>

    {*if ($field.required && !in_array($field.type, ['radio-buttons', 'checkbox']))}
      <span class="required">
         {l s='*' mod='thecheckout'}
      </span>
    {/if*}
  </div>
{/if}
