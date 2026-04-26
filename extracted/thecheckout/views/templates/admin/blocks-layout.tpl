{**
* NOTICE OF LICENSE
*
* This source file is subject to the Software License Agreement
* that is bundled with this package in the file LICENSE.txt.
*
*  @author    Peter Sliacky (Zelarg)
*  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
*}
<fieldset class="checkout-blocks-layout">
  <legend>{$label}<span class="reset-link" data-section="blocks-layout" data-action="resetBlocksLayout"></span></legend>
  :: <a onclick="expandBlocksClasses();" style="cursor: pointer;">{l s='Edit blocks classes - Click to expand' mod='thecheckout'}</a>


  <div class="block-classes-info" style="display: none;">
    <div>{l s='This allows further fine-grained manipulation using width pre-defined CSS classes. You can use these pre-defined classes:' mod='thecheckout'}
      <br/>{l s='Set number for block:' mod='thecheckout'} <span class="block-classes-sample">num-1</span> ... <span class="block-classes-sample">num-6</span>
      <br/>{l s='Set block invisible:' mod='thecheckout'} <span class="block-classes-sample">hidden</span> <span data-toggle="tooltip" title="For 'psgdpr' and 'data-privacy' - Please do not set them to 'hidden'! Rather disable those modules, if you want to hide these blocks."><i  class="material-icons" style="font-size: 16px;">help</i></span>
      <br/>{l s='Set block position on mobile (flexbox \'order\' property)' mod='thecheckout'}:
      <span class="block-classes-sample">mobile-1</span> ... <span class="block-classes-sample">mobile-15</span>
      <br/>{l s='Set cart block to column-sticky mode' mod='thecheckout'}:
      <span class="block-classes-sample">sticky</span>
      <br/>{l s='Remove header from (e.g. address) block' mod='thecheckout'}:
      <span class="block-classes-sample">no-header</span>
    </div>
    <div>
      {l s='Or you can use your custom classes, defined anywhere in CSS, e.g.' mod='thecheckout'}
      <code>/modules/thecheckout/views/css/any_name.css</code>
    </div>
  </div>

  {function blockContainer}
    {foreach $data as $key=>$sub_block}
      {if "blocks" === $key}
        <fieldset class="checkout-block-container" data-default-size="{$data.size}">
          <div class="inner-area">
            <a class="split split-vertical" title="Split Vertical"></a>
            <a class="split split-horizontal" title="Split Horizontal"></a>
            <a class="remove-split" title="Remove this section"></a>
            <div class="checkout-block-sortable-container" aria-dropeffect="move">
              {foreach $sub_block as $checkout_block}
                {foreach $checkout_block as $blockName=>$classes}
                  <div class="checkout-block-item">
                    <div
                      class="{$blockName} block-name{if in_array($blockName, $disabledModuleFields)} module-disabled
                      {elseif in_array($blockName, $enabledModuleFields)} module-enabled{/if}"
                      title="{if in_array($blockName, $disabledModuleFields)}
                      To show this block, please enable respective module in Modules & Services tab.
                      {elseif in_array($blockName, $enabledModuleFields)}
                      To hide this block, please disable respective module in Modules & Services tab.
                      {/if}"
                    >{$blockName}</div>
                    {*<a class="open-class-names">CSS classes...</a>*}
                    <input type="hidden" name="blockName" value="{$blockName}">
                    <input type="text" name="classes" value="{$classes}"
                           placeholder="Whitespace separated list of CSS class names for this block..."
                           title="Additional CSS classNames set for this block">
                  </div>
                {/foreach}
              {/foreach}
            </div>
          </div>
        </fieldset>
      {elseif "size" === $key} {*intentionally empty*}
      {else}
        {if 0 === $key|strpos:'flex-split'}
          <fieldset class="checkout-block-container" data-default-size="{$data.size}">
          <div class="{$key}">
        {/if}
        {blockContainer data=$sub_block}
        {if 0 === $key|strpos:'flex-split'}
          </div>
          </fieldset>
        {/if}
      {/if}
    {/foreach}
  {/function}

  <div class="blocks-layout top-level" style="min-height: 100px; min-width: 100px">
    {blockContainer data=$blocksLayout}
  </div>


</fieldset>
