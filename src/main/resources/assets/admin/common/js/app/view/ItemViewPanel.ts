namespace api.app.view {

    export class ItemViewPanel<M extends api.Equitable> extends api.ui.panel.Panel implements api.ui.Closeable {

        private toolbar: api.ui.toolbar.Toolbar;

        private panel: api.ui.panel.Panel;

        private browseItem: ViewItem<M>;

        private closedListeners: {(event: ItemViewClosedEvent<M>):void}[] = [];

        constructor() {
            super('item-view-panel');
        }

        setToolbar(toolbar: api.ui.toolbar.Toolbar) {
            this.toolbar = toolbar;
            this.appendChild(this.toolbar);
        }

        setPanel(panel: api.ui.panel.Panel) {
            this.panel = panel;
            this.appendChild(this.panel);
        }

        /*
         As long as the close action is excluded from the toolbar,
         we should add it along with the other toolbar actions to be able to close tabs.
         */
        getActions(): api.ui.Action[] {
            return [];
        }

        setItem(item: ViewItem<M>) {
            this.browseItem = item;
        }

        getItem(): ViewItem<M> {
            return this.browseItem;
        }

        close(checkCanClose: boolean = false) {
            if (!checkCanClose || this.canClose()) {
                this.notifyClosed();
            }
        }

        canClose(): boolean {
            return true;
        }

        onClosed(listener: (event: ItemViewClosedEvent<M>)=>void) {
            this.closedListeners.push(listener);
        }

        unClosed(listener: (event: ItemViewClosedEvent<M>)=>void) {
            this.closedListeners = this.closedListeners.filter((currentListener: (event: ItemViewClosedEvent<M>)=>void) => {
                return currentListener !== listener;
            });
        }

        private notifyClosed() {
            this.closedListeners.forEach((listener: (event: ItemViewClosedEvent<M>)=>void) => {
                listener.call(this, new ItemViewClosedEvent(this));
            });
        }

    }

}
