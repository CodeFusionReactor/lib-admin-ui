namespace api.ui.dialog {

    import DivEl = api.dom.DivEl;
    import Action = api.ui.Action;
    import Element = api.dom.Element;
    import ResponsiveManager = api.ui.responsive.ResponsiveManager;
    import ResponsiveItem = api.ui.responsive.ResponsiveItem;
    import Body = api.dom.Body;
    import i18n = api.util.i18n;

    export interface ConfirmationConfig {
        question?: string;
        yesCallback: () => void;
        noCallback?: () => void;
    }

    export interface ModalDialogConfig {
        title?: string;
        buttonRow?: ButtonRow;
        confirmation?: ConfirmationConfig;
        closeIconCallback?: () => void;
    }

    export class ModalDialog extends DivEl {

        protected header: api.ui.dialog.ModalDialogHeader;

        private body: api.dom.DivEl;

        private contentPanel: ModalDialogContentPanel;

        private buttonRow: ButtonRow;

        private cancelAction: Action;

        protected closeIcon: DivEl;

        protected confirmationDialog: ConfirmationDialog;

        private static openDialogsCounter: number = 0;

        private tabbable: api.dom.Element[];

        private listOfClickIgnoredElements: api.dom.Element[] = [];

        private onClosedListeners: {(): void;}[] = [];

        private closeIconCallback: () => void;

        private clickOutsideCallback: () => void;

        private height: number = 0;

        public static debug: boolean = false;

        constructor(config: ModalDialogConfig = <ModalDialogConfig>{}) {
            super('modal-dialog', api.StyleHelper.COMMON_PREFIX);

            this.buttonRow = config.buttonRow || new ButtonRow();

            this.cancelAction = this.createDefaultCancelAction();
            this.closeIconCallback = config.closeIconCallback || (() => {
                    if (this.cancelAction) {
                        this.cancelAction.execute();
                    } else {
                        this.close();
                    }
                });

            this.clickOutsideCallback = (() => {
                this.confirmBeforeClose();
            });

            this.closeIcon = new DivEl('cancel-button-top');
            this.closeIcon.onClicked(this.closeIconCallback);

            this.header = this.createHeader(config.title || '');

            this.contentPanel = new ModalDialogContentPanel();

            this.body = new DivEl('modal-dialog-body');
            this.body.appendChildren(this.closeIcon, this.contentPanel);

            let footer = new DivEl('modal-dialog-footer');
            footer.appendChild(this.buttonRow);

            let wrapper = new DivEl('modal-dialog-wrapper');
            wrapper.appendChildren<Element>(this.header, this.body, footer);

            this.appendChild(wrapper);

            this.initConfirmationDialog(config.confirmation);
            this.initListeners();
        }

        protected getBody(): api.dom.DivEl {
            return this.body;
        }

        onCloseButtonClicked(listener: (e: MouseEvent) => void) {
            return this.closeIcon.onClicked(listener);
        }

        private initConfirmationDialog(confirmation: ConfirmationConfig) {
            if (confirmation) {
                const {yesCallback, noCallback, question = i18n('dialog.confirm.applyChanges')} = confirmation;

                this.confirmationDialog = new ConfirmationDialog()
                    .setQuestion(question)
                    .setYesCallback(yesCallback || (() => {
                            this.close();
                        }));
                if (noCallback) {
                    this.confirmationDialog.setNoCallback(noCallback);
                }

                this.confirmationDialog.onClosed(() => this.removeClass('await-confirmation'));
            }
        }

        private toggleHeightClass() {
            const dialogHeight = this.getEl().getHeightWithBorder();

            if (dialogHeight === 0 || Math.abs(this.height - dialogHeight) <= 1) {
                return;
            }

            this.height = dialogHeight;

            if (Math.abs(dialogHeight % 2) == 1) {
                this.getEl().toggleClass('uneven-height', !this.getEl().hasClass('uneven-height'));
            }
        }

        private initListeners() {
            const resizeObserver = window['ResizeObserver'];
            const responsiveItem: ResponsiveItem = new ResponsiveItem(this);
            const resizeHandler = () => {
                this.toggleHeightClass();
                responsiveItem.update();
            };
            if (resizeObserver) {
                new resizeObserver(resizeHandler).observe(this.body.getHTMLElement());
            }

            ResponsiveManager.onAvailableSizeChanged(Body.get(), resizeHandler);

            this.handleClickOutsideDialog();
            this.handleFocusInOutEvents();
        }

        private isActive() {
            return super.isVisible() && !this.hasClass('masked');
        }

        private handleClickOutsideDialog() {
            const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
                const noConfirmationDialog = !this.confirmationDialog || !this.confirmationDialog.isVisible();
                if (this.isActive() && noConfirmationDialog) {
                    for (let element = event.target; element; element = (<any>element).parentNode) {
                        if (element === this.getHTMLElement() || this.isIgnoredElementClicked(<any>element)) {
                            return;
                        }
                    }
                    this.clickOutsideCallback();
                }
            };

            this.onRemoved(() => {
                api.dom.Body.get().unMouseDown(mouseClickListener);
            });

            this.onAdded(() => {
                api.dom.Body.get().onMouseDown(mouseClickListener);
            });
        }

        private handleFocusInOutEvents() {
            let buttonRowIsFocused: boolean = false;
            let buttonRowFocusOutTimeout: number;
            const focusOutTimeout: number = 10;

            this.onMouseDown(() => {
                buttonRowIsFocused = false; // making dialog focusOut event give focus to last tabbable elem
            });

            api.util.AppHelper.focusInOut(this, () => {
                if (this.hasTabbable() && !this.hasSubDialog()) {
                    // last focusable - Cancel
                    // first focusable - X
                    if (buttonRowIsFocused) { // last element lost focus
                        this.tabbable[0].giveFocus();
                    } else {
                        this.tabbable[this.tabbable.length - 1].giveFocus();
                    }
                }
            }, focusOutTimeout, false);

            this.buttonRow.onFocusIn(() => {
                buttonRowIsFocused = true;
                clearTimeout(buttonRowFocusOutTimeout);
            });

            this.buttonRow.onFocusOut(() => {
                buttonRowFocusOutTimeout = setTimeout(() => {
                    buttonRowIsFocused = false;
                }, focusOutTimeout + 5); // timeout should be > timeout for modal dialog to trigger after
            });
        }

        protected createHeader(title: string): api.ui.dialog.ModalDialogHeader {
            return new api.ui.dialog.ModalDialogHeader(title);
        }

        addClickIgnoredElement(elem: api.dom.Element) {
            this.listOfClickIgnoredElements.push(elem);
        }

        removeClickIgnoredElement(elem: api.dom.Element) {
            const elementIndex = this.listOfClickIgnoredElements.indexOf(elem);
            if (elementIndex > -1) {
                delete this.listOfClickIgnoredElements.splice(elementIndex, 1);
            }
        }

        private isIgnoredElementClicked(element: HTMLElement): boolean {
            let ignoredElementClicked = false;
            if (element && element.className && element.className.indexOf) {
                ignoredElementClicked = element.className.indexOf('mce-') > -1 || element.className.indexOf('html-area-modal-dialog') > -1;
            }
            ignoredElementClicked = ignoredElementClicked || this.listOfClickIgnoredElements.some((elem: api.dom.Element) => {
                    return elem.getHTMLElement() === element || elem.getEl().contains(element);
                });
            return ignoredElementClicked;
        }

        private createDefaultCancelAction() {
            let cancelAction = new Action(i18n('action.cancel'), 'esc', true);
            cancelAction.setIconClass('cancel-button-top');
            cancelAction.setLabel('');
            cancelAction.onExecuted(() => {
                this.close();
            });
            this.buttonRow.addToActions(cancelAction);
            return cancelAction;
        }

        getCancelAction(): Action {
            return this.cancelAction;
        }

        addCancelButtonToBottom(buttonLabel: string = i18n('action.cancel')): DialogButton {
            let cancelAction = new Action(buttonLabel);
            cancelAction.setIconClass('cancel-button-bottom force-enabled');
            cancelAction.onExecuted(() => this.cancelAction.execute());

            const cancelButton = this.buttonRow.addAction(cancelAction);
            cancelButton.getEl().setAttribute('data-button-text', i18n('action.ok'));
            return cancelButton;
        }

        setTitle(value: string, escapeHtml: boolean = true) {
            this.header.setTitle(value, escapeHtml);
        }

        appendChildToContentPanel(child: api.dom.Element) {
            this.contentPanel.appendChild(child);
        }

        prependChildToContentPanel(child: api.dom.Element) {
            this.contentPanel.prependChild(child);
        }

        appendChildToHeader(child: api.dom.Element) {
            this.header.appendChild(child);
        }

        prependChildToHeader(child: api.dom.Element) {
            this.header.prependChild(child);
        }

        removeChildFromContentPanel(child: api.dom.Element) {
            this.contentPanel.removeChild(child);
        }

        addAction(action: Action, useDefault?: boolean, prepend?: boolean): DialogButton {
            return this.buttonRow.addAction(action, useDefault, prepend);
        }

        removeAction(actionButton: DialogButton) {
            if (!actionButton) {
                return;
            }

            const action = actionButton.getAction();

            this.buttonRow.removeAction(action);
        }

        show() {
            api.dom.Body.get().getHTMLElement().classList.add('modal-dialog');
            super.show();
            this.buttonRow.focusDefaultAction();
        }

        hide() {
            api.dom.Body.get().getHTMLElement().classList.remove('modal-dialog');
            super.hide(true);
        }

        getButtonRow(): ButtonRow {
            return this.buttonRow;
        }

        getContentPanel(): ModalDialogContentPanel {
            return this.contentPanel;
        }

        protected hasSubDialog(): boolean {
            // html area can spawn sub dialogs so check none is open
            return !!api.util.htmlarea.dialog.HTMLAreaDialogHandler.getOpenDialog() ||
                   (this.confirmationDialog && this.confirmationDialog.isVisible());
        }

        private hasTabbable(): boolean {
            return !!this.tabbable && this.tabbable.length > 0;
        }

        updateTabbable() {
            this.tabbable = this.getTabbableElements();
        }

        private getTabbedIndex(): number {
            let activeElement = document.activeElement;
            let tabbedIndex = 0;
            if (this.hasTabbable()) {
                for (let i = 0; i < this.tabbable.length; i++) {
                    if (activeElement === this.tabbable[i].getHTMLElement()) {
                        tabbedIndex = i;
                        break;
                    }
                }
            }
            return tabbedIndex;
        }

        private focusNextTabbable() {
            if (this.hasTabbable()) {
                let tabbedIndex = this.getTabbedIndex();
                tabbedIndex = tabbedIndex + 1 >= this.tabbable.length ? 0 : tabbedIndex + 1;
                this.tabbable[tabbedIndex].giveFocus();
            }
        }

        private focusPreviousTabbable() {
            if (this.hasTabbable()) {
                let tabbedIndex = this.getTabbedIndex();
                tabbedIndex = tabbedIndex - 1 < 0 ? this.tabbable.length - 1 : tabbedIndex - 1;
                this.tabbable[tabbedIndex].giveFocus();
            }
        }

        open() {

            api.ui.mask.BodyMask.get().show();

            api.ui.KeyBindings.get().shelveBindings();

            this.show();

            let keyBindings = Action.getKeyBindings(this.buttonRow.getActions());

            this.updateTabbable();

            keyBindings = keyBindings.concat([
                new KeyBinding('right', (event) => {
                    this.focusNextTabbable();

                    event.stopPropagation();
                    event.preventDefault();
                }),
                new KeyBinding('left', (event) => {
                    this.focusPreviousTabbable();

                    event.stopPropagation();
                    event.preventDefault();
                })
            ]);

            api.ui.KeyBindings.get().bindKeys(keyBindings);

            ModalDialog.openDialogsCounter++;
        }

        isDirty(): boolean {
            return false;
        }

        confirmBeforeClose() {
            if (this.confirmationDialog && this.isDirty()) {
                this.confirmationDialog.open();
                this.addClass('await-confirmation');
            } else {
                this.close();
            }
        }

        close() {
            const isSingleDialogGroup = ModalDialog.openDialogsCounter === 1 ||
                                        (ModalDialog.openDialogsCounter === 2 && !!this.confirmationDialog);
            if (isSingleDialogGroup) {
                api.ui.mask.BodyMask.get().hide();
            }

            this.hide();

            api.ui.KeyBindings.get().unshelveBindings();

            ModalDialog.openDialogsCounter--;
            this.notifyClosed();
        }

        onClosed(onCloseCallback: () => void) {
            this.onClosedListeners.push(onCloseCallback);
        }

        unClosed(listener: {(): void;}) {
            this.onClosedListeners = this.onClosedListeners.filter(function (curr: {(): void;}) {
                return curr !== listener;
            });
        }

        private notifyClosed() {
            this.onClosedListeners.forEach((listener) => {
                listener();
            });
        }
    }

    export class ModalDialogHeader extends DivEl {

        private titleEl: api.dom.H2El;

        constructor(title: string) {
            super('modal-dialog-header');

            this.titleEl = new api.dom.H2El('title');
            this.titleEl.setHtml(title);
            this.appendChild(this.titleEl);
        }

        setTitle(value: string, escapeHtml: boolean = true) {
            this.titleEl.setHtml(value, escapeHtml);
        }

        appendElement(el: Element) {
            el.insertAfterEl(this.titleEl);
        }
    }

    export class ModalDialogContentPanel extends DivEl {

        constructor() {
            super('dialog-content');
        }
    }

    export class ButtonRow extends DivEl {

        private defaultElement: api.dom.Element;

        private buttonContainer: DivEl;

        private actions: Action[] = [];

        constructor() {
            super('dialog-buttons');

            this.buttonContainer = new DivEl('button-container');
            this.appendChild(this.buttonContainer);
        }

        addElement(element: Element) {
            this.buttonContainer.appendChild(element);
        }

        getActions(): Action[] {
            return this.actions;
        }

        addToActions(action: Action) {
            this.actions.push(action);
        }

        addAction(action: Action, useDefault?: boolean, prepend?: boolean): DialogButton {
            const button = new DialogButton(action);
            if (useDefault) {
                this.setDefaultElement(button);
            }

            if (prepend) {
                this.buttonContainer.prependChild(button);
            } else {
                this.buttonContainer.appendChild(button);
            }

            action.onPropertyChanged(() => {
                button.setLabel(action.getLabel());
                button.setEnabled(action.isEnabled());
            });

            this.actions.push(action);

            return button;
        }

        removeAction(action: Action) {
            const index = this.actions.indexOf(action);
            if (index >= 0) {
                this.actions.splice(index, 1);
            }

            this.buttonContainer.getChildren()
                .filter((button: DialogButton) => button.getAction() == action)
                .forEach((button: DialogButton) => {
                    if (this.defaultElement == button) {
                        this.resetDefaultElement();
                    }
                    this.buttonContainer.removeChild(button);
                });
        }

        setDefaultElement(element: api.dom.Element) {
            this.defaultElement = element;
        }

        resetDefaultElement() {
            this.defaultElement = null;
        }

        focusDefaultAction() {
            if (this.defaultElement) {
                this.defaultElement.giveFocus();
            }
        }
    }

}
