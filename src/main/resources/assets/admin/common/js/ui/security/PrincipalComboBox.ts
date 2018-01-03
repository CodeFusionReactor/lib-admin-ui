namespace api.ui.security {

    import Option = api.ui.selector.Option;
    import Principal = api.security.Principal;
    import PrincipalLoader = api.security.PrincipalLoader;
    import SelectedOption = api.ui.selector.combobox.SelectedOption;
    import BaseSelectedOptionsView = api.ui.selector.combobox.BaseSelectedOptionsView;
    import PrincipalKey = api.security.PrincipalKey;
    import User = api.security.User;
    import SelectedOptionView = api.ui.selector.combobox.SelectedOptionView;
    import RichComboBox = api.ui.selector.combobox.RichComboBox;
    import RichComboBoxBuilder = api.ui.selector.combobox.RichComboBoxBuilder;

    export class PrincipalComboBox
        extends RichComboBox<Principal> {
        constructor(builder: PrincipalComboBoxBuilder) {
            let richComboBoxBuilder = new RichComboBoxBuilder<Principal>().setMaximumOccurrences(
                builder.maxOccurrences).setComboBoxName('principalSelector').setIdentifierMethod('getKey').setLoader(
                builder.loader).setValue(builder.value).setDisplayMissingSelectedOptions(builder.displayMissing).setSelectedOptionsView(
                builder.compactView
                    ? <any>new PrincipalSelectedOptionsViewCompact()
                    : new PrincipalSelectedOptionsView()).setOptionDisplayValueViewer(
                new PrincipalViewer()).setDelayedInputValueChangedHandling(500);

            super(richComboBoxBuilder);
        }

        getLoader() {
            return super.getLoader();
        }

        static create(): PrincipalComboBoxBuilder {
            return new PrincipalComboBoxBuilder();
        }
    }

    export class PrincipalComboBoxBuilder {

        loader: PrincipalLoader = new PrincipalLoader();

        maxOccurrences: number = 0;

        value: string;

        displayMissing: boolean = false;

        compactView: boolean = false;

        setLoader(value: PrincipalLoader): PrincipalComboBoxBuilder {
            this.loader = value;
            return this;
        }

        setMaxOccurences(value: number): PrincipalComboBoxBuilder {
            this.maxOccurrences = value;
            return this;
        }

        setValue(value: string): PrincipalComboBoxBuilder {
            this.value = value;
            return this;
        }

        setDisplayMissing(value: boolean): PrincipalComboBoxBuilder {
            this.displayMissing = value;
            return this;
        }

        setCompactView(value: boolean): PrincipalComboBoxBuilder {
            this.compactView = value;
            return this;
        }

        build(): PrincipalComboBox {
            return new PrincipalComboBox(this);
        }
    }

    export class PrincipalSelectedOptionView
        extends PrincipalViewer
        implements SelectedOptionView<Principal> {

        private option: Option<Principal>;

        constructor(option: Option<Principal>) {
            super('selected-option principal-selected-option-view');
            this.setOption(option);
            this.appendRemoveButton();
        }

        setOption(option: api.ui.selector.Option<Principal>) {
            this.option = option;
            this.setObject(option.displayValue);
        }

        getOption(): api.ui.selector.Option<Principal> {
            return this.option;
        }

    }

    export class PrincipalSelectedOptionsView
        extends BaseSelectedOptionsView<Principal> {

        constructor() {
            super('principal-selected-options-view');
        }

        createSelectedOption(option: Option<Principal>): SelectedOption<Principal> {
            let optionView = !option.empty ? new PrincipalSelectedOptionView(option) : new RemovedPrincipalSelectedOptionView(option);
            return new SelectedOption<Principal>(<any>optionView, this.count());
        }

        makeEmptyOption(id: string): Option<Principal> {

            let key = PrincipalKey.fromString(id);

            return <Option<Principal>>{
                value: id,
                displayValue: <Principal>Principal.create().setKey(key).setDisplayName(key.getId()).build(),
                empty: true
            };
        }

    }

    export class RemovedPrincipalSelectedOptionView
        extends PrincipalSelectedOptionView {

        constructor(option: Option<Principal>) {
            super(option);
            this.addClass('removed');
        }

        resolveSubName(): string {
            return 'This user is deleted';
        }
    }

    export class PrincipalSelectedOptionViewCompact
        extends PrincipalViewerCompact
        implements SelectedOptionView<Principal> {

        private option: Option<Principal>;

        constructor(option: Option<Principal>) {
            super();
            this.setOption(option);
            this.addClass('principal-selected-option-view-compact');
        }

        setReadonly(_readonly: boolean) {
            // must be implemented by children
        }

        setOption(option: api.ui.selector.Option<Principal>) {
            this.option = option;
            this.setObject(option.displayValue);
        }

        getOption(): api.ui.selector.Option<Principal> {
            return this.option;
        }

        onRemoveClicked(_listener: (event: MouseEvent) => void) {
            // to make lint happy
        }

        unRemoveClicked(_listener: (event: MouseEvent) => void) {
            // to make lint happy
        }

    }

    export class PrincipalSelectedOptionsViewCompact
        extends BaseSelectedOptionsView<Principal> {

        private currentUser: User;

        constructor() {
            super('principal-selected-options-view-compact');
            this.loadCurrentUser();
        }

        private loadCurrentUser() {
            return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
                this.currentUser = loginResult.getUser();
            });
        }

        createSelectedOption(option: Option<Principal>): SelectedOption<Principal> {
            let optionView = new PrincipalSelectedOptionViewCompact(option);
            optionView.setCurrentUser(this.currentUser);
            return new SelectedOption<Principal>(<any>optionView, this.count());
        }

    }

}
