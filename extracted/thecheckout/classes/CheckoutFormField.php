<?php
/**
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
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
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */

class CheckoutFormField
{
    private $name = '';
    private $type = 'text';
    private $required = false;
    private $label = '';
    private $value = null;
    private $availableValues = array();
    private $maxLength = null;
    private $errors = array();
    private $constraints = array();
    private $live = null;
    private $hidden = false;
    private $width = 100;
    private $css_class = '';
    private $autoCompleteAttribute = '';
    private $custom_data = array();


    public function __construct(FormField $formfield = null)
    {
        if (null !== $formfield) {
            // remap Prestashop's FormField to CheckoutFormField
            $this->name            = $formfield->getName();
            $this->type            = $formfield->getType();
            $this->required        = $formfield->isRequired();
            $this->label           = $formfield->getLabel();
            $this->value           = $formfield->getValue();
            $this->availableValues = $formfield->getAvailableValues();
            $this->maxLength       = $formfield->getMaxLength();
            $this->errors          = $formfield->getErrors();
            $this->constraints     = $formfield->getConstraints();
        }
    }

    public function toArray()
    {
        return array(
            'name'                  => $this->getName(),
            'type'                  => $this->getType(),
            'required'              => $this->isRequired(),
            'label'                 => $this->getLabel(),
            'value'                 => $this->getValue(),
            'availableValues'       => $this->getAvailableValues(),
            'maxLength'             => $this->getMaxLength(),
            'errors'                => $this->getErrors(),
            'live'                  => $this->getLive(),
            'hidden'                => $this->getHidden(),
            'visible'               => !$this->getHidden(),
            'width'                 => $this->getWidth(),
            'css_class'             => $this->getCssClass(),
            'autoCompleteAttribute' => $this->getAutoCompleteAttribute(),
            'custom_data'           => $this->getCustomData()
        );
    }


    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }

    public function getName()
    {
        return $this->name;
    }

    public function setType($type)
    {
        $this->type = $type;
        return $this;
    }

    public function getType()
    {
        return $this->type;
    }

    public function setRequired($required)
    {
        $this->required = $required;
        return $this;
    }

    public function isRequired()
    {
        return $this->required;
    }

    public function setLabel($label)
    {
        $this->label = $label;
        return $this;
    }

    public function getLabel()
    {
        return $this->label;
    }

    public function setValue($value)
    {
        $this->value = $value;
        return $this;
    }

    public function getValue()
    {
        return $this->value;
    }

    public function setAvailableValues(array $availableValues)
    {
        $this->availableValues = $availableValues;
        return $this;
    }

    public function getAvailableValues()
    {
        return $this->availableValues;
    }

    public function addAvailableValue($availableValue, $label = null)
    {
        if (!$label) {
            $label = $availableValue;
        }

        $this->availableValues[$availableValue] = $label;
        return $this;
    }

    public function setMaxLength($max)
    {
        $this->maxLength = (int)$max;
        return $this;
    }

    public function getMaxLength()
    {
        return $this->maxLength;
    }

    public function setCssClass($css_class)
    {
        $this->css_class = $css_class;
        return $this;
    }

    public function getCssClass()
    {
        return $this->css_class;
    }

    public function setErrors(array $errors)
    {
        $this->errors = $errors;
        return $this;
    }

    public function getErrors()
    {
        return $this->errors;
    }

    public function addError($errorString)
    {
        $this->errors[] = $errorString;
        return $this;
    }

    public function setConstraints(array $constraints)
    {
        $this->constraints = $constraints;
        return $this;
    }

    public function addConstraint($constraint)
    {
        $this->constraints[] = $constraint;
        return $this;
    }

    public function getConstraints()
    {
        return $this->constraints;
    }

    /**
     * @return null
     */
    public function getLive()
    {
        return $this->live;
    }

    /**
     * @param null $live
     */
    public function setLive($live)
    {
        $this->live = $live;
        return $this;
    }

    /**
     * @return null
     */
    public function getHidden()
    {
        return $this->hidden;
    }

    /**
     * @param null $hidden
     */
    public function setHidden($hidden)
    {
        $this->hidden = $hidden;
        return $this;
    }

    /**
     * @return int
     */
    public function getWidth()
    {
        return $this->width;
    }

    /**
     * @param int $width
     */
    public function setWidth($width)
    {
        $this->width = $width;
        return $this;
    }

    /**
     * @return string
     */
    public function getAutoCompleteAttribute()
    {
        return $this->autoCompleteAttribute;
    }

    /**
     * @param string $autoCompleteAttribute
     */
    public function setAutoCompleteAttribute($autoCompleteAttribute)
    {
        $this->autoCompleteAttribute = $autoCompleteAttribute;
        return $this;
    }

    /**
     * @return string
     */
    public function getCustomData()
    {
        return $this->custom_data;
    }

    /**
     * @param string $custom_data
     */
    public function setCustomData($custom_data)
    {
        $this->custom_data = $custom_data;
        return $this;
    }

}
