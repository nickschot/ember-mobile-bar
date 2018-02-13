import Component from '@ember/component';
import layout from '../templates/components/mobile-bar-wrapper';

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

  style: computed('paddingTop', 'paddingBottom', function(){
    return htmlSafe(`padding-top: ${get(this, 'paddingTop')}px; padding-bottom: ${get(this, 'paddingBottom')}px;`);
  }),

  actions: {
    heightChanged(height, type){
      if(type === 'top'){
        set(this, 'paddingTop', height);
      } else if(type === 'bottom'){
        set(this, 'paddingBottom', height);
      } else {
        throw new Error(`Invalid mobile-bar type specified: ${type}`)
      }
    }
  }
});
