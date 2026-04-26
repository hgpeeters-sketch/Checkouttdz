/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

document.addEventListener("DOMContentLoaded", function (event) {
    if (document.querySelector('#tc_secure_notice')) {
        // In trial mode, show footer link
        var cmsNodes = document.querySelectorAll('#footer [id*=link-cms-page]');
        if (cmsNodes.length) {
            var el = cmsNodes[cmsNodes.length-1];
            var lnk = el.parentElement.cloneNode(true);
            if (lnk.querySelector('a')) {
                lnk.querySelector('a').replaceWith(document.querySelector('#tc_secure_notice a'));
                el.insertAdjacentElement('beforebegin', lnk);
            }
        }
    }
});
