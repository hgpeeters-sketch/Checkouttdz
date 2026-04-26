/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Software License Agreement
 * that is bundled with this package in the file LICENSE.txt.
 *
 *  @author    Peter Sliacky (Zelarg)
 *  @license   http://opensource.org/licenses/osl-3.0.php  Open Software License (OSL 3.0)
 */

var shaim_shipping_modules_present = ('undefined' !== typeof exists_opc);

if (shaim_shipping_modules_present) {
  tc_confirmOrderValidations['shaim_shipping_modules'] = function () {

    /* openservis - WEDO - begin */
    if (typeof CheckHardWedo === 'function' && CheckHardWedo() === false) {
      return false;
    }
    /* openservis - WEDO - end */

    /* openservis - Zásilkovna WIDGET - begin */
    if (typeof CheckHardZasilkovnaWidget === 'function' && CheckHardZasilkovnaWidget() === false) {
    return false;
    }
    /* openservis - Zásilkovna WIDGET - end */

    /* openservis - Zásilkovna - begin */
    if (typeof CheckHardZasilkovna === 'function' && CheckHardZasilkovna() === false) {
    return false;
    }
    /* openservis - Zásilkovna - end */

    /* openservis - Uloženka - begin */
    if (typeof CheckHardUlozenka === 'function' && CheckHardUlozenka() === false) {
    return false;
    }
    /* openservis - Uloženka - end */

    /* openservis - In Time - begin */
    if (typeof CheckHardIntime === 'function' && CheckHardIntime() === false) {
    return false;
    }
    /* openservis - In Time - end */

    /* openservis - PPL - sobotní doručení - begin */
    if (typeof CheckHardPplsobotnidoruceni === 'function' && CheckHardPplsobotnidoruceni() === false) {
    return false;
    }
    /* openservis - PPL - sobotní doručení - end */

    /* openservis - PPL - Parcel Shop - begin */
    if (typeof CheckHardPplparcelshop === 'function' && CheckHardPplparcelshop() === false) {
    return false;
    }
    /* openservis - PPL - Parcel Shop - end */

    /* openservis - GLS - Parcel Shop - begin */
    if (typeof CheckHardGlsparcelshop === 'function' && CheckHardGlsparcelshop() === false) {
    return false;
    }
    /* openservis - GLS - Parcel Shop - end */

    /* openservis - Geis Point - begin */
    if (typeof CheckHardGeispoint === 'function' && CheckHardGeispoint() === false) {
    return false;
    }
    /* openservis - Geis Point - end */

    /* openservis - DPD Parcel Shop (Pick Up) - begin */
    if (typeof CheckHardDpdparcelshop === 'function' && CheckHardDpdparcelshop() === false) {
    return false;
    }
    /* openservis - DPD Parcel Shop (Pick Up) - end */

    /* openservis - Balik Do ruky - begin */
    if (typeof CheckHardBalikdoruky === 'function' && CheckHardBalikdoruky() === false) {
    return false;
    }
    /* openservis - Balik Do ruky - end */

    /* openservis - Balik na postu - begin */
    if (typeof CheckHardBaliknapostu === 'function' && CheckHardBaliknapostu() === false) {
    return false;
    }
    /* openservis - Balik na postu - end */

    /* openservis - Balikovna - begin */
    if (typeof CheckHardBalikovna === 'function' && CheckHardBalikovna() === false) {
    return false;
    }
    /* openservis - Balikovna - end */

    return true;
    /* openservis - Zásilkovna - end */
  }
}


