namespace api.content.site.inputtype.authappselector {

    import PropertyTree = api.data.PropertyTree;
    import Option = api.ui.selector.Option;
    import FormView = api.form.FormView;
    import Application = api.application.Application;
    import ApplicationKey = api.application.ApplicationKey;
    import SiteConfig = api.content.site.SiteConfig;
    import ContentFormContext = api.content.form.ContentFormContext;
    import SiteConfiguratorDialog = api.content.site.inputtype.siteconfigurator.SiteConfiguratorDialog;

    export class AuthApplicationSelectedOptionView extends api.ui.selector.combobox.BaseSelectedOptionView<Application> {

        private application: Application;

        private formView: FormView;

        private siteConfig: SiteConfig;

        private siteConfigFormDisplayedListeners: {(applicationKey: ApplicationKey): void}[] = [];

        private formContext: ContentFormContext;

        private formValidityChangedHandler: {(event: api.form.FormValidityChangedEvent): void};

        private readOnly: boolean;

        constructor(option: Option<Application>, siteConfig: SiteConfig, formContext: api.content.form.ContentFormContext,
                    readOnly: boolean = false) {
            super(option);

            this.readOnly = readOnly;

            if (this.readOnly) {
                this.setEditable(false);
                this.setRemovable(false);
            }

            this.application = option.displayValue;
            this.siteConfig = siteConfig;
            this.formContext = formContext;
        }

        doRender(): wemQ.Promise<boolean> {

            let header = new api.dom.DivEl('header');

            let namesAndIconView = new api.app.NamesAndIconView(new api.app.NamesAndIconViewBuilder().setSize(
                api.app.NamesAndIconViewSize.small)).setMainName(this.application.getDisplayName()).setSubName(
                this.application.getName() + '-' + this.application.getVersion()).setIconClass('icon-xlarge icon-puzzle');

            if (this.application.getIconUrl()) {
                namesAndIconView.setIconUrl(this.application.getIconUrl());
            }

            if (this.application.getDescription()) {
                namesAndIconView.setSubName(this.application.getDescription());
            }

            header.appendChild(namesAndIconView);

            this.appendChild(header);
            if (this.application.getAuthForm().getFormItems().length == 0) {
                this.setEditable(false);
            }

            if (!this.readOnly) {
                this.appendActionButtons(header);
            }

            this.formValidityChangedHandler = (event: api.form.FormValidityChangedEvent) => {
                this.toggleClass('invalid', !event.isValid());
            };

            this.formView = this.createFormView(this.siteConfig);
            this.formView.layout();

            return wemQ(true);
        }

        setSiteConfig(siteConfig: SiteConfig) {
            this.siteConfig = siteConfig;
        }

        protected onEditButtonClicked(e: MouseEvent) {
            this.initAndOpenConfigureDialog();

            return super.onEditButtonClicked(e);
        }

        initAndOpenConfigureDialog(comboBoxToUndoSelectionOnCancel?: AuthApplicationComboBox) {

            if (this.application.getAuthForm().getFormItems().length == 0) {
                return;
            }

            let tempSiteConfig: SiteConfig = this.makeTemporarySiteConfig();

            let formViewStateOnDialogOpen = this.formView;
            this.unbindValidationEvent(formViewStateOnDialogOpen);

            this.formView = this.createFormView(tempSiteConfig);
            this.bindValidationEvent(this.formView);

            let okCallback = () => {
                if (!tempSiteConfig.equals(this.siteConfig)) {
                    this.applyTemporaryConfig(tempSiteConfig);
                }
            };

            let cancelCallback = () => {
                this.revertFormViewToGivenState(formViewStateOnDialogOpen);
                if (comboBoxToUndoSelectionOnCancel) {
                    this.undoSelectionOnCancel(comboBoxToUndoSelectionOnCancel);
                }
            };

            let siteConfiguratorDialog = new SiteConfiguratorDialog(this.application,
                this.formView,
                okCallback,
                cancelCallback);

            siteConfiguratorDialog.open();
        }

        private revertFormViewToGivenState(formViewStateToRevertTo: FormView) {
            this.unbindValidationEvent(this.formView);
            this.formView = formViewStateToRevertTo;
            this.formView.validate(false, true);
            this.toggleClass('invalid', !this.formView.isValid());
        }

        private undoSelectionOnCancel(comboBoxToUndoSelectionOnCancel: AuthApplicationComboBox) {
            comboBoxToUndoSelectionOnCancel.deselect(this.application);
        }

        private applyTemporaryConfig(tempSiteConfig: SiteConfig) {
            tempSiteConfig.getConfig().forEach((property) => {
                this.siteConfig.getConfig().setProperty(property.getName(), property.getIndex(), property.getValue());
            });
            this.siteConfig.getConfig().forEach((property) => {
                let prop = tempSiteConfig.getConfig().getProperty(property.getName(), property.getIndex());
                if (!prop) {
                    this.siteConfig.getConfig().removeProperty(property.getName(), property.getIndex());
                }
            });
        }

        private makeTemporarySiteConfig(): SiteConfig {
            let propSet = (new PropertyTree(this.siteConfig.getConfig())).getRoot();
            propSet.setContainerProperty(this.siteConfig.getConfig().getProperty());
            return SiteConfig.create().setConfig(propSet).setApplicationKey(this.siteConfig.getApplicationKey()).build();
        }

        private createFormView(siteConfig: SiteConfig): FormView {
            let formView = new FormView(this.formContext, this.application.getAuthForm(), siteConfig.getConfig());
            formView.addClass('site-form');

            formView.onLayoutFinished(() => {
                formView.validate(false, true);
                this.toggleClass('invalid', !formView.isValid());
                this.notifySiteConfigFormDisplayed(this.application.getApplicationKey());
            });

            return formView;
        }

        private bindValidationEvent(formView: FormView) {
            if (formView) {
                formView.onValidityChanged(this.formValidityChangedHandler);
            }
        }

        private unbindValidationEvent(formView: FormView) {
            if (formView) {
                formView.unValidityChanged(this.formValidityChangedHandler);
            }
        }

        getApplication(): Application {
            return this.application;
        }

        getSiteConfig(): SiteConfig {
            return this.siteConfig;
        }

        getFormView(): FormView {
            return this.formView;
        }

        onSiteConfigFormDisplayed(listener: {(applicationKey: ApplicationKey): void;}) {
            this.siteConfigFormDisplayedListeners.push(listener);
        }

        unSiteConfigFormDisplayed(listener: {(applicationKey: ApplicationKey): void;}) {
            this.siteConfigFormDisplayedListeners =
                this.siteConfigFormDisplayedListeners.filter((curr) => (curr !== listener));
        }

        private notifySiteConfigFormDisplayed(applicationKey: ApplicationKey) {
            this.siteConfigFormDisplayedListeners.forEach((listener) => listener(applicationKey));
        }
    }
}
