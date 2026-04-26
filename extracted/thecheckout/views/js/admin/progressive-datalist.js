/**
 * @author    Scott O'Hara
 * @license   https://github.com/scottaohara/select-to-datalist/blob/master/LICENSE
 *
 */
;(function ( w, doc ) {
  //enable strict mode
  'use strict';

  // Local object for method references
  var ProgDatalist = {};

  // Meta
  ProgDatalist.NS      = "ProgDatalist";
  ProgDatalist.AUTHOR  = "Scott O'Hara";
  ProgDatalist.VERION  = "0.1.1";
  ProgDatalist.LICENSE = "https://github.com/scottaohara/select-to-datalist/blob/master/LICENSE";

  // Create accordion instances
  ProgDatalist.create = function () {

    var widget        = doc.querySelectorAll('.progressive-datalist');
    var widgetCount   = widget.length;

    // setup / cache vars
    var self;
    var selfID;
    var cleanup = true;
    var i;

    // run a check to see if datalist is supported
    if ( 'options' in document.createElement('datalist') ) {

      // if supported, run through all instances of prog-datalist
      // and convert the select elements to inputs w/datalists
      for ( i = 0; i < widgetCount; i++ ) {

        self = widget[i];

        // the generated datalist will need an ID
        var genID = 'datalist_' + Math.floor(Math.random() * 999) + 1;

        // now find the select element by pulling it's ID from
        // the 'for' attribute on the self container (label)
        selfID = self.getAttribute('id');

        // set the ID, grab the options, and placeholder the a for looping
        var el = doc.getElementById(selfID);
        var grabOptions = el.innerHTML;
        var a;

        // create new input
        var newInput = doc.createElement('input');

        // pull each of the attributes from the original <select>
        // and place them onto the new text input, so important
        // attributes like name, id and if it were required don't get
        // lost in the transfer...
        for ( var a = 0; a < el.attributes.length; a++ ) {
          var attr = el.attributes.item(a);
          newInput.setAttribute(attr.nodeName, attr.nodeValue);
        }
        // since this is a text input now, we also want to
        // add a type, and point to the new datalist's ID
        // with the list attribute.
        newInput.setAttribute('type', 'text');
        newInput.setAttribute('list', genID);

        // create new datalist. Set its ID, and pull the
        // original select element's options into the new element
        var newDatalist = doc.createElement('datalist');
        newDatalist.setAttribute('id', genID);
        newDatalist.innerHTML = grabOptions;

        // add the input & datalist to the original container
        $(self).after(newInput);
        $(self).after(newDatalist);

        // if using the 'disabled' attribute trick to disallow
        // the first "Select..." option from being selected by
        // a user, remove that placeholder option from the new datalist
        if ( self.querySelector('datalist option[disabled]') ) {
          self.querySelector('datalist option[disabled]').remove();
        }

        // now find the original select element and remove it.
        // if using the custom select box markup pattern,
        // find the select-box class and remove it. If not
        // using it, or using some other pattern, at least
        // just remove the select element since it's no
        // longer needed.
        if ( self.querySelector('.select-box') ) {
          self.querySelector('.select-box').remove();
        }
        else {
          self.remove();
        }

        if ( self.hasAttribute('data-size') ) {
          var getSize = self.getAttribute('data-size');
          newInput.setAttribute('size', getSize);

          if ( cleanup ) {
            self.removeAttribute('data-size');
          }
        }

        if ( self.hasAttribute('data-maxlength') ) {
          var getMax = self.getAttribute('data-maxlength');
          newInput.setAttribute('maxlength', getMax);

          if ( cleanup ) {
            self.removeAttribute('data-maxlength');
          }
        }

        if ( self.hasAttribute('data-class') ) {
          var getClass = self.getAttribute('data-class');
          newInput.setAttribute('class', getClass);

          if ( cleanup ) {
            self.removeAttribute('data-class');
          }
        }
      } // for(widgetCount)
    }
  }; // ProgDatalist.create()


  ProgDatalist.init = function () {
    ProgDatalist.create();
  }; // ProgDatalist.init()

  $(document).ready(function () {
    ProgDatalist.init();
  });

})( this, this.document );
