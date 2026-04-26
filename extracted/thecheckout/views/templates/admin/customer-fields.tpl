{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

<fieldset class="customer-fields">
  <legend>{$label}<span class="reset-link" data-section="account-fields" data-action="resetAccountFields"></span></legend>
  <table id="customer_fields" class="customer-fields table table-condensed table-striped">
    <thead>
    <tr>
      <th>{l s='# Reorder' mod='thecheckout'}</th>
      <th>{l s='Field name' mod='thecheckout'}</th>
      <th>{l s='Visible' mod='thecheckout'}</th>
      <th>{l s='Required' mod='thecheckout'}</th>
      <th>{l s='Width [%]' mod='thecheckout'}</th>
    </tr>
    </thead>
    <tbody>
    {foreach $fields as $field_name => $details}
      <tr class="{$field_name}">
        <td><i class="js-handle material-icons">swap_vert</i></td>
        <td>{$field_name}
          <input type="hidden" name="field-name" value="{$field_name}"></td>
            {if $field_name == "State:name" || $field_name == "postcode"}
              <td colspan="3" style="text-align: center;">{l s='- managed automatically -' mod='thecheckout'}
                <input type="checkbox" style="display: none;" name="visible" checked>
                <input type="checkbox" style="display: none;" name="required">
              </td>
              <td><input type="number" name="width" value="{$details.width}">
            {elseif $field_name == "psgdpr" || $field_name == "customer_privacy"}
              <td colspan="2" style="text-align: center;">- managed by <b>{$field_name}</b> module -
                <input type="checkbox" style="display: none;" name="visible" checked>
                <input type="checkbox" style="display: none;" name="required">
              </td>
              <td><input type="number" name="width" value="{$details.width}">
            {else}
              <td><input type="checkbox" name="visible" {if $details.visible}checked{/if}></td>
                <td><input type="checkbox" name="required"
                           {if $details.required}checked{/if} {if !$details.visible}disabled{/if}></td>
              <td><input type="number" name="width" value="{$details.width}" {if !$details.visible}disabled{/if}>
          {/if}
          <i class="js-handle material-icons">swap_vert</i>
        </td>
      </tr>
    {/foreach}
    </tbody>
  </table>
</fieldset>
