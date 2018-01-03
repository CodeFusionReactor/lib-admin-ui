namespace api.content {

    import StringHelper = api.util.StringHelper;
    import i18n = api.util.i18n;

    export class ContentUnnamed extends ContentName implements api.Equitable {

        constructor(name: string) {
            super(name);
            api.util.assert(name.indexOf(ContentName.UNNAMED_PREFIX) === 0,
                    'An UnnamedContent must start with [' + ContentName.UNNAMED_PREFIX + ']: ' + name);
        }

        isUnnamed(): boolean {
            return true;
        }

        toString(): string {
            return '';
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ContentUnnamed)) {
                return false;
            }

            if (!super.equals(o)) {
                return false;
            }

            return true;
        }

        public static newUnnamed() {
            return new ContentUnnamed(ContentName.UNNAMED_PREFIX);
        }

        public static prettifyUnnamed(name?: string) {
            if (!name) {
                return `<${ContentUnnamed.getPrettyUnnamed()}>`;
            }

            let prettifiedName = name.replace(/-/g, ' ').trim();
            prettifiedName = StringHelper.capitalizeAll(`${ContentUnnamed.getPrettyUnnamed()} ${prettifiedName}`);

            return `<${prettifiedName}>`;
        }

        public static getPrettyUnnamed(): string {
            return i18n('field.unnamed');
        }
    }
}
