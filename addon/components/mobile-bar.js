import Component from '@ember/component';
import layout from '../templates/components/mobile-bar';

import { computed, get, set } from '@ember/object';
import RespondsToScroll from 'ember-responds-to/mixins/responds-to-scroll';

const STATE_CLOSED         = 1;
const STATE_MOVING_CLOSED  = 2;
const STATE_MOVING         = 3;
const STATE_MOVING_OPEN    = 4;
const STATE_OPEN           = 5;

export default Component.extend(RespondsToScroll, {
  layout,

  classNames: ['mobile-bar'],
  classNameBindings: [
    'isBottomBar:mobile-bar--bottom:mobile-bar--top',
    'isMoving:mobile-bar--dragging',
    'isOpen:mobile-bar--open',
    'isClosed:mobile-bar--closed'
  ],

  // public
  isLocked: true,
  height: 50,

  // protected
  wrapperElement: null,

  // private
  currentState: STATE_OPEN,
  currentPosition: 0,
  lastScrollTop: 0,

  isBottomBar: computed('type', function(){
    return get(this, 'type') === 'bottom';
  }),

  isOpen: computed('currentState', function(){
    const currentState = get(this, 'currentState');
    return currentState === STATE_OPEN
      || currentState === STATE_MOVING_OPEN;
  }),
  isMoving: computed('currentState', function(){
    const currentState = get(this, 'currentState');
    return currentState === STATE_MOVING
      || currentState === STATE_MOVING_CLOSED
      || currentState === STATE_MOVING_OPEN;
  }),
  isClosed: computed('currentState', function(){
    const currentState = get(this, 'currentState');
    return currentState === STATE_CLOSED
      || currentState === STATE_MOVING_CLOSED;
  }),

  didInsertElement(){
    this._super(...arguments);

    if(!get(this, 'isLocked')){
      //TODO: calculate velocity between touchstart/touchend to decide whether or not we need to close
      get(this, 'wrapperElement').addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      get(this, 'wrapperElement').addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    }
  },

  onTouchStart(){
    set(this, 'lastScrollTop', this.getScrollTop());
    this.toState(STATE_MOVING);
  },
  onTouchEnd(){
    this.transitionToFinalState();
  },

  willDestroyElement(){
    get(this, 'wrapperElement').removeEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    get(this, 'wrapperElement').removeEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
  },

  toState(state){
    if(state === STATE_OPEN || state === STATE_MOVING_OPEN) {
      set(this, 'currentPosition', 0);
      get(this, 'element').style.transform = `translateY(0)`;
    } else if(state === STATE_CLOSED || state === STATE_MOVING_CLOSED){
      set(this, 'currentPosition', get(this, 'height'));
      get(this, 'element').style.transform = `translateY(-${get(this, 'currentPosition')}px)`;
    }

    set(this, 'currentState', state);
  },
  transitionToFinalState(){
    const finalState = get(this, 'currentPosition') > get(this, 'height') / 2
      ? STATE_CLOSED
      : STATE_OPEN;

    //TODO: transition

    this.toState(finalState);
  },

  scroll(){
    const currentState = get(this, 'currentState');
    if(!get(this, 'isLocked') && get(this, 'isMoving')){
      const scrollTop = this.getScrollTop();
      let dy = scrollTop - get(this, 'lastScrollTop');
      set(this, 'lastScrollTop', scrollTop);

      this.setPosition(dy, currentState);
    }
  },

  setPosition(dy, currentState){
    let newPosition = get(this, 'currentPosition') + dy;

    if(newPosition <= 0){
      if(currentState !== STATE_MOVING_OPEN){
        this.toState(STATE_MOVING_OPEN);
      }

      return;
    } else if(newPosition >= get(this, 'height')){
      if(currentState !== STATE_MOVING_CLOSED){
        this.toState(STATE_MOVING_CLOSED);
      }

      return;
    } else if(get(this, 'currentState') !== STATE_MOVING) {
      this.toState(STATE_MOVING);
    }

    set(this, 'currentPosition', newPosition);

    if(get(this, 'currentState') === STATE_MOVING){
      get(this, 'element').style.transform = `translateY(-${get(this, 'currentPosition')}px)`;
    }
  },

  getScrollTop(){
    return window.scrollY || document.scrollingElement.scrollTop || document.documentElement.scrollTop;
  }
});
