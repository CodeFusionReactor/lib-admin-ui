namespace api.application {

    export class StartApplicationRequest extends ApplicationResourceRequest<void, void> {

        private applicationKeys: ApplicationKey[];

        constructor(applicationKeys: ApplicationKey[]) {
            super();
            super.setMethod('POST');
            this.applicationKeys = applicationKeys;
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'start');
        }

        getParams(): Object {
            return {
                key: ApplicationKey.toStringArray(this.applicationKeys)
            };
        }

        sendAndParse(): wemQ.Promise<void> {
            this.send();

            return wemQ<void>(null);
        }
    }
}
