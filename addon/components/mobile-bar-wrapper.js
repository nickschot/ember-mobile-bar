import Component from '@ember/component';
import layout from '../templates/components/mobile-bar-wrapper';

import { getOwner } from '@ember/application';
import { A } from '@ember/array';
import { computed, get, set } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  layout,

  classNames: ['mobile-bar-wrapper'],
  attributeBindings: ['style'],

  // private
  paddingTop: 0,
  paddingBottom: 0,

  fastboot: computed(function() {
    const owner = getOwner(this);
    return owner.lookup('service:fastboot');
  }),
  isFastBoot: computed('fastboot', function(){
    return !!get(this, 'fastboot.isFastBoot');
  }),

  style: computed('paddingTop', 'paddingBottom', function(){
    return htmlSafe(`padding-top: ${get(this, 'paddingTop')}px; padding-bottom: ${get(this, 'paddingBottom')}px;`);
  }),

  wrapperElement: computed('isFastBoot', function(){
    return this.get('isFastBoot') ? null : this.get('element');
  }),

  actions: {
    heightChanged(height, type, isOverlay){
      if(type === 'top'){
        set(this, 'paddingTop', isOverlay ? 0 : height);
      } else if(type === 'bottom'){
        set(this, 'paddingBottom', isOverlay ? 0 : height);
      } else {
        throw new Error(`Invalid mobile-bar type specified: ${type}`)
      }
    }
  }
});
