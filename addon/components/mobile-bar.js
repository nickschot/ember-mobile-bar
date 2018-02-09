import Component from '@ember/component';
import layout from '../templates/components/mobile-bar';

import { computed, get, set } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { htmlSafe } from '@ember/string';
import RespondsToScroll from 'ember-responds-to/mixins/responds-to-scroll';

export default Component.extend(RespondsToScroll, {
  layout,

  classNames: ['mobile-bar'],
  classNameBindings: [
    'isBottomBar:mobile-bar--bottom:mobile-bar--top',
    'isDragging:mobile-bar--dragging',
    'isOpen:mobile-bar--open',
    'isClosed:mobile-bar--closed',
    'withShadow:mobile-bar--shadow'
  ],
  attributeBindings: ['style'],

  // public
  /**
   * Height in px of the collapsible part of the bar.
   * Will be automatically calculated if set to 0.
   */
  collapsibleHeight: 0,

  /**
   * If true the bar will keep a fixed position.
   * If false it will collapse on scroll.
   */
  isLocked: true,

  /**
   * Type of the bar. Either 'top' or 'bottom'.
   */
  type: 'top',

  /**
   * Whether or not a shadow is applied to the bar
   */
  withShadow: true,

  // protected
  wrapperElement: null,

  // private
  isDragging: false,
  currentPosition: 0,
  lastScrollTop: 0,
  elementHeight: 0,

  isBottomBar: computed('type', function(){
    return get(this, 'type') === 'bottom';
  }),

  isOpen: computed('currentPosition', 'collapsibleHeight', function(){
    return get(this, 'currentPosition') === get(this, 'collapsibleHeight');
  }),
  isClosed: computed('currentPosition', function(){
    return get(this, 'currentPosition') === 0;
  }),

  _collapsibleHeight: computed('collapsibleHeight', 'elementHeight', function(){
    return get(this, 'collapsibleHeight')
      ? get(this, 'collapsibleHeight')
      : get(this, 'elementHeight');
  }),

  style: computed('currentPosition', function(){
    return htmlSafe(`transform: translateY(-${get(this, 'currentPosition')}px)`);
  }),

  // protected hooks
  /**
   * Fires when the height of the bar changes
   * @param height Height of the bar in pixels
   * @param type Either 'top' or 'bottom'
   */
  onHeightChange(height, type){},

  // lifecycle events ----------------------------------------------------------
  didInsertElement(){
    this._super(...arguments);

    if(!get(this, 'isLocked')){
      get(this, 'wrapperElement').addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      get(this, 'wrapperElement').addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    }
  },
  didRender(){
    const height = get(this, 'element').offsetHeight;

    if(get(this, 'elementHeight') !== height){
      set(this, 'elementHeight', height);
      get(this, 'onHeightChange')(height, get(this, 'type'));
    }
  },
  willDestroyElement(){
    get(this, 'wrapperElement').removeEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    get(this, 'wrapperElement').removeEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
  },

  // events --------------------------------------------------------------------
  onTouchStart(){
    set(this, 'isDragging', true);
    set(this, 'lastScrollTop', this._getScrollTop());
  },
  scroll(){
    if(!get(this, 'isLocked')){
      const scrollTop = this._getScrollTop();

      if(get(this, 'isDragging')){
        const dy = scrollTop - get(this, 'lastScrollTop');

        set(this, 'lastScrollTop', scrollTop);

        const currentPosition = get(this, 'currentPosition');
        const newPosition = Math.min(Math.max(currentPosition + dy, 0), get(this, '_collapsibleHeight'));

        if(currentPosition !== newPosition){
          set(this, 'currentPosition', newPosition);
        }
      } else if(scrollTop < get(this, '_collapsibleHeight') / 2){
        set(this, 'currentPosition', 0);
      }
    }
  },
  onTouchEnd(){
    set(this, 'isDragging', false);
    scheduleOnce('afterRender', this, 'setFinalPosition');
  },

  // functions -----------------------------------------------------------------
  setFinalPosition(){
    if(get(this, 'currentPosition') > get(this, '_collapsibleHeight') / 2){
      // closed
      set(this, 'currentPosition', get(this, '_collapsibleHeight'));
    } else {
      // open
      set(this, 'currentPosition', 0);
    }
  },

  // util
  _getScrollTop(){
    return window.scrollY || document.scrollingElement.scrollTop || document.documentElement.scrollTop;
  }
});
