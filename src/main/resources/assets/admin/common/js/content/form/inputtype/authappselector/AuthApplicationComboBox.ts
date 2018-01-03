namespace api.content.site.inputtype.authappselector {
    import Application = api.application.Application;
    import ApplicationKey = api.application.ApplicationKey;
    import ApplicationViewer = api.application.ApplicationViewer;
    import FormView = api.form.FormView;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import SiteConfigProvider = api.content.site.inputtype.siteconfigurator.SiteConfigProvider;

    export class AuthApplicationComboBox extends api.ui.selector.combobox.RichComboBox<Application> {

        private authApplicationSelectedOptionsView: AuthApplicationSelectedOptionsView;

        constructor(maxOccurrences: number, siteConfigProvider: SiteConfigProvider,
                    formContext: api.content.form.ContentFormContext, value: string, readOnly: boolean) {

            let builder = new api.ui.selector.combobox.RichComboBoxBuilder<Application>();
            // tslint:disable-next-line:max-line-length
            const view: AuthApplicationSelectedOptionsView = new AuthApplicationSelectedOptionsView(siteConfigProvider, formContext, readOnly);
            builder.
                setMaximumOccurrences(maxOccurrences).
                setIdentifierMethod('getApplicationKey').setComboBoxName('applicationSelector').setLoader(
                new api.security.auth.AuthApplicationLoader()).setSelectedOptionsView(view).
                setOptionDisplayValueViewer(new ApplicationViewer()).
                setValue(value).
                setDelayedInputValueChangedHandling(500);

            super(builder);

            this.authApplicationSelectedOptionsView = view;
        }

        getSelectedOptionViews(): AuthApplicationSelectedOptionView[] {
            let views: AuthApplicationSelectedOptionView[] = [];
            this.getSelectedOptions().forEach((selectedOption: SelectedOption<Application>) => {
                views.push(<AuthApplicationSelectedOptionView>selectedOption.getOptionView());
            });
            return views;
        }

        onSiteConfigFormDisplayed(listener: {(applicationKey: ApplicationKey, formView: FormView): void;}) {
            this.authApplicationSelectedOptionsView.onSiteConfigFormDisplayed(listener);
        }

        unSiteConfigFormDisplayed(listener: {(applicationKey: ApplicationKey, formView: FormView): void;}) {
            this.authApplicationSelectedOptionsView.unSiteConfigFormDisplayed(listener);
        }

        onBeforeOptionCreated(listener: () => void) {
            this.authApplicationSelectedOptionsView.onBeforeOptionCreated(listener);
        }

        unBeforeOptionCreated(listener: () => void) {
            this.authApplicationSelectedOptionsView.unBeforeOptionCreated(listener);
        }

        onAfterOptionCreated(listener: () => void) {
            this.authApplicationSelectedOptionsView.onAfterOptionCreated(listener);
        }

        unAfterOptionCreated(listener: () => void) {
            this.authApplicationSelectedOptionsView.unAfterOptionCreated(listener);
        }
    }

}
