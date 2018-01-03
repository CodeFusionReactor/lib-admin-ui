namespace api.content.site {
    import PropertySet = api.data.PropertySet;
    import PropertyTree = api.data.PropertyTree;
    import ApplicationKey = api.application.ApplicationKey;

    export class SiteConfig implements api.Equitable, api.Cloneable {

        private applicationKey: ApplicationKey;

        private config: PropertySet;

        constructor(builder: SiteConfigBuilder) {
            this.applicationKey = builder.applicationKey;
            this.config = builder.config;
        }

        getApplicationKey(): api.application.ApplicationKey {
            return this.applicationKey;
        }

        getConfig(): PropertySet {
            return this.config;
        }

        toJson(): Object {
            return {
                applicationKey: this.applicationKey.toString(),
                config: this.config.toJson()
            };
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, SiteConfig)) {
                return false;
            }

            let other = <SiteConfig>o;

            if (!api.ObjectHelper.equals(this.applicationKey, other.applicationKey)) {
                return false;
            }

            if (!api.ObjectHelper.equals(this.config, other.config)) {
                return false;
            }

            return true;
        }

        clone(): SiteConfig {

            return new SiteConfigBuilder(this).build();
        }

        static create(): SiteConfigBuilder {
            return new SiteConfigBuilder();
        }
    }

    export class SiteConfigBuilder {

        applicationKey: ApplicationKey;

        config: PropertySet;

        constructor(source?: SiteConfig) {
            if (source) {
                this.applicationKey = source.getApplicationKey();
                if (source.getConfig()) {
                    let newTree = new PropertyTree(source.getConfig());
                    this.config = newTree.getRoot();
                }
            }
        }

        fromData(propertySet: PropertySet): SiteConfigBuilder {
            api.util.assertNotNull(propertySet, 'data cannot be null');
            let applicationKey = ApplicationKey.fromString(propertySet.getString('applicationKey'));
            let siteConfig = propertySet.getPropertySet('config');
            this.setApplicationKey(applicationKey);
            this.setConfig(siteConfig);
            return this;
        }

        setApplicationKey(value: api.application.ApplicationKey): SiteConfigBuilder {
            this.applicationKey = value;
            return this;
        }

        setConfig(value: PropertySet): SiteConfigBuilder {
            this.config = value;
            return this;
        }

        build(): SiteConfig {
            return new SiteConfig(this);
        }
    }

}
