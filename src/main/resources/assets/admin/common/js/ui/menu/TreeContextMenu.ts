namespace api.ui.menu {

    export class TreeContextMenu
        extends api.dom.DlEl {
        private itemClickListeners: { (item: TreeMenuItem): void }[] = [];

        private actions: api.ui.Action[] = [];

        constructor(actions?: api.ui.Action[], appendToBody: boolean = true) {
            super('context-menu');

            if (actions) {
                actions.sort(function (action1: api.ui.Action, action2: api.ui.Action) {
                    return action1.getSortOrder() - action2.getSortOrder();
                }).forEach((action: api.ui.Action) => {
                    this.addAction(action);
                });
            }

            if (appendToBody) {
                api.dom.Body.get().appendChild(this);
                api.dom.Body.get().onClicked((event: MouseEvent) => this.hideMenuOnOutsideClick(event));
            }

            this.onClicked((e: MouseEvent) => {
                // menu itself was clicked so do nothing
                e.preventDefault();
                e.stopPropagation();
            });
        }

        private addAction(action: api.ui.Action): TreeMenuItem {
            let childActions = action.getChildActions();
            let menuItem = this.createMenuItem(action);
            let subItems = [];
            this.appendChild(menuItem);
            this.actions.push(action);

            if (childActions.length > 0) {
                for (let i = 0; i < childActions.length; i++) {
                    subItems.push(this.addAction(childActions[i]));
                }
                menuItem.onClicked(() => {
                    for (let i = 0; i < subItems.length; i++) {
                        subItems[i].toggleExpand();
                    }
                });
            } else {

                menuItem.onClicked((event: MouseEvent) => {
                    this.notifyItemClicked();

                    event.preventDefault();
                    event.stopPropagation();
                });
            }
            action.onPropertyChanged(changedAction => {
                menuItem.setEnabled(changedAction.isEnabled());
                menuItem.setVisible(changedAction.isVisible());
            });

            return menuItem;
        }

        addActions(actions: api.ui.Action[]): TreeContextMenu {
            actions.forEach((action) => {
                this.addAction(action);
            });
            return this;
        }

        setActions(actions: api.ui.Action[]): TreeContextMenu {
            this.removeChildren();
            this.clearActionListeners();

            this.actions = [];

            this.addActions(actions);
            return this;
        }

        clearActionListeners() {
            this.actions.forEach((action) => {
                action.clearListeners();
            });
        }

        onItemClicked(listener: () => void) {
            this.itemClickListeners.push(listener);
        }

        unItemClicked(listener: () => void) {
            this.itemClickListeners = this.itemClickListeners.filter((currentListener: () => void) => {
                return listener !== currentListener;
            });
        }

        private notifyItemClicked() {
            this.itemClickListeners.forEach((listener: () => void) => {
                listener();
            });
        }

        onBeforeAction(listener: (action: api.ui.Action) => void) {
            this.actions.forEach((action: api.ui.Action) => {
                action.onBeforeExecute(listener);
            });
        }

        onAfterAction(listener: (action: api.ui.Action) => void) {
            this.actions.forEach((action: api.ui.Action) => {
                action.onAfterExecute(listener);
            });
        }

        showAt(x: number, y: number) {
            // referencing through prototype to be able to call this function with context other than this
            // i.e this.showAt.call(other, x, y)
            TreeContextMenu.prototype.doMoveTo(this, x, y);
            this.show();
        }

        moveBy(dx: number, dy: number) {
            let offset = this.getEl().getOffsetToParent();
            // referencing through prototype to be able to call this function with context other than this
            // i.e this.moveBy.call(other, x, y)
            TreeContextMenu.prototype.doMoveTo(this, offset.left + dx, offset.top + dy);
        }

        private doMoveTo(menu: TreeContextMenu, x: number, y: number) {
            menu.getEl().setLeftPx(x).setTopPx(y);
        }

        private createMenuItem(action: api.ui.Action): TreeMenuItem {
            return new TreeMenuItem(action, action.getIconClass());
        }

        private hideMenuOnOutsideClick(evt: Event): void {
            if (!this.getEl().contains(<HTMLElement> evt.target)) {
                // click outside menu
                this.hide();
            }
        }
    }

}
