import Component from '@ember/component';
import layout from '../templates/components/mobile-bar';

import { computed, get, set } from '@ember/object';
import RespondsToScroll from 'ember-responds-to/mixins/responds-to-scroll';

const STATE_CLOSED         = 1;
const STATE_MOVING_STANDBY = 2;
const STATE_MOVING_CLOSED  = 3;
const STATE_MOVING         = 4;
const STATE_MOVING_OPEN    = 5;
const STATE_OPEN           = 6;

export default Component.extend(RespondsToScroll, {
  layout,

  classNames: ['mobile-bar'],
  classNameBindings: [
    'isBottomBar:mobile-bar--bottom:mobile-bar--top',
    'isOpen:mobile-bar--open',
    'isClosed:mobile-bar--closed'
  ],

  isLocked: true,
  height: 50,

  currentState: STATE_OPEN,
  currentPosition: 0,
  lastScrollTop: 0,

  isBottomBar: computed('type', function(){
    return get(this, 'type') === 'bottom';
  }),

  isOpen: computed('currentState', function(){
    const currentState = get(this, 'currentState');
    return currentState === STATE_OPEN || currentState === STATE_MOVING_OPEN;
  }),
  isClosed: computed('currentState', function(){
    const currentState = get(this, 'currentState');
    return currentState === STATE_CLOSED || currentState === STATE_MOVING_CLOSED;
  }),

  update() {
    const currentState = get(this, 'currentState');

    if(currentState === STATE_MOVING
      || currentState === STATE_MOVING_CLOSED
      || currentState === STATE_MOVING_OPEN
      || currentState === STATE_MOVING_STANDBY
    ){
      let scrollTop = window.scrollY;
      let dy = scrollTop - get(this, 'lastScrollTop');

      //TODO: if scroll event and dy is 0 set dy to 1 / window.devicePixelRatio

      if(dy === 0 && get(this, 'touchMoveFired')){
        /*console.log(
          get(this, 'touchStartScrollTop'),
          scrollTop,
          ((get(this, 'lastTouchMove').clientY - get(this, 'firstTouchMove').clientY) + get(this, 'touchStartScrollTop')) - get(this, 'lastScrollTop'),
          //get(this, 'firstTouchMove').clientY,
          //get(this, 'lastTouchMove').clientY
        );*/
        //dy = 1 / window.devicePixelRatio;
        //scrollTop += dy;
      }// else {
      set(this, 'lastScrollTop', scrollTop);

      this.setPosition(dy, currentState);
      //}
      set(this, 'touchMoveFired', false);

      requestAnimationFrame(this.update.bind(this));
    }
  },

  didInsertElement(){
    this._super(...arguments);

    if(!get(this, 'isLocked')){
      get(this, 'wrapperElement').addEventListener('touchstart', (e) => { set(this, 'firstTouchMove', e.changedTouches[0]);this.toState(STATE_MOVING_STANDBY)}, { passive: true });
      get(this, 'wrapperElement').addEventListener('touchmove', (e) => this.didTouchMove(e), { passive: true });
      get(this, 'wrapperElement').addEventListener('touchend', () => this.transitionToFinalState(), { passive: true });
    }

    set(this, 'lastScrollTop', this.getScrollTop());
  },

  toState(state){
    const currentState = get(this, 'currentState');

    if(state === STATE_OPEN || state === STATE_MOVING_OPEN) {
      set(this, 'currentPosition', 0);

      this.$().css({
        //position: '',
        //top: get(this, 'currentPosition')
        transform: `translateY(0)`
      });
    } else if(state === STATE_MOVING_STANDBY){
      set(this, 'touchStartScrollTop', this.getScrollTop());
      this.update();
      set(this, 'lastScrollTop', this.getScrollTop());
    } else if(state === STATE_MOVING) {
      const options = {
        //position: 'absolute'
      };

      if (currentState !== STATE_MOVING) {
        options.top = this.getScrollTop() - get(this, 'currentPosition');
      }

      //this.$().css(options);
    } else if(state === STATE_CLOSED || state === STATE_MOVING_CLOSED){
      set(this, 'currentPosition', get(this, 'height'));

      this.$().css({
        //position: '',
        //top: -get(this, 'currentPosition')
        transform: `translateY(-${get(this, 'currentPosition')}px)`
      });
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
    if(!get(this, 'isLocked')){
      //console.log('scroll');
      //const scrollTop = this.getScrollTop();

      //console.log(get(this, 'lastScrollTop') === scrollTop);

      if(currentState === STATE_MOVING_STANDBY){
        //this causes a minor skip, but if we don't do this we jump up a little
        //const dy = scrollTop - get(this, 'lastScrollTop');
        //set(this, 'currentPosition', get(this, 'currentPosition') + dy);

        this.toState(STATE_MOVING);
      } else if(currentState === STATE_MOVING
        || currentState === STATE_MOVING_CLOSED
        || currentState === STATE_MOVING_OPEN
      ){
        /*const dy = scrollTop - get(this, 'lastScrollTop');

        if(dy !== 0) {
          set(this, 'lastScrollTop', scrollTop);
          this.setPosition(dy, currentState);
        }*/
      } else {
        //this fixes iOS, but breaks chrome/android
        this.toState(STATE_MOVING_STANDBY);
      }
    }
  },

  didTouchMove(e){
    //console.log('touchmove', e.changedTouches[0]);

    set(this, 'touchMoveFired', true);
    set(this, 'lastTouchMove', e.changedTouches[0]);
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

    //console.log(newPosition);

    if(get(this, 'currentState') === STATE_MOVING){
      this.$().css({
        transform: `translateY(-${get(this, 'currentPosition')}px)`
      });
    }
  },

  getScrollTop(){
    return document.scrollingElement.scrollTop || document.documentElement.scrollTop;
  }
});
