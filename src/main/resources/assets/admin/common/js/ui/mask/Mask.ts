namespace api.ui.mask {

    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    export class Mask extends api.dom.DivEl {

        private masked: api.dom.Element;

        constructor(itemToMask?: api.dom.Element) {
            super('mask', api.StyleHelper.COMMON_PREFIX);

            this.masked = itemToMask;

            if (this.masked) {
                // pass the mousewheel event to the masked element to be able to scroll
                this.onMouseWheel((event: WheelEvent) => {

                    let evt = this.cloneWheelEvent(event);
                    this.masked.getHTMLElement().dispatchEvent(evt);

                    if (this.isBrowserFirefox()) { //scrolling manually ff as dispatch event not working
                        this.triggerScroll(event);
                    }

                });

                this.masked.onHidden((event: api.dom.ElementHiddenEvent) => {
                    if (event.getTarget() === this.masked) {
                        this.hide();
                    }
                });
                this.masked.onRemoved(() => this.remove());
                // Masked element might have been resized on window resize
                ResponsiveManager.onAvailableSizeChanged(api.dom.Body.get(), () => {
                    if (this.isVisible()) {
                        this.positionOver(this.masked);
                    }
                });
            }
            api.dom.Body.get().appendChild(this);
        }

        private cloneWheelEvent(e: WheelEvent): WheelEvent {
            return api.ObjectHelper.create(WheelEvent, e.type, {
                bubbles: e.bubbles,
                cancelable: e.cancelable,
                cancelBubble: e.cancelBubble,
                view: e.view,
                detail: e.detail,
                screenX: e.screenX,
                screenY: e.screenY,
                clientX: e.clientX,
                clientY: e.clientY,
                layerX: e.layerX,
                layerY: e.layerY,
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                shiftKey: e.shiftKey,
                metaKey: e.metaKey,
                button: e.button,
                relatedTarget: e.relatedTarget
            });
        }

        show() {
            super.show();
            if (this.masked) {
                this.positionOver(this.masked);
            }
        }

        private positionOver(masked: api.dom.Element) {
            const maskedEl = masked.getEl();
            const maskEl = this.getEl();
            let maskedOffset: {top:number; left: number};
            const wrapperEl = wemjq(maskEl.getHTMLElement()).closest('.mask-wrapper');
            let isMaskedPositioned = maskedEl.getPosition() !== 'static';
            let maskedDimensions: {width: string; height: string} = {
                    width: maskedEl.getWidthWithBorder() + 'px',
                    height: (wrapperEl.length ? wrapperEl.innerHeight() : maskedEl.getHeightWithBorder()) + 'px'
                };

            if (masked.contains(this) && isMaskedPositioned) {
                // mask is inside masked element & it is positioned
                maskedOffset = {
                    top: 0,
                    left: 0
                };

                if (maskedEl.getPosition() === 'absolute') {
                    maskedDimensions = {
                        width: '100%',
                        height: '100%'
                    };
                }
            } else {
                // mask is outside masked element
                let maskedParent = wrapperEl.length ? wrapperEl[0] : maskedEl.getOffsetParent();
                let maskParent = maskEl.getOffsetParent();

                maskedOffset = maskedEl.getOffsetToParent();

                if (maskedParent !== maskParent) {
                    // they have different offset parents so calc the difference
                    let maskedParentOffset = new api.dom.ElementHelper(maskedParent).getOffset();
                    let maskParentOffset = new api.dom.ElementHelper(maskParent).getOffset();

                    maskedOffset.left = maskedOffset.left + (maskedParentOffset.left - maskParentOffset.left);
                    maskedOffset.top = maskedOffset.top + (maskedParentOffset.top - maskParentOffset.top);
                }

                if (!isMaskedPositioned) {
                    // account for margins if masked is positioned statically
                    maskedOffset.top += maskedEl.getMarginTop();
                    maskedOffset.left += maskedEl.getMarginLeft();
                }
            }

            this.getEl().
                setTopPx(wrapperEl.length ? wrapperEl.position().top : Math.max(maskedOffset.top, 0)).
                setLeftPx(wrapperEl.length ? wrapperEl.position().left : maskedOffset.left).
                setWidth(maskedDimensions.width).
                setHeight(maskedDimensions.height);
        }

        private isBrowserFirefox(): boolean {
            return /Firefox/i.test(navigator.userAgent);
        }

        private triggerScroll(event: WheelEvent) {
            wemjq(this.masked.getHTMLElement()).stop().animate({
                // converting ff wheel deltaY from lines to px (approximate)
                scrollTop: this.masked.getHTMLElement().scrollTop + event.deltaY * 25
            }, 600 / Math.abs(event.deltaY), 'linear');
        }

    }

}
