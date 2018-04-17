module api.form.inputtype.text {
    import eventInfo = CKEDITOR.eventInfo;
    import support = api.form.inputtype.support;
    import Property = api.data.Property;
    import Value = api.data.Value;
    import ValueType = api.data.ValueType;
    import ValueTypes = api.data.ValueTypes;
    import Element = api.dom.Element;
    import HTMLAreaBuilder = api.util.htmlarea.editor.HTMLAreaBuilder;
    import HTMLAreaHelper = api.util.htmlarea.editor.HTMLAreaHelper;
    import _HTMLAreaBuilder = api.util.htmlarea.editor.HTMLAreaBuilderCKE;
    import HTMLAreaHelperCKE = api.util.htmlarea.editor.HTMLAreaHelperCKE;
    import ApplicationKey = api.application.ApplicationKey;
    import Promise = Q.Promise;
    import AppHelper = api.util.AppHelper;
    declare var CONFIG;

    export class HtmlArea
        extends support.BaseInputTypeNotManagingAdd {

        private editors: HtmlAreaOccurrenceInfo[];
        private content: api.content.ContentSummary;
        private contentPath: api.content.ContentPath;
        private applicationKeys: ApplicationKey[];

        private focusListeners: { (event: FocusEvent): void }[] = [];

        private blurListeners: { (event: FocusEvent): void }[] = [];

        private authRequest: Promise<void>;
        private editableSourceCode: boolean;
        private inputConfig: any;

        private isCKEditor: boolean;

        constructor(config: api.content.form.inputtype.ContentInputTypeViewContext) {

            super(config);

            this.isCKEditor = this.isNew();
            this.addClass('html-area');
            this.editors = [];
            this.contentPath = config.contentPath;
            this.content = config.content;
            this.applicationKeys = config.site ? config.site.getApplicationKeys() : [];

            this.inputConfig = config.inputConfig;

            this.authRequest =
                new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
                    this.editableSourceCode = loginResult.isContentExpert();
                });
        }

        private isNew() {
            const isNewRegExp = /^true$/i;

            return isNewRegExp.test(this.getContext().inputConfig.new && this.getContext().inputConfig.new[0].value);
        }

        getValueType(): ValueType {
            return ValueTypes.STRING;
        }

        newInitialValue(): Value {
            return super.newInitialValue() || ValueTypes.STRING.newValue('');
        }

        createInputOccurrenceElement(index: number, property: Property): api.dom.Element {
            if (!ValueTypes.STRING.equals(property.getType())) {
                property.convertValueType(ValueTypes.STRING);
            }

            let value = this.isCKEditor
                ? HTMLAreaHelperCKE.prepareImgSrcsInValueForEdit(property.getString())
                : HTMLAreaHelper.prepareImgSrcsInValueForEdit(property.getString());
            let textAreaEl = new api.ui.text.TextArea(this.getInput().getName() + '-' + index, value);

            let editorId = textAreaEl.getId();

            let clazz = editorId.replace(/\./g, '_');
            textAreaEl.addClass(clazz);

            let textAreaWrapper = new api.dom.DivEl();

            this.editors.push({id: editorId, textAreaWrapper, textAreaEl, property, hasStickyToolbar: false});

            textAreaEl.onRendered(() => {
                if (this.authRequest.isFulfilled()) {
                    this.initEditor(editorId, property, textAreaWrapper);
                } else {
                    this.authRequest.then(() => {
                        this.initEditor(editorId, property, textAreaWrapper);
                    });
                }
            });
            textAreaEl.onRemoved(() => {
                this.destroyEditor(editorId);
            });

            textAreaWrapper.appendChild(textAreaEl);

            this.setFocusOnEditorAfterCreate(textAreaWrapper, editorId);

            return textAreaWrapper;
        }

        updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly: boolean) {
            let textArea = <api.ui.text.TextArea> occurrence.getFirstChild();
            let id = textArea.getId();

            if (!unchangedOnly || !textArea.isDirty()) {
                this.setEditorContent(id, property);
            }
        }

        resetInputOccurrenceElement(occurrence: api.dom.Element) {
            occurrence.getChildren().forEach((child) => {
                if (ObjectHelper.iFrameSafeInstanceOf(child, api.ui.text.TextArea)) {
                    (<api.ui.text.TextArea>child).resetBaseValues();
                }
            });
        }

        private initEditor(id: string, property: Property, textAreaWrapper: Element): void {
            let focusedEditorCls = 'html-area-focused';
            let assetsUri = CONFIG.assetsUri;

            let focusHandler = (e) => {
                this.resetInputHeight();
                textAreaWrapper.addClass(focusedEditorCls);

                this.notifyFocused(e);

                AppHelper.dispatchCustomEvent('focusin', this);
                new api.ui.selector.SelectorOnBlurEvent(this).fire();
            };

            const notifyValueChanged = () => {
                if (!this.getEditor(id)) {
                    return;
                }
                this.notifyValueChanged(id, textAreaWrapper);
                new HtmlAreaResizeEvent(this).fire();
            };

            let isMouseOverRemoveOccurenceButton = false;

            let blurHandler = (e) => {
                //checking if remove occurence button clicked or not
                AppHelper.dispatchCustomEvent('focusout', this);

                if (!isMouseOverRemoveOccurenceButton) {
                    this.setStaticInputHeight();
                    textAreaWrapper.removeClass(focusedEditorCls);
                }
                this.notifyBlurred(e);
            };

            let keydownHandler = (e) => {
                if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {  // Cmd-S or Ctrl-S
                    e.preventDefault();

                    // as editor resides in a frame - propagate event via wrapping element
                    wemjq(this.getEl().getHTMLElement()).simulate(e.type, {
                        bubbles: e.bubbles,
                        cancelable: e.cancelable,
                        view: parent,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        shiftKey: e.shiftKey,
                        metaKey: e.metaKey,
                        keyCode: e.keyCode,
                        charCode: e.charCode
                    });
                } else if ((e.altKey) && e.keyCode === 9) { // alt+tab for OSX
                    e.preventDefault();
                    // the one that event is triggered from
                    let htmlAreaIframe = wemjq(textAreaWrapper.getHTMLElement()).find('iframe').get(0);
                    // check if focused element is html area that triggered event
                    const activeElement = this.isNotActiveElement(htmlAreaIframe) ? htmlAreaIframe : <HTMLElement>document.activeElement;
                    const focusedEl = api.dom.Element.fromHtmlElement(activeElement);
                    const isShift = e.shiftKey;
                    let nextFocusable;
                    if (!isShift) {
                        nextFocusable = api.dom.FormEl.getNextFocusable(focusedEl, 'iframe, input, select');
                    } else {
                        nextFocusable = api.dom.FormEl.getPrevFocusable(focusedEl, 'iframe, input, select');
                    }

                    if (nextFocusable) {
                        // if iframe is next focusable then it is a html area and using it's own focus method
                        if (this.isIframe(nextFocusable)) {
                            let nextId = nextFocusable.getId().replace('_ifr', '');
                            this.getEditor(nextId).focus();
                        } else {
                            nextFocusable.giveFocus();
                        }
                    }
                }
            };

            let createDialogHandler = event => {
                api.util.htmlarea.dialog.HTMLAreaDialogHandler.createAndOpenDialog(event);
                textAreaWrapper.addClass(focusedEditorCls);
            };

            if (this.isCKEditor) {
                const ckeKeydownHandler = (ckEvent: eventInfo) => {
                    const e: KeyboardEvent = ckEvent.data.domEvent.$;
                    keydownHandler(e);
                };

                const editor = new _HTMLAreaBuilder()
                    .setEditorContainerId(id)
                    .setAssetsUri(assetsUri)
                    .setInline(false)
                    .onCreateDialog(createDialogHandler)
                    .setFocusHandler(focusHandler.bind(this))
                    .setBlurHandler(blurHandler.bind(this))
                    .setKeydownHandler(ckeKeydownHandler)
                    .setNodeChangeHandler(notifyValueChanged)
                    .setContentPath(this.contentPath)
                    .setContent(this.content)
                    .setApplicationKeys(this.applicationKeys)
                    .setTools({
                        include: this.inputConfig['include'],
                        exclude: this.inputConfig['exclude']
                    })
                    .setEditableSourceCode(this.editableSourceCode)
                    .createEditor();

                editor.on('loaded', () => {
                    this.setEditorContent(id, property);

                    if (this.notInLiveEdit()) {
                        if (api.BrowserHelper.isIE()) {
                            this.setupStickyEditorToolbarForInputOccurence(textAreaWrapper, id);
                        }
                    }

                    this.removeTooltipFromEditorArea(textAreaWrapper);

                    this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__maximize');
                    this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__sourcedialog');

                    const removeButtonEL = wemjq(textAreaWrapper.getParentElement().getParentElement().getHTMLElement()).find(
                        '.remove-button')[0];
                    removeButtonEL.addEventListener('mouseover', () => {
                        isMouseOverRemoveOccurenceButton = true;
                    });
                    removeButtonEL.addEventListener('mouseleave', () => {
                        isMouseOverRemoveOccurenceButton = false;
                    });

                });
            } else {
                new HTMLAreaBuilder().setSelector('textarea.' + id.replace(/\./g, '_')).setAssetsUri(assetsUri).setInline(
                    false).onCreateDialog(
                    createDialogHandler).setFocusHandler(focusHandler.bind(this)).setBlurHandler(blurHandler.bind(this)).setKeydownHandler(
                    keydownHandler).setNodeChangeHandler(notifyValueChanged).setContentPath(
                    this.contentPath).setContent(this.content).setApplicationKeys(this.applicationKeys).setTools({
                    include: this.inputConfig['include'],
                    exclude: this.inputConfig['exclude']
                }).setForcedRootBlock(
                    this.inputConfig['forcedRootBlock'] ? this.inputConfig['forcedRootBlock'][0].value : 'p').setEditableSourceCode(
                    this.editableSourceCode).createEditor().then((editor: HtmlAreaEditor) => {
                    this.setEditorContent(id, property);
                    if (this.notInLiveEdit()) {
                        this.setupStickyEditorToolbarForInputOccurence(textAreaWrapper, id);
                    }
                    this.removeTooltipFromEditorArea(textAreaWrapper);

                    let removeButtonEL = wemjq(textAreaWrapper.getParentElement().getParentElement().getHTMLElement()).find(
                        '.remove-button')[0];
                    removeButtonEL.addEventListener('mouseover', () => {
                        isMouseOverRemoveOccurenceButton = true;
                    });
                    removeButtonEL.addEventListener('mouseleave', () => {
                        isMouseOverRemoveOccurenceButton = false;
                    });

                    this.onShown(() => {
                        // invoke auto resize on shown in case contents have been updated while inactive
                        if (editor['contentAreaContainer'] || editor['bodyElement']) {
                            editor.execCommand('mceAutoResize', false, null, {skip_focus: true});
                        }
                    });
                });

            }
        }

        private moveButtonToBottomBar(inputOccurence: Element, buttonClass: string): void {
            wemjq(inputOccurence.getHTMLElement()).find(buttonClass).appendTo(
                wemjq(inputOccurence.getHTMLElement()).find('.cke_bottom'));
        }

        private setFocusOnEditorAfterCreate(inputOccurence: Element, id: string): void {
            inputOccurence.giveFocus = () => {
                let editor = this.getEditor(id);
                if (editor) {
                    editor.focus();
                    return true;
                } else {
                    return false;
                }
            };
        }

        private setupStickyEditorToolbarForInputOccurence(inputOccurence: Element, editorId: string) {
            let scrollHandler = AppHelper.debounce(() =>
                this.updateStickyEditorToolbar(inputOccurence, this.getEditorInfo(editorId)), 20, false);

            wemjq(this.getHTMLElement()).closest('.form-panel').on('scroll', () => scrollHandler());

            api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
                this.updateEditorToolbarPos(inputOccurence);
                this.updateEditorToolbarWidth(inputOccurence, this.getEditorInfo(editorId));
            });

            this.onRemoved(() => api.ui.responsive.ResponsiveManager.unAvailableSizeChanged(this));

            this.onOccurrenceRendered(() => this.resetInputHeight());

            this.onOccurrenceRemoved(() => this.resetInputHeight());
        }

        private updateStickyEditorToolbar(inputOccurence: Element, editorInfo: HtmlAreaOccurrenceInfo) {
            if (!this.editorTopEdgeIsVisible(inputOccurence) && this.editorLowerEdgeIsVisible(inputOccurence)) {
                if (!editorInfo.hasStickyToolbar) {
                    editorInfo.hasStickyToolbar = true;
                    inputOccurence.addClass('sticky-toolbar');
                    this.updateEditorToolbarWidth(inputOccurence, editorInfo);
                }
                this.updateEditorToolbarPos(inputOccurence);
            } else if (editorInfo.hasStickyToolbar) {
                editorInfo.hasStickyToolbar = false;
                inputOccurence.removeClass('sticky-toolbar');
                this.updateEditorToolbarWidth(inputOccurence, editorInfo);
            }
        }

        private updateEditorToolbarPos(inputOccurence: Element) {
            wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).css({top: this.getToolbarOffsetTop(1)});
        }

        private updateEditorToolbarWidth(inputOccurence: Element, editorInfo: HtmlAreaOccurrenceInfo) {
            if (editorInfo.hasStickyToolbar) {
                // Toolbar in sticky mode has position: fixed which makes it not
                // inherit width of its parent, so we have to explicitly set width
                wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width(inputOccurence.getEl().getWidth() - 3);
            } else {
                wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width('auto');
            }
        }

        private getToolbarClass(): string {
            return this.isCKEditor ? '.cke_top' : '.mce-toolbar-grp';
        }

        private getBottomBarClass(): string {
            return this.isCKEditor ? '.cke_bottom' : '.mce-statusbar';
        }

        private editorTopEdgeIsVisible(inputOccurence: Element): boolean {
            return this.calcDistToTopOfScrlbleArea(inputOccurence) > 0;
        }

        private editorLowerEdgeIsVisible(inputOccurence: Element): boolean {
            const distToTopOfScrlblArea = this.calcDistToTopOfScrlbleArea(inputOccurence);
            const editorToolbarHeight = wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).outerHeight(true);
            const mceStatusToolbarHeight = wemjq(inputOccurence.getHTMLElement()).find(this.getBottomBarClass()).outerHeight(true);
            return (inputOccurence.getEl().getHeightWithoutPadding() - editorToolbarHeight - mceStatusToolbarHeight +
                    distToTopOfScrlblArea) > 0;
        }

        private calcDistToTopOfScrlbleArea(inputOccurence: Element): number {
            return inputOccurence.getEl().getOffsetTop() - this.getToolbarOffsetTop();
        }

        private getToolbarOffsetTop(delta: number = 0): number {
            let toolbar = wemjq(this.getHTMLElement()).closest('.form-panel').find('.wizard-step-navigator-and-toolbar');
            let stickyToolbarHeight = toolbar.outerHeight(true);
            let offset = toolbar.offset();
            let stickyToolbarOffset = offset ? offset.top : 0;

            return stickyToolbarOffset + stickyToolbarHeight + delta;
        }

        private resetInputHeight() {
            wemjq(this.getHTMLElement()).height('auto');
        }

        private setStaticInputHeight() {
            const height = wemjq(this.getHTMLElement()).height();
            if (height !== 0) {
                wemjq(this.getHTMLElement()).height(wemjq(this.getHTMLElement()).height());
            }
        }

        private getEditor(editorId: string): any {
            return this.isCKEditor ? CKEDITOR.instances[editorId] : tinymce.get(editorId);
        }

        isDirty(): boolean {
            return this.editors.some((editor: HtmlAreaOccurrenceInfo) => {
                return this.getEditorContent(editor) !== editor.textAreaEl.getValue();
            });
        }

        private getEditorContent(editor: HtmlAreaOccurrenceInfo) {
            if (this.isCKEditor) {
                return this.getEditor(editor.id).getSnapshot();
            } else {
                return this.getEditor(editor.id).getContent();
            }
        }

        private setEditorContent(editorId: string, property: Property): void {
            let editor = this.getEditor(editorId);
            if (editor) {
                if (this.isCKEditor) {
                    editor.setData(property.hasNonNullValue() ? HTMLAreaHelperCKE.prepareImgSrcsInValueForEdit(property.getString()) : '');
                } else {
                    editor.setContent(property.hasNonNullValue() ? HTMLAreaHelper.prepareImgSrcsInValueForEdit(property.getString()) : '');
                    HTMLAreaHelper.updateImageAlignmentBehaviour(editor);
                }
            } else {
                console.log(`Editor with id '${editorId}' not found`);
            }
        }

        private notInLiveEdit(): boolean {
            return !(wemjq(this.getHTMLElement()).parents('.inspection-panel').length > 0);
        }

        private notifyValueChanged(id: string, occurrence: api.dom.Element) {
            const value = this.isCKEditor ? ValueTypes.STRING.newValue(
                HTMLAreaHelperCKE.prepareEditorImageSrcsBeforeSave(this.getEditor(id).getSnapshot())) : ValueTypes.STRING.newValue(
                HTMLAreaHelper.prepareEditorImageSrcsBeforeSave(this.getEditor(id)));
            this.notifyOccurrenceValueChanged(occurrence, value);
        }

        private isNotActiveElement(htmlAreaIframe: HTMLElement): boolean {
            let activeElement = wemjq(document.activeElement).get(0);

            return htmlAreaIframe !== activeElement;
        }

        private isIframe(element: Element): boolean {
            return element.getEl().getTagName().toLowerCase() === 'iframe';
        }

        valueBreaksRequiredContract(value: Value): boolean {
            return value.isNull() || !value.getType().equals(ValueTypes.STRING) || api.util.StringHelper.isBlank(value.getString());
        }

        hasInputElementValidUserInput(_inputElement: api.dom.Element) {

            // TODO
            return true;
        }

        private removeTooltipFromEditorArea(inputOccurence: Element) {
            wemjq(inputOccurence.getHTMLElement()).find('iframe').removeAttr('title');
        }

        handleDnDStart(ui: JQueryUI.SortableUIParams): void {
            super.handleDnDStart(ui);

            let editorId = wemjq('textarea', ui.item)[0].id;
            this.destroyEditor(editorId);
        }

        refresh() {
            this.editors.forEach((editor) => {
                const editorId = editor.id;

                this.destroyEditor(editorId);
                this.reInitEditor(editorId);
                tinymce.execCommand('mceAddEditor', false, editorId);
            });
        }

        handleDnDStop(ui: JQueryUI.SortableUIParams): void {
            let editorId = wemjq('textarea', ui.item)[0].id;

            this.reInitEditor(editorId);
            tinymce.execCommand('mceAddEditor', false, editorId);

            this.getEditor(editorId).focus();
        }

        onFocus(listener: (event: FocusEvent) => void) {
            this.focusListeners.push(listener);
        }

        unFocus(listener: (event: FocusEvent) => void) {
            this.focusListeners = this.focusListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        onBlur(listener: (event: FocusEvent) => void) {
            this.blurListeners.push(listener);
        }

        unBlur(listener: (event: FocusEvent) => void) {
            this.blurListeners = this.blurListeners.filter((curr) => {
                return curr !== listener;
            });
        }

        private notifyFocused(event: FocusEvent) {
            this.focusListeners.forEach((listener) => {
                listener(event);
            });
        }

        private notifyBlurred(event: FocusEvent) {
            this.blurListeners.forEach((listener) => {
                listener(event);
            });
        }

        private destroyEditor(id: string): void {
            let editor = this.getEditor(id);
            if (editor) {
                try {
                    editor.destroy(false);
                } catch (e) {
                    //error thrown in FF on tab close - XP-2624
                }
            }
        }

        private reInitEditor(id: string) {
            let savedEditor: HtmlAreaOccurrenceInfo = this.getEditorInfo(id);

            if (!!savedEditor) {
                this.initEditor(id, savedEditor.property, savedEditor.textAreaWrapper);
            }
        }

        private getEditorInfo(id: string): HtmlAreaOccurrenceInfo {
            return api.util.ArrayHelper.findElementByFieldValue(this.editors, 'id', id);
        }

    }

    export interface HtmlAreaOccurrenceInfo {
        id: string;
        textAreaWrapper: Element;
        textAreaEl: api.ui.text.TextArea;
        property: Property;
        hasStickyToolbar: boolean;
    }

    api.form.inputtype.InputTypeManager.register(new api.Class('HtmlArea', HtmlArea));
}
