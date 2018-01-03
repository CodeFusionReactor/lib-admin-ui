namespace api.schema.mixin {

    export class Mixin extends api.schema.Schema implements api.Equitable {

        private schemaKey: string;

        private formItems: api.form.FormItem[];

        constructor(builder: MixinBuilder) {
            super(builder);
            this.formItems = builder.formItems;
            this.schemaKey = builder.schemaKey;
        }

        getMixinName(): MixinName {
            return new MixinName(this.getName());
        }

        getFormItems(): api.form.FormItem[] {
            return this.formItems;
        }

        getSchemaKey(): string {
            return this.schemaKey;
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Mixin)) {
                return false;
            }

            if (!super.equals(o)) {
                return false;
            }

            let other = <Mixin>o;

            if (!api.ObjectHelper.stringEquals(this.schemaKey, other.schemaKey)) {
                return false;
            }

            if (!api.ObjectHelper.arrayEquals(this.formItems, other.formItems)) {
                return false;
            }

            return true;
        }

        toForm(): api.form.Form {
            return new api.form.FormBuilder().addFormItems(this.formItems).build();
        }

        static fromJson(json: api.schema.mixin.MixinJson): Mixin {
            return new MixinBuilder().fromMixinJson(json).build();
        }

    }

    export class MixinBuilder extends api.schema.SchemaBuilder {

        schemaKey: string;

        formItems: api.form.FormItem[];

        constructor(source?: Mixin) {
            super(source);
            if (source) {
                this.schemaKey = source.getSchemaKey();
                this.formItems = source.getFormItems();
            }
        }

        fromMixinJson(mixinJson: api.schema.mixin.MixinJson): MixinBuilder {

            super.fromSchemaJson(mixinJson);

            this.formItems = [];
            if(mixinJson.form && mixinJson.form.formItems) {
                mixinJson.form.formItems.forEach((formItemJson) => {
                    let formItem = api.form.FormItemFactory.createFormItem(formItemJson);
                    if (formItem) {
                        this.formItems.push(formItem);
                    }
                });
            }
            this.schemaKey = 'mixin:' + this.name;
            return this;
        }

        build(): Mixin {
            return new Mixin(this);
        }

    }
}
