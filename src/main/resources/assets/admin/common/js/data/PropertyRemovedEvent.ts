namespace api.data {

    export class PropertyRemovedEvent extends PropertyEvent {

        constructor(property: Property) {
            super(PropertyEventType.REMOVED, property);
        }

        toString(): string {
            let value = this.getProperty().getValue();
            return '' + this.getPath().toString() + ' = ' + (value.getObject() ? value.getObject().toString() : null);
        }
    }
}
