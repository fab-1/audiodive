function text () {
  "use strict";

  var defaultSettings = {
    alignVert: false, // if true, textFit will align vertically using css tables
    alignHoriz: false, // if true, textFit will set text-align: center
    multiLine: false, // if true, textFit will not set white-space: no-wrap
    detectMultiLine: true, // disable to turn off automatic multi-line sensing
    minFontSize: 16,
    maxFontSize: 80,
    widthOnly: false, // if true, textFit will fit text to element width, regardless of text height
    alignVertWithFlexbox: false, // if true, textFit will use flexbox for vertical alignment
    usePlaceholder: true,
    reProcess: true,
  };

  return function textFit(els, options) {

    if (!options) options = {};

    // Extend options.
    var settings = {};
    for(var key in defaultSettings){
      if(options.hasOwnProperty(key)){
        settings[key] = options[key];
      } else {
        settings[key] = defaultSettings[key];
      }
    }

    // Support passing a single el
    var elType = Object.prototype.toString.call(els);
    if (elType !== '[object Array]' && elType !== '[object NodeList]' &&
            elType !== '[object HTMLCollection]'){
      els = [els];
    }

    // Process each el we've passed.
    for(var i = 0; i < els.length; i++){
      processItem(els[i], settings);
    }
  };

  /**
   * The meat. Given an el, make the text inside it fit its parent.
   * @param  {DOMElement} el       Child el.
   * @param  {Object} settings     Options for fit.
   */
  function processItem(originalEl, settings){
    if (!isElement(originalEl) || (!settings.reProcess && originalEl.getAttribute('textFitted'))) {
      return false;
    }

    let el = originalEl.cloneNode(true)
    el.id = 'clone'
    originalEl.parentNode.appendChild(el)
    originalEl.style['display'] = 'none'

    // Set textFitted attribute so we know this was processed.
    if(!settings.reProcess){
      el.setAttribute('textFitted', 1);
    }

    var innerSpan, originalHeight, originalHTML, originalWidth;
    var low, mid, high;

    // Get element data.
    originalHTML = el.innerHTML;
    originalWidth = innerWidth(el);
    originalHeight = innerHeight(el);

    //console.log(originalWidth, originalHeight)

    // Don't process if we can't find box dimensions
    if (!originalWidth || (!settings.widthOnly && !originalHeight)) {
      if(!settings.widthOnly)
        throw new Error('Set a static height and width on the target element ' + el.outerHTML +
          ' before using textFit!');
      else
        throw new Error('Set a static width on the target element ' + el.outerHTML +
          ' before using textFit!');
    }

    innerSpan = document.createElement('span');
    innerSpan.className = 'textFitted';
    innerSpan.style['display'] = 'inline-block';
    innerSpan.innerHTML = originalHTML;

    el.appendChild(innerSpan);

    // Prepare & set alignment
    if (settings.alignHoriz) {
      el.style['text-align'] = 'center';
      innerSpan.style['text-align'] = 'center';
    }

    // Check if this string is multiple lines
    // Not guaranteed to always work if you use wonky line-heights
    var multiLine = settings.multiLine;

    // If we're not treating this as a multiline string, don't let it wrap.
    if (!multiLine) {
      el.style['white-space'] = 'nowrap';
    }

    low = settings.minFontSize;
    high = settings.maxFontSize;

    let step = 2
    // Binary search for highest best fit
    var size = low;
    while (low <= high) {
      mid = (high + low) >> 1;
      innerSpan.style.fontSize = mid + 'px';
      if(innerSpan.scrollHeight <= originalHeight){
        size = mid;
        low = mid + step;
      } else {
        high = mid - step;
      }
      // await injection point
    }


    // found, updating font if differs:
    if( innerSpan.style.fontSize !== size + 'px' ) innerSpan.style.fontSize = size + 'px';

    originalEl.style.fontSize = size + 'px';

    //we now delete the clone
    el.remove()
    originalEl.style.display = ''

  }

  // Calculate height without padding.
  function innerHeight(el){
    var style = window.getComputedStyle(el, null);
    return el.clientHeight -
      parseInt(style.getPropertyValue('padding-top'), 10) -
      parseInt(style.getPropertyValue('padding-bottom'), 10);
  }

  // Calculate width without padding.
  function innerWidth(el){
    var style = window.getComputedStyle(el, null);
    return el.clientWidth -
      parseInt(style.getPropertyValue('padding-left'), 10) -
      parseInt(style.getPropertyValue('padding-right'), 10);
  }

  //Returns true if it is a DOM element
  function isElement(o){
    return (
      typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
      o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
    );
  }

  function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }
}

const textExport = text()

export default textExport