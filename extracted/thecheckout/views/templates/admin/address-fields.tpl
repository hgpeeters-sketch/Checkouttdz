{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
<fieldset class="address-fields">
  <legend>{$addressLabel}<span class="reset-link" data-section="{$addressTypeFields}" data-action="reset{$addressTypeFields|capitalize:true|replace:'-':''}"></span></legend>
  <table id="{$addressTypeFields}" class="address-fields table table-condensed table-striped">
    <thead>
    <tr>
      <th>{l s='# Reorder' mod='thecheckout'}</th>
      <th>{l s='Field name' mod='thecheckout'}</th>
      <th>{l s='Visible' mod='thecheckout'}</th>
      <th>{l s='Required' mod='thecheckout'}</th>
      <th><span data-toggle="tooltip" title="Whenever user changes 'live' field on checkout form, address is immediately saved and shipping/payment methods are refreshed. For non-live fields, address is saved only at final confirmation. Set 'live' for fields that affect shipping or payment.">{l s='Live' mod='thecheckout'}<i class="material-icons" style="position:absolute; font-size: 16px; margin-top:-4px">help</i></span></th>
      <th>{l s='Width [%]' mod='thecheckout'}</th>
    </tr>
    </thead>
    <tbody>
    {foreach $fields as $field_name => $details}
      <tr>
        <td><i class="js-handle material-icons">swap_vert</i></td>
        <td>{$field_name}
          <input type="hidden" name="field-name" value="{$field_name}"></td>
        {if $field_name == "State:name" || $field_name == "postcode"}
        <td colspan="3" style="text-align: center;">{l s='- managed automatically -' mod='thecheckout'}
          <input type="checkbox" style="display: none;" name="visible" checked>
          <input type="checkbox" style="display: none;" name="required">
          <input type="checkbox" style="display: none;" name="live" checked>
        </td>
        <td><input type="number" name="width" value="{$details.width}">
          {else}
        <td><input type="checkbox" name="visible" {if $details.visible}checked{/if}></td>
        <td><input type="checkbox" name="required"
                   {if $details.required}checked{/if} {if !$details.visible}disabled{/if}></td>
        <td><input type="checkbox" name="live" {if $details.live}checked{/if} {if !$details.visible}disabled{/if}></td>
        <td><input type="number" name="width" value="{$details.width}" {if !$details.visible}disabled{/if}>
          {/if}
          <i class="js-handle material-icons">swap_vert</i>
        </td>
      </tr>
    {/foreach}
    </tbody>
  </table>
</fieldset>
