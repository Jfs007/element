import Popper from 'element-ui/src/utils/vue-popper';
import debounce from 'throttle-debounce/debounce';
import { getFirstComponentChild } from 'element-ui/src/utils/vdom';
import Vue from 'vue';

export default {
  name: 'ElTooltip',

  mixins: [Popper],

  props: {
    openDelay: {
      type: Number,
      default: 0
    },
    disabled: Boolean,
    manual: Boolean,
    effect: {
      type: String,
      default: 'dark'
    },
    popperClass: String,
    content: String,
    visibleArrow: {
      default: true
    },
    transition: {
      type: String,
      default: 'el-fade-in-linear'
    },
    popperOptions: {
      default() {
        return {
          boundariesPadding: 10,
          gpuAcceleration: false
        };
      }
    },
    enterable: {
      type: Boolean,
      default: true
    },
    hideAfter: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      timeoutPending: null,
      handlerAdded: false
    };
  },

  beforeCreate() {
    if (this.$isServer) return;

    this.popperVM = new Vue({
      data: { node: '' },
      render(h) {
        return this.node;
      }
    }).$mount();

    this.debounceClose = debounce(200, () => this.handleClosePopper());
  },

  render(h) {
    if (this.popperVM) {
      this.popperVM.node = (
        <transition
          name={ this.transition }
          onAfterLeave={ this.doDestroy }>
          <div
            onMouseleave={ () => { this.setExpectedState(false); this.debounceClose(); } }
            onMouseenter= { () => { this.setExpectedState(true); } }
            ref="popper"
            v-show={!this.disabled && this.showPopper}
            class={
              ['el-tooltip__popper', 'is-' + this.effect, this.popperClass]
            }>
            { this.$slots.content || this.content }
          </div>
        </transition>);
    }

    if (!this.$slots.default || !this.$slots.default.length) return this.$slots.default;

    const vnode = getFirstComponentChild(this.$slots.default);
    if (!vnode || this.handlerAdded) return vnode;
    const data = vnode.data = vnode.data || {};
    const on = vnode.data.on = vnode.data.on || {};
    const nativeOn = vnode.data.nativeOn = vnode.data.nativeOn || {};

    on.mouseenter = this.addEventHandle(on.mouseenter, () => { this.setExpectedState(true); this.handleShowPopper(); });
    on.mouseleave = this.addEventHandle(on.mouseleave, () => { this.setExpectedState(false); this.debounceClose(); });
    nativeOn.mouseenter = this.addEventHandle(nativeOn.mouseenter, () => { this.setExpectedState(true); this.handleShowPopper(); });
    nativeOn.mouseleave = this.addEventHandle(nativeOn.mouseleave, () => { this.setExpectedState(false); this.debounceClose(); });
    data.staticClass = this.concatClass(data.staticClass, 'el-tooltip');

    return vnode;
  },

  mounted() {
    this.referenceElm = this.$el;
  },

  methods: {
    addEventHandle(old, fn) {
      this.handlerAdded = true;
      return old ? Array.isArray(old) ? old.concat(fn) : [old, fn] : fn;
    },

    concatClass(a, b) {
      if (a && a.indexOf(b) > -1) return a;
      return a ? b ? (a + ' ' + b) : a : (b || '');
    },

    handleShowPopper() {
      if (!this.expectedState || this.manual) return;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.showPopper = true;
      }, this.openDelay);

      if (this.hideAfter > 0) {
        this.timeoutPending = setTimeout(() => {
          this.showPopper = false;
        }, this.hideAfter);
      }
    },

    handleClosePopper() {
      if (this.enterable && this.expectedState || this.manual) return;
      clearTimeout(this.timeout);

      if (this.timeoutPending) {
        clearTimeout(this.timeoutPending);
      }
      this.showPopper = false;
    },

    setExpectedState(expectedState) {
      if (expectedState === false) {
        clearTimeout(this.timeoutPending);
      }
      this.expectedState = expectedState;
    }
  }
};
