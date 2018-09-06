import Component from '@ember/component';
import layout from '../templates/components/mobile-bar';

import { computed, get, set } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import { htmlSafe } from '@ember/string';
import RespondsToScroll from 'ember-responds-to/mixins/responds-to-scroll';
import ResizeObservable from 'ember-resize-observer/mixins/resize-observable';

export default Component.extend(RespondsToScroll, ResizeObservable, {
  layout,

  classNames: ['mobile-bar'],
  classNameBindings: [
    'isBottomBar:mobile-bar--bottom:mobile-bar--top',
    'isDragging:mobile-bar--dragging',
    'isOpen:mobile-bar--open',
    'isClosed:mobile-bar--closed',
    'isLocked:mobile-bar--locked'
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
   * If true the bar will be placed over the mobile-wrapper content
   * instead of above it
   */
  isOverlay: false,

  /**
   * Type of the bar. Either 'top' or 'bottom'.
   */
  type: 'top',

  // protected
  wrapperElement: null,

  // private
  isDragging: false,
  currentPosition: 0,
  lastScrollTop: 0,
  elementHeight: 0,

  // computed properties -------------------------------------------------------
  _collapsibleHeight: computed('collapsibleHeight', 'elementHeight', function(){
    return get(this, 'collapsibleHeight')
      ? get(this, 'collapsibleHeight')
      : get(this, 'elementHeight');
  }),

  isBottomBar: computed('type', function(){
    return get(this, 'type') === 'bottom';
  }),

  isOpen: computed('currentPosition', '_collapsibleHeight', function(){
    return get(this, 'currentPosition') === 0;
  }),
  isClosed: computed('currentPosition', function(){
    return get(this, '_collapsibleHeight') && get(this, 'currentPosition') === get(this, '_collapsibleHeight');
  }),

  style: computed('currentPosition', 'isBottomBar', function(){
    const position = get(this, 'isBottomBar')
      ? get(this, 'currentPosition')
      : -1 * get(this, 'currentPosition');

    return htmlSafe(`transform: translateY(${position}px)`);
  }),

  // protected hooks -----------------------------------------------------------
  /**
   * Fires when the height of the bar changes
   * @param height Height of the bar in pixels
   * @param type Either 'top' or 'bottom'
   * @param isOverlay Whether the bar is an overlay or not
   */
  onHeightChange(){},

  /**
   * Fires when the bar is about to be destroyed
   * @param height 0
   * @param type Either 'top' or 'bottom'
   */
  onWillDestroy(){},

  // lifecycle events ----------------------------------------------------------
  didInsertElement(){
    this._super(...arguments);

    this.observedResize();

    if(!get(this, 'isLocked')){
      get(this, 'wrapperElement').addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      get(this, 'wrapperElement').addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    }
  },
  observedResize(){
    const height = get(this, 'element').offsetHeight;

    if(get(this, 'elementHeight') !== height){
      set(this, 'elementHeight', height);
      get(this, 'onHeightChange')(height, get(this, 'type'), get(this, 'isOverlay'));
    }
  },
  willDestroyElement(){
    this._super(...arguments);

    if(!get(this, 'isLocked')) {
      //something is broken here, when changing top/bottom these are likely not properly removed
      get(this, 'wrapperElement').removeEventListener('touchstart', this.onTouchStart.bind(this), {passive: true});
      get(this, 'wrapperElement').removeEventListener('touchend', this.onTouchEnd.bind(this), {passive: true});
    }

    get(this, 'onWillDestroy')(0, get(this, 'type'));
  },

  // events --------------------------------------------------------------------
  onTouchStart(){
    // TODO: check if target is not a mobile bar
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
