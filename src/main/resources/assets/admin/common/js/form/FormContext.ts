namespace api.form {

    import PropertyPath = api.data.PropertyPath;

    export class FormContext {

        private showEmptyFormItemSetOccurrences: boolean;

        constructor(builder: FormContextBuilder) {
            this.showEmptyFormItemSetOccurrences = builder.showEmptyFormItemSetOccurrences;
        }

        getShowEmptyFormItemSetOccurrences(): boolean {
            return this.showEmptyFormItemSetOccurrences;
        }

        setShowEmptyFormItemSetOccurrences(value: boolean) {
            this.showEmptyFormItemSetOccurrences = value;
        }

        static create(): FormContextBuilder {
            return new FormContextBuilder();
        }

        createInputTypeViewContext(inputTypeConfig: any, parentPropertyPath: PropertyPath,
                                   input: Input): api.form.inputtype.InputTypeViewContext {

            return <api.form.inputtype.InputTypeViewContext> {
                formContext: this,
                input: input,
                inputConfig: inputTypeConfig,
                parentDataPath: parentPropertyPath
            };
        }
    }

    export class FormContextBuilder {

        showEmptyFormItemSetOccurrences: boolean;

        public setShowEmptyFormItemSetOccurrences(value: boolean): FormContextBuilder {
            this.showEmptyFormItemSetOccurrences = value;
            return this;
        }

        public build(): FormContext {
            return new FormContext(this);
        }
    }
}
