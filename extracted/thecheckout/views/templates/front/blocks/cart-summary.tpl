{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}

{if isset($js_custom_vars) && $js_custom_vars|@count}
  <script type="text/javascript">
    {foreach from=$js_custom_vars key=var_name item=var_value}
    if ('object' === typeof {$var_name}{literal}) {
      {/literal}
        jQuery.extend({$var_name}, {$var_value|json_encode nofilter});
      {literal}
    } {/literal} else if ('undefined' !== typeof {$var_name}{literal}) {
      {/literal}
      {$var_name} = {$var_value|json_encode nofilter};
      {literal}
    } else {
      {/literal}
        var {$var_name} = {$var_value|json_encode nofilter};
      {literal}
    }
    {/literal}
    {/foreach}
  </script>
{/if}

<section id="main">
  <div class="block-header shopping-cart-header">{l s='Shopping Cart' d='Shop.Theme.Checkout'}</div>
  <div class="cart-inner-wrapper">
    {if $cartQuantityError}
      <div class="error-msg visible">{$cartQuantityError}</div>
    {/if}

    <div class="cart-grid row">

      <div class="card cart-container">
        {block name='cart_overview'}
          {include file='module:thecheckout/views/templates/front/_partials/cart-detailed.tpl' cart=$cart}
        {/block}
      </div>

      {block name='cart_summary'}
        <div class="card cart-summary">

          {block name='cart_totals'}
            {include file='module:thecheckout/views/templates/front/_partials/cart-detailed-totals.tpl' cart=$cart}
          {/block}

          {block name='hook_shopping_cart'}
            {hook h='displayShoppingCart'}
          {/block}

        </div>
      {/block}

      {block name='hook_shopping_cart_footer'}
        {hook h='displayShoppingCartFooter'}
      {/block}

      {* Reassurance is now as separate block - HTML Box no.1
      {block name='hook_reassurance'}
        {hook h='displayReassurance'}
      {/block}
      *}

    </div>
  </div>
</section>
